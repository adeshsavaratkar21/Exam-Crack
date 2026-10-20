import json
import datetime
import io
import os
import re
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pypdf import PdfReader
from app.core.config import settings
from app.db.database import get_db
from app.db import models
from app.schemas import schemas
from app.services.gemini_service import gemini_service
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(prefix="/notes", tags=["Mastery & Revision Notes"])


# ─── GET existing notes for a chapter ────────────────────────────────────────

@router.get("/chapter/{chapter_id}", response_model=schemas.DualNotesResponse)
def get_chapter_notes(chapter_id: int, db: Session = Depends(get_db)):
    """
    Retrieves existing Mastery notes for a chapter.
    Returns DualNotesResponse (backward-compat superset) which includes unified_md.
    """
    summary = db.query(models.ChapterSummary).filter(
        models.ChapterSummary.chapter_id == chapter_id
    ).first()

    if not summary:
        raise HTTPException(status_code=404, detail="No notes generated yet for this chapter")

    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    subject = db.query(models.Subject).filter(models.Subject.id == summary.subject_id).first()

    try:
        formulas = json.loads(summary.key_formulas)
    except Exception:
        formulas = []

    try:
        pitfalls = json.loads(summary.pitfalls)
    except Exception:
        pitfalls = []

    try:
        mnemonics = json.loads(summary.mnemonics)
    except Exception:
        mnemonics = []

    # Prefer new unified_md field; fall back to old gemini column
    unified = summary.gemini_summary_md or ""

    return schemas.DualNotesResponse(
        chapter_id=chapter.id,
        chapter_name=chapter.name if chapter else "Chapter",
        subject_name=subject.name if subject else "Subject",
        unified_md=unified,
        gemini_summary_md=unified,
        openai_summary_md=summary.openai_summary_md or "",
        key_formulas=formulas,
        pitfalls=pitfalls,
        mnemonics=mnemonics,
        generated_at=summary.generated_at,
        module_completed=bool(chapter and chapter.is_completed),
        sources_used="Previous Year Exam Papers & University Curricula"
    )


_BOOK_CONTEXT_CACHE: dict = {}

def extract_book_context_for_chapter(subject_code: str, chapter_name: str, topics_str: Optional[str] = None) -> str:
    """
    Scans the subject's uploaded textbooks directory (`backend/uploads/<CODE>/books/*.pdf` and `*.pptx`)
    and extracts the most relevant excerpts for this chapter and its syllabus topics.
    Results are cached in-memory for instant subsequent retrieval.
    """
    sub_code = (subject_code or "").upper().strip()
    cache_key = f"{sub_code}:{chapter_name.strip()}"
    if cache_key in _BOOK_CONTEXT_CACHE:
        return _BOOK_CONTEXT_CACHE[cache_key]

    books_dir = os.path.join(settings.UPLOAD_DIR, sub_code, "books")
    if not os.path.exists(books_dir):
        _BOOK_CONTEXT_CACHE[cache_key] = ""
        return ""

    pdf_files = [
        os.path.join(books_dir, f) for f in os.listdir(books_dir)
        if f.lower().endswith(".pdf")
    ]

    # Build search keywords from chapter name and syllabus topics
    clean_ch = re.sub(r"^(?:Unit\s*\d+\s*[:\-]\s*)", "", chapter_name, flags=re.IGNORECASE)
    keywords = [w.lower() for w in re.findall(r"[a-zA-Z]{4,}", clean_ch)]
    if topics_str:
        try:
            top_list = json.loads(topics_str) if str(topics_str).startswith("[") else str(topics_str).split(",")
            for t in top_list:
                keywords.extend([w.lower() for w in re.findall(r"[a-zA-Z]{4,}", str(t))])
        except Exception:
            pass

    stop_words = {"unit", "chapter", "introduction", "overview", "study", "notes", "basic", "basics", "principles"}
    keywords = list({k for k in keywords if k not in stop_words and len(k) > 3})
    if not keywords:
        keywords = ["concept", "definition", "algorithm", "theory", "theorem"]

    extracted_excerpts = []

    for pdf_path in pdf_files[:2]:
        book_title = os.path.basename(pdf_path)
        try:
            reader = PdfReader(pdf_path)
            total_pages = len(reader.pages)
            scored_pages = []
            
            # Fast bounded sampling: check at most 15 pages across the first 120 pages
            max_check = 15
            step = max(1, min(total_pages, 120) // max_check)
            sample_indices = list(range(0, min(total_pages, 120), step))[:max_check]

            for page_idx in sample_indices:
                try:
                    txt = reader.pages[page_idx].extract_text() or ""
                    if len(txt.strip()) < 60:
                        continue
                    score = sum(len(re.findall(r"\b" + re.escape(kw) + r"\b", txt, re.IGNORECASE)) for kw in keywords)
                    if score > 0:
                        scored_pages.append((score, page_idx, txt))
                        if len(scored_pages) >= 4:
                            break
                except Exception:
                    continue

            scored_pages.sort(key=lambda x: x[0], reverse=True)
            top_pages = scored_pages[:3]
            if top_pages:
                book_snippet = f"--- Excerpts from Prescribed Textbook: {book_title} ---\n"
                for s, p_idx, text in top_pages:
                    cleaned = re.sub(r"\s+", " ", text).strip()
                    book_snippet += f"[Page {p_idx + 1}]: {cleaned[:900]}\n\n"
                extracted_excerpts.append(book_snippet)
        except Exception as e:
            print(f"[BookExtractor] Error reading {book_title}: {e}")

    # Also scan for lecture PPT/PPTX slides
    ppt_files = [
        os.path.join(books_dir, f) for f in os.listdir(books_dir)
        if f.lower().endswith((".pptx", ".ppt"))
    ]
    for ppt_path in ppt_files[:4]:
        ppt_title = os.path.basename(ppt_path)
        try:
            from pptx import Presentation
            prs = Presentation(ppt_path)
            scored_slides = []
            for s_idx, slide in enumerate(prs.slides):
                slide_lines = []
                for shape in slide.shapes:
                    if shape.has_text_frame:
                        for paragraph in shape.text_frame.paragraphs:
                            t = paragraph.text.strip()
                            if t:
                                slide_lines.append(t)
                slide_txt = " ".join(slide_lines)
                if len(slide_txt) < 25:
                    continue
                score = sum(len(re.findall(r"\b" + re.escape(kw) + r"\b", slide_txt, re.IGNORECASE)) for kw in keywords)
                if score > 0 or len(prs.slides) <= 30:
                    scored_slides.append((score, s_idx, slide_txt))

            scored_slides.sort(key=lambda x: x[0], reverse=True)
            top_slides = scored_slides[:6]
            if top_slides:
                ppt_snippet = f"--- Excerpts from Lecture Presentation (PPT): {ppt_title} ---\n"
                for s, s_idx, text in top_slides:
                    cleaned = re.sub(r"\s+", " ", text).strip()
                    ppt_snippet += f"[Slide {s_idx + 1}]: {cleaned[:1000]}\n\n"
        except Exception as e:
            print(f"[PPTExtractor] Error reading {ppt_title}: {e}")

    final_context = "\n".join(extracted_excerpts)[:12000]
    _BOOK_CONTEXT_CACHE[cache_key] = final_context
    return final_context


# ─── Generate mastery notes (single-AI) ──────────────────────────────────────

@router.post("/generate", response_model=schemas.DualNotesResponse)
async def generate_mastery_notes(
    payload: schemas.NotesGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generates step-by-step mastery content using a single Gemini AI pipeline.
    Integrates excerpts from uploaded textbooks (Hopcroft, Sivanandam, etc.).
    """
    chapter = db.query(models.Chapter).filter(models.Chapter.id == payload.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    subject = db.query(models.Subject).filter(models.Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    existing = db.query(models.ChapterSummary).filter(
        models.ChapterSummary.chapter_id == chapter.id
    ).first()

    if existing and not payload.force_regenerate:
        return get_chapter_notes(chapter.id, db)

    # Fetch PYQ context
    pyqs = db.query(models.Question).filter(
        models.Question.chapter_id == chapter.id
    ).all()
    pyq_snippets = [q.text for q in pyqs]

    # Extract relevant excerpts from uploaded textbooks in backend/uploads/<CODE>/books/
    book_context = extract_book_context_for_chapter(
        subject_code=subject.code or "",
        chapter_name=chapter.name,
        topics_str=chapter.topics or ""
    )

    # Determine sources string
    books_dir = os.path.join(settings.UPLOAD_DIR, (subject.code or "").upper(), "books")
    found_books = [f for f in os.listdir(books_dir) if f.lower().endswith(".pdf")] if os.path.exists(books_dir) else []
    sources_desc = f"Prescribed Textbooks ({', '.join(found_books[:2])}) & University PYQs" if found_books else "University Syllabus Curricula & PYQs"

    # Single Gemini generation
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=1) as executor:
        result = await loop.run_in_executor(
            executor,
            gemini_service.generate_mastery_content,
            chapter.name,
            subject.name,
            pyq_snippets,
            book_context,
            chapter.topics
        )

    unified_md = result.get("unified_md", "")
    pitfalls = result.get("pitfalls", [])
    formulas = result.get("formulas", [])

    if not existing:
        existing = models.ChapterSummary(
            chapter_id=chapter.id,
            subject_id=subject.id,
            gemini_summary_md=unified_md,
            openai_summary_md="",        # kept for schema compat
            key_formulas=json.dumps(formulas),
            pitfalls=json.dumps(pitfalls),
            mnemonics=json.dumps([]),
            generated_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        db.add(existing)
    else:
        existing.gemini_summary_md = unified_md
        existing.openai_summary_md = ""
        existing.key_formulas = json.dumps(formulas)
        existing.pitfalls = json.dumps(pitfalls)
        existing.mnemonics = json.dumps([])
        existing.updated_at = datetime.datetime.utcnow()

    db.commit()

    return schemas.DualNotesResponse(
        chapter_id=chapter.id,
        chapter_name=chapter.name,
        subject_name=subject.name,
        unified_md=unified_md,
        gemini_summary_md=unified_md,
        openai_summary_md="",
        key_formulas=formulas,
        pitfalls=pitfalls,
        mnemonics=[],
        generated_at=existing.generated_at,
        module_completed=bool(chapter.is_completed),
        sources_used=sources_desc
    )


# ─── Mark chapter module as complete ─────────────────────────────────────────

@router.post("/chapter/{chapter_id}/complete")
def mark_module_complete(chapter_id: int, db: Session = Depends(get_db)):
    """
    Marks the mastery module as complete (sets chapter.is_completed = True).
    Frontend calls this when the user finishes all stepper steps.
    """
    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    if not chapter.is_completed:
        chapter.is_completed = True
        chapter.completed_at = datetime.datetime.utcnow()
        db.commit()

    return {"chapter_id": chapter_id, "module_completed": True}


# ─── Get revision sheet ───────────────────────────────────────────────────────

@router.get("/chapter/{chapter_id}/sheet", response_model=schemas.RevisionSheetResponse)
def get_revision_sheet(chapter_id: int, db: Session = Depends(get_db)):
    """Retrieves existing revision sheet for a chapter."""
    summary = db.query(models.ChapterSummary).filter(
        models.ChapterSummary.chapter_id == chapter_id
    ).first()

    if not summary or not summary.openai_summary_md:
        raise HTTPException(status_code=404, detail="No revision sheet generated yet")

    # We repurpose openai_summary_md to store the revision sheet JSON
    try:
        sheet_data = json.loads(summary.openai_summary_md)
        if not isinstance(sheet_data, dict) or "summary_md" not in sheet_data:
            raise ValueError("Not sheet JSON")
    except Exception:
        raise HTTPException(status_code=404, detail="No revision sheet generated yet")

    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    subject = db.query(models.Subject).filter(models.Subject.id == summary.subject_id).first()

    return schemas.RevisionSheetResponse(
        chapter_id=chapter_id,
        chapter_name=chapter.name if chapter else "Chapter",
        subject_name=subject.name if subject else "Subject",
        summary_md=sheet_data.get("summary_md", ""),
        formulas=sheet_data.get("formulas", []),
        mnemonics=sheet_data.get("mnemonics", []),
        pitfalls=sheet_data.get("pitfalls", []),
        exam_questions=sheet_data.get("exam_questions", []),
        generated_at=summary.updated_at or summary.generated_at,
    )


# ─── Generate revision sheet ──────────────────────────────────────────────────

@router.post("/sheet/generate", response_model=schemas.RevisionSheetResponse)
async def generate_revision_sheet(
    payload: schemas.RevisionSheetGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generates a structured 1-page revision sheet (stored as JSON in openai_summary_md).
    Locked until chapter module is completed.
    """
    chapter = db.query(models.Chapter).filter(models.Chapter.id == payload.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    if not chapter.is_completed and not payload.force_regenerate:
        raise HTTPException(
            status_code=403,
            detail="Complete the Concept Tutor module first to unlock the revision sheet."
        )

    subject = db.query(models.Subject).filter(models.Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    summary = db.query(models.ChapterSummary).filter(
        models.ChapterSummary.chapter_id == chapter.id
    ).first()

    # Check if sheet already exists and no force_regenerate
    if summary and not payload.force_regenerate:
        try:
            existing_sheet = json.loads(summary.openai_summary_md or "{}")
            if isinstance(existing_sheet, dict) and "summary_md" in existing_sheet:
                return get_revision_sheet(chapter.id, db)
        except Exception:
            pass

    # Fetch PYQ context
    pyqs = db.query(models.Question).filter(
        models.Question.chapter_id == chapter.id
    ).all()
    pyq_snippets = [q.text for q in pyqs]

    existing_pitfalls = []
    existing_formulas = []
    if summary:
        try:
            existing_pitfalls = json.loads(summary.pitfalls or "[]")
        except Exception:
            pass
        try:
            existing_formulas = json.loads(summary.key_formulas or "[]")
        except Exception:
            pass

    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=1) as executor:
        sheet_result = await loop.run_in_executor(
            executor,
            gemini_service.generate_revision_sheet,
            chapter.name,
            subject.name,
            pyq_snippets,
            existing_pitfalls,
            existing_formulas
        )

    sheet_json = json.dumps(sheet_result)

    if summary:
        summary.openai_summary_md = sheet_json
        summary.updated_at = datetime.datetime.utcnow()
    else:
        summary = models.ChapterSummary(
            chapter_id=chapter.id,
            subject_id=subject.id,
            gemini_summary_md="",
            openai_summary_md=sheet_json,
            key_formulas=json.dumps(sheet_result.get("formulas", [])),
            pitfalls=json.dumps(sheet_result.get("pitfalls", [])),
            mnemonics=json.dumps(sheet_result.get("mnemonics", [])),
            generated_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        db.add(summary)

    db.commit()

    return schemas.RevisionSheetResponse(
        chapter_id=chapter.id,
        chapter_name=chapter.name,
        subject_name=subject.name,
        summary_md=sheet_result.get("summary_md", ""),
        formulas=sheet_result.get("formulas", []),
        mnemonics=sheet_result.get("mnemonics", []),
        pitfalls=sheet_result.get("pitfalls", []),
        exam_questions=sheet_result.get("exam_questions", []),
        generated_at=datetime.datetime.utcnow(),
    )


# ─── Export endpoints (kept for backward-compat) ─────────────────────────────

@router.get("/export/markdown/{chapter_id}")
def export_notes_markdown(chapter_id: int, db: Session = Depends(get_db)):
    """Exports mastery notes as a clean, downloadable Markdown document."""
    summary = db.query(models.ChapterSummary).filter(
        models.ChapterSummary.chapter_id == chapter_id
    ).first()

    if not summary:
        raise HTTPException(status_code=404, detail="Notes not found for this chapter")

    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    subject = db.query(models.Subject).filter(models.Subject.id == summary.subject_id).first()

    ch_name = chapter.name if chapter else f"Chapter_{chapter_id}"
    sub_name = subject.name if subject else "Subject"

    md_content = f"""# 📑 Mastery & Revision Notes
**Subject:** {sub_name}  
**Chapter:** {ch_name}  
**Generated:** {summary.generated_at.strftime('%Y-%m-%d %H:%M UTC')}  
*Synthesized using Google Gemini AI — Mastery & Revision Suite*

---

{summary.gemini_summary_md}

---
*Created with ExamPrepAI — Mastery & Revision Suite*
"""

    filename = f"{ch_name.replace(' ', '_')}_Mastery_Notes.md"
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/export/pdf/{chapter_id}")
def export_notes_pdf(chapter_id: int, db: Session = Depends(get_db)):
    """Generates a printable PDF of the Mastery Notes."""
    summary = db.query(models.ChapterSummary).filter(
        models.ChapterSummary.chapter_id == chapter_id
    ).first()

    if not summary:
        raise HTTPException(status_code=404, detail="Notes not found for this chapter")

    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    subject = db.query(models.Subject).filter(models.Subject.id == summary.subject_id).first()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'],
        fontSize=18, leading=22,
        textColor=colors.HexColor('#1E1B4B'), spaceAfter=10
    )
    h2_style = ParagraphStyle(
        'H2', parent=styles['Heading2'],
        fontSize=13, leading=16,
        textColor=colors.HexColor('#4338CA'), spaceBefore=8, spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body', parent=styles['BodyText'],
        fontSize=9, leading=12,
        textColor=colors.HexColor('#1F2937'), spaceAfter=4
    )

    story = []
    story.append(Paragraph(f"<b>ExamPrepAI — Mastery & Revision Suite</b>", title_style))
    story.append(Paragraph(
        f"<b>Subject:</b> {subject.name} | <b>Chapter:</b> {chapter.name} | <b>Weightage:</b> {chapter.weightage_percent}%",
        body_style
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Mastery Notes</b>", h2_style))

    for line in summary.gemini_summary_md.split("\n"):
        clean = line.strip().replace("#", "").replace("*", "")
        if clean:
            story.append(Paragraph(clean[:160], body_style))
        if len(story) > 40:
            break

    doc.build(story)
    buffer.seek(0)

    filename = f"{chapter.name.replace(' ', '_')}_Mastery_Notes.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ─── POST AI Tutor Chat / Doubt Resolution ──────────────────────────────────

@router.post("/chat", response_model=schemas.TutorChatResponse)
def ask_tutor_doubt(
    payload: schemas.TutorChatRequest,
    db: Session = Depends(get_db)
):
    """
    Interactive AI Doubt resolution endpoint.
    Answers student questions on specific chapter concepts grounded in textbooks and curriculum.
    """
    chapter = db.query(models.Chapter).filter(models.Chapter.id == payload.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    subject = db.query(models.Subject).filter(models.Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Extract relevant textbook excerpts for grounding
    book_context = extract_book_context_for_chapter(subject.code or "", chapter.name, chapter.topics or [])

    history_dicts = [{"role": h.role, "content": h.content} for h in (payload.history or [])]

    result = gemini_service.answer_student_doubt(
        subject_name=subject.name,
        chapter_name=chapter.name,
        student_message=payload.message,
        chat_history=history_dicts,
        book_context=book_context,
        current_topic=payload.current_topic
    )

    return schemas.TutorChatResponse(
        reply=result.get("reply", ""),
        suggested_questions=result.get("suggested_questions", [])
    )

