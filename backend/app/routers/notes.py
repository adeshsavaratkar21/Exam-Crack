import json
import datetime
import io
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas import schemas
from app.services.gemini_service import gemini_service
from app.services.openai_service import openai_service
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(prefix="/notes", tags=["Dual-AI Revision Notes"])


@router.get("/chapter/{chapter_id}", response_model=schemas.DualNotesResponse)
def get_chapter_notes(chapter_id: int, db: Session = Depends(get_db)):
    """
    Retrieves existing Dual-AI 1-Page Revision Summaries for a chapter.
    """
    summary = db.query(models.ChapterSummary).filter(
        models.ChapterSummary.chapter_id == chapter_id
    ).first()

    if not summary:
        raise HTTPException(status_code=404, detail="No revision notes generated yet for this chapter")

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

    return schemas.DualNotesResponse(
        chapter_id=chapter.id,
        chapter_name=chapter.name if chapter else "Chapter",
        subject_name=subject.name if subject else "Subject",
        gemini_summary_md=summary.gemini_summary_md,
        openai_summary_md=summary.openai_summary_md,
        key_formulas=formulas,
        pitfalls=pitfalls,
        mnemonics=mnemonics,
        generated_at=summary.generated_at,
        sources_used="Previous Year Exam Papers & University Curricula"
    )


@router.post("/generate", response_model=schemas.DualNotesResponse)
async def generate_dual_notes(
    payload: schemas.NotesGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generates two distinct 1-page structured revision summaries in parallel:
    - Gemini: Theory, Definitions, Derivations, Pitfalls
    - OpenAI: Mnemonics, Quick Formulas, Comparison Tables
    """
    chapter = db.query(models.Chapter).filter(models.Chapter.id == payload.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    subject = db.query(models.Subject).filter(models.Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # If already generated and force_regenerate is False, return cached
    existing = db.query(models.ChapterSummary).filter(
        models.ChapterSummary.chapter_id == chapter.id
    ).first()

    if existing and not payload.force_regenerate:
        return get_chapter_notes(chapter.id, db)

    # Fetch PYQ questions from this chapter for high-yield context
    pyqs = db.query(models.Question).filter(
        models.Question.chapter_id == chapter.id
    ).all()
    pyq_snippets = [q.text for q in pyqs]

    # Run Gemini and OpenAI generations in parallel threads
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=2) as executor:
        gemini_future = loop.run_in_executor(
            executor,
            gemini_service.generate_theory_summary,
            chapter.name,
            subject.name,
            pyq_snippets
        )
        openai_future = loop.run_in_executor(
            executor,
            openai_service.generate_mnemonic_summary,
            chapter.name,
            subject.name,
            pyq_snippets
        )

        gemini_result, openai_result = await asyncio.gather(gemini_future, openai_future)

    gemini_md = gemini_result.get("summary_md", "")
    openai_md = openai_result.get("summary_md", "")
    pitfalls = gemini_result.get("pitfalls", [])
    mnemonics = openai_result.get("mnemonics", [])
    formulas = list(set(gemini_result.get("formulas", []) + openai_result.get("formulas", [])))

    # Save or update summary
    if not existing:
        existing = models.ChapterSummary(
            chapter_id=chapter.id,
            subject_id=subject.id,
            gemini_summary_md=gemini_md,
            openai_summary_md=openai_md,
            key_formulas=json.dumps(formulas),
            pitfalls=json.dumps(pitfalls),
            mnemonics=json.dumps(mnemonics),
            generated_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        db.add(existing)
    else:
        existing.gemini_summary_md = gemini_md
        existing.openai_summary_md = openai_md
        existing.key_formulas = json.dumps(formulas)
        existing.pitfalls = json.dumps(pitfalls)
        existing.mnemonics = json.dumps(mnemonics)
        existing.updated_at = datetime.datetime.utcnow()

    # Automatically mark chapter as completed if not already marked
    if not chapter.is_completed:
        chapter.is_completed = True
        chapter.completed_at = datetime.datetime.utcnow()

    db.commit()

    return schemas.DualNotesResponse(
        chapter_id=chapter.id,
        chapter_name=chapter.name,
        subject_name=subject.name,
        gemini_summary_md=gemini_md,
        openai_summary_md=openai_md,
        key_formulas=formulas,
        pitfalls=pitfalls,
        mnemonics=mnemonics,
        generated_at=existing.generated_at,
        sources_used="Previous Year Exam Papers & University Curricula"
    )


@router.get("/export/markdown/{chapter_id}")
def export_notes_markdown(chapter_id: int, db: Session = Depends(get_db)):
    """
    Exports combined Dual-AI notes as a clean, downloadable Markdown document.
    """
    summary = db.query(models.ChapterSummary).filter(
        models.ChapterSummary.chapter_id == chapter_id
    ).first()

    if not summary:
        raise HTTPException(status_code=404, detail="Notes not found for this chapter")

    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    subject = db.query(models.Subject).filter(models.Subject.id == summary.subject_id).first()

    ch_name = chapter.name if chapter else f"Chapter_{chapter_id}"
    sub_name = subject.name if subject else "Subject"

    md_content = f"""# 📑 Dual-AI High-Yield Exam Revision Notes
**Subject:** {sub_name}  
**Chapter:** {ch_name}  
**Generated:** {summary.generated_at.strftime('%Y-%m-%d %H:%M UTC')}  
*Synthesized using Google Gemini (Theory & Proofs) and OpenAI ChatGPT (Mnemonics & Formulas)*

---

## 🏛️ PART 1: Google Gemini — Theory, Derivations & Traps
{summary.gemini_summary_md}

---

## ⚡ PART 2: OpenAI ChatGPT — Mnemonics, Fast Formulas & Comparison Tables
{summary.openai_summary_md}

---
*Created with ExamPrepAI — Antigravity Production Platform*
"""

    filename = f"{ch_name.replace(' ', '_')}_DualAI_Notes.md"
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/export/pdf/{chapter_id}")
def export_notes_pdf(chapter_id: int, db: Session = Depends(get_db)):
    """
    Generates and downloads a clean, printable PDF of the Dual-AI Revision Notes.
    """
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
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1E1B4B'),
        spaceAfter=10
    )
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#4338CA'),
        spaceBefore=8,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['BodyText'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=4
    )

    story = []
    story.append(Paragraph(f"<b>ExamPrepAI — Dual-AI 1-Page Revision Sheet</b>", title_style))
    story.append(Paragraph(f"<b>Subject:</b> {subject.name} | <b>Chapter:</b> {chapter.name} | <b>Weightage:</b> {chapter.weightage_percent}%", body_style))
    story.append(Spacer(1, 10))

    # Gemini Section
    story.append(Paragraph("<b>Section A: Google Gemini (Theory, Derivations & Pitfalls)</b>", h2_style))
    # Add paragraphs from Gemini
    for line in summary.gemini_summary_md.split("\n"):
        clean = line.strip().replace("#", "").replace("*", "")
        if clean:
            story.append(Paragraph(clean[:140], body_style))
        if len(story) > 18:
            break

    story.append(Spacer(1, 12))

    # OpenAI Section
    story.append(Paragraph("<b>Section B: OpenAI ChatGPT (Mnemonics & Quick Reference)</b>", h2_style))
    for line in summary.openai_summary_md.split("\n"):
        clean = line.strip().replace("#", "").replace("*", "")
        if clean:
            story.append(Paragraph(clean[:140], body_style))
        if len(story) > 36:
            break

    doc.build(story)
    buffer.seek(0)

    filename = f"{chapter.name.replace(' ', '_')}_Revision_Notes.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
