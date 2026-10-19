import os
import re
import shutil
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas import schemas
from app.services.pdf_service import pdf_service
from app.services.gemini_service import gemini_service
from app.core.config import settings

router = APIRouter(prefix="/pyq", tags=["Previous Year Questions"])


@router.post("/upload", response_model=schemas.PYQExtractResponse)
async def upload_pyq_document(
    file: UploadFile = File(...),
    subject_id: int = Form(...),
    exam_year: str = Form("2024"),
    exam_session: str = Form("End-Semester"),
    db: Session = Depends(get_db)
):
    """
    Uploads a PYQ PDF document, extracts its text, and parses structured questions via AI.
    """
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF documents are supported")

    # Save PDF into subject-specific folder (e.g. uploads/DC, uploads/SE)
    subject_folder = os.path.join(settings.UPLOAD_DIR, subject.code or f"subject_{subject_id}")
    os.makedirs(subject_folder, exist_ok=True)
    safe_filename = f"{subject_id}_{int(os.times().elapsed)}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(subject_folder, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text using pdf_service
    try:
        extracted_text = pdf_service.extract_text(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {str(e)}")

    # Fetch existing chapters for this subject to help categorization
    chapters = db.query(models.Chapter).filter(models.Chapter.subject_id == subject_id).all()
    chapter_names = [ch.name for ch in chapters]
    chapter_map = {ch.name.lower().strip(): ch.id for ch in chapters}

    # Extract structured questions via Gemini / intelligent fallback
    extracted_questions_raw = gemini_service.extract_questions_from_pyq(
        pyq_text=extracted_text,
        subject_name=subject.name,
        chapter_names=chapter_names
    )

    # Create PYQDocument record
    pyq_doc = models.PYQDocument(
        subject_id=subject_id,
        filename=file.filename,
        file_path=file_path,
        exam_year=exam_year,
        exam_session=exam_session,
        total_questions_extracted=len(extracted_questions_raw)
    )
    db.add(pyq_doc)
    db.flush()

    # Store extracted questions in DB
    created_questions = []
    for q_data in extracted_questions_raw:
        # Match chapter
        matched_chapter_id = None
        raw_ch_name = q_data.get("chapter_name", "").lower().strip()
        for ch in chapters:
            if ch.name.lower() in raw_ch_name or raw_ch_name in ch.name.lower():
                matched_chapter_id = ch.id
                break
        
        # If no match and chapters exist, assign to first chapter or leave None
        if not matched_chapter_id and chapters:
            matched_chapter_id = chapters[0].id

        tags = q_data.get("tags", [])
        if isinstance(tags, str):
            tags = [tags]

        question_obj = models.Question(
            subject_id=subject_id,
            chapter_id=matched_chapter_id,
            pyq_doc_id=pyq_doc.id,
            text=q_data.get("text", "Exam Question"),
            question_type=q_data.get("question_type", "Short"),
            marks=float(q_data.get("marks", 5.0)),
            solution=q_data.get("solution"),
            difficulty=q_data.get("difficulty", "Medium"),
            exam_year=exam_year,
            source_paper=f"{exam_session} {exam_year} ({file.filename})",
            tags=json.dumps(tags)
        )
        db.add(question_obj)
        db.flush()

        created_questions.append(
            schemas.QuestionResponse(
                id=question_obj.id,
                subject_id=subject_id,
                chapter_id=matched_chapter_id,
                pyq_doc_id=pyq_doc.id,
                text=question_obj.text,
                question_type=question_obj.question_type,
                marks=question_obj.marks,
                solution=question_obj.solution,
                difficulty=question_obj.difficulty,
                exam_year=question_obj.exam_year,
                source_paper=question_obj.source_paper,
                chapter_name=next((ch.name for ch in chapters if ch.id == matched_chapter_id), "General"),
                tags=tags,
                created_at=question_obj.created_at
            )
        )

    db.commit()

    return schemas.PYQExtractResponse(
        doc_id=pyq_doc.id,
        filename=pyq_doc.filename,
        exam_year=pyq_doc.exam_year,
        exam_session=pyq_doc.exam_session,
        total_extracted=len(created_questions),
        questions=created_questions
    )


@router.get("/documents", response_model=List[dict])
def list_pyq_documents(subject_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Lists uploaded PYQ documents with extraction statistics.
    """
    query = db.query(models.PYQDocument)
    if subject_id:
        query = query.filter(models.PYQDocument.subject_id == subject_id)
    
    docs = query.order_by(models.PYQDocument.uploaded_at.desc()).all()
    results = []
    for doc in docs:
        subject = db.query(models.Subject).filter(models.Subject.id == doc.subject_id).first()
        results.append({
            "id": doc.id,
            "filename": doc.filename,
            "exam_year": doc.exam_year,
            "exam_session": doc.exam_session,
            "subject_id": doc.subject_id,
            "subject_name": subject.name if subject else "Unknown",
            "total_questions_extracted": doc.total_questions_extracted,
            "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None
        })
    return results


@router.get("/questions", response_model=List[schemas.QuestionResponse])
def get_questions(
    subject_id: Optional[int] = None,
    chapter_id: Optional[int] = None,
    question_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Search and filter PYQ question bank by subject, chapter, type, difficulty, and keywords.
    """
    query = db.query(models.Question)
    if subject_id:
        query = query.filter(models.Question.subject_id == subject_id)
    if chapter_id:
        query = query.filter(models.Question.chapter_id == chapter_id)
    if question_type and question_type != "All":
        query = query.filter(models.Question.question_type == question_type)
    if difficulty and difficulty != "All":
        query = query.filter(models.Question.difficulty == difficulty)
    if search:
        query = query.filter(models.Question.text.ilike(f"%{search}%"))

    questions = query.order_by(models.Question.id.desc()).all()
    response = []
    for q in questions:
        tags_list = []
        try:
            tags_list = json.loads(q.tags) if q.tags else []
        except Exception:
            tags_list = []
        
        chapter_name = q.chapter.name if q.chapter else "General"
        response.append(schemas.QuestionResponse(
            id=q.id,
            subject_id=q.subject_id,
            chapter_id=q.chapter_id,
            pyq_doc_id=q.pyq_doc_id,
            text=q.text,
            question_type=q.question_type,
            marks=q.marks,
            solution=q.solution,
            difficulty=q.difficulty,
            exam_year=q.exam_year,
            source_paper=q.source_paper,
            chapter_name=chapter_name,
            tags=tags_list,
            created_at=q.created_at
        ))
    return response


@router.delete("/documents/{doc_id}")
def delete_pyq_document(doc_id: int, db: Session = Depends(get_db)):
    """
    Deletes a PYQ document and associated questions.
    """
    doc = db.query(models.PYQDocument).filter(models.PYQDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"message": "Document and extracted questions deleted successfully"}


MONTH_MAP = {
    "jan": "January", "feb": "February", "mar": "March", "apr": "April",
    "may": "May", "jun": "June", "jul": "July", "aug": "August",
    "sep": "September", "oct": "October", "nov": "November", "dec": "December"
}


def parse_paper_metadata(filename: str, sub_code: str, file_path: str) -> dict:
    base_name = os.path.splitext(filename)[0]
    ext = os.path.splitext(filename)[1].lower()
    size_bytes = os.path.getsize(file_path) if os.path.exists(file_path) else 0
    if size_bytes >= 1024 * 1024:
        size_formatted = f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        size_formatted = f"{max(1, round(size_bytes / 1024))} KB"

    clean_upper = base_name.upper()
    exam_type = "University Examination Paper"
    exam_tag = "ESE"
    if clean_upper.startswith("E_") or clean_upper.startswith("E.") or clean_upper.startswith("E"):
        exam_type = "End-Semester Examination (ESE)"
        exam_tag = "ESE"
    elif clean_upper.startswith("M_") or clean_upper.startswith("M.") or clean_upper.startswith("M"):
        exam_type = "Mid-Semester Examination (MSE)"
        exam_tag = "MSE"
    elif clean_upper.startswith("R_") or clean_upper.startswith("R.") or clean_upper.startswith("R"):
        exam_type = "Re-Examination / KT Paper"
        exam_tag = "KT"
    elif clean_upper.startswith("S_") or clean_upper.startswith("S.") or clean_upper.startswith("S"):
        exam_type = "Supplementary / Summer Paper"
        exam_tag = "SUMMER"

    month_detected = ""
    lower_name = base_name.lower()
    for m_key, m_full in MONTH_MAP.items():
        if m_key in lower_name:
            month_detected = m_full
            break

    # Look for 2-digit or 4-digit year e.g. 18..26 or 2018..2026
    year_match = re.search(r'(20\d\d)|(?<!\d)(1[8-9]|2[0-9])(?!\d)', base_name)
    if year_match:
        yr = year_match.group(0)
        year_detected = f"20{yr}" if len(yr) == 2 else yr
    else:
        year_detected = "Recent"

    session_str = f"{month_detected} {year_detected}".strip() if month_detected else year_detected
    title = f"{sub_code} {exam_type} — {session_str}" if session_str else f"{sub_code} {exam_type}"

    return {
        "filename": filename,
        "title": title,
        "subject_code": sub_code,
        "exam_type": exam_type,
        "exam_tag": exam_tag,
        "exam_session": session_str,
        "exam_year": year_detected,
        "month": month_detected,
        "file_size": size_formatted,
        "file_size_bytes": size_bytes,
        "file_url": f"/uploads/{sub_code}/{filename}",
        "file_ext": ext,
        "is_pdf": ext == ".pdf",
        "modified_at": os.path.getmtime(file_path) if os.path.exists(file_path) else None
    }


@router.get("/subject-papers/{identifier}")
def get_subject_papers(identifier: str, db: Session = Depends(get_db)):
    """
    Returns all PYQ exam papers (PDFs/Images) uploaded for a specific subject (by code or ID).
    """
    subject = None
    if identifier.isdigit():
        subject = db.query(models.Subject).filter(models.Subject.id == int(identifier)).first()
    if not subject:
        subject = db.query(models.Subject).filter(models.Subject.code.ilike(identifier)).first()

    sub_code = subject.code if subject else identifier.upper()
    sub_dir = os.path.join(settings.UPLOAD_DIR, sub_code)

    if not os.path.exists(sub_dir):
        return {
            "subject_id": subject.id if subject else None,
            "subject_code": sub_code,
            "subject_name": subject.name if subject else sub_code,
            "total_papers": 0,
            "papers": []
        }

    raw_files = [
        f for f in os.listdir(sub_dir)
        if f.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png'))
    ]

    papers = []
    for f in raw_files:
        full_p = os.path.join(sub_dir, f)
        meta = parse_paper_metadata(f, sub_code, full_p)
        papers.append(meta)

    # Sort papers by year descending, then by month
    def sort_key(p):
        try:
            yr = int(p["exam_year"])
        except Exception:
            yr = 2000
        return yr

    papers.sort(key=sort_key, reverse=True)

    return {
        "subject_id": subject.id if subject else None,
        "subject_code": sub_code,
        "subject_name": subject.name if subject else sub_code,
        "total_papers": len(papers),
        "papers": papers
    }


@router.get("/all-papers")
def get_all_papers(db: Session = Depends(get_db)):
    """
    Returns all uploaded PYQ papers grouped across all active subjects.
    """
    subjects = db.query(models.Subject).order_by(models.Subject.id).all()
    grouped = {}
    total_count = 0

    for sub in subjects:
        sub_code = sub.code
        sub_dir = os.path.join(settings.UPLOAD_DIR, sub_code)
        papers = []
        if os.path.exists(sub_dir):
            for f in os.listdir(sub_dir):
                if f.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png')):
                    full_p = os.path.join(sub_dir, f)
                    papers.append(parse_paper_metadata(f, sub_code, full_p))

            def sort_key(p):
                try:
                    yr = int(p["exam_year"])
                except Exception:
                    yr = 2000
                return yr
            papers.sort(key=sort_key, reverse=True)

        total_count += len(papers)
        grouped[sub_code] = {
            "subject_id": sub.id,
            "subject_name": sub.name,
            "subject_code": sub_code,
            "course_code": sub.course_code,
            "count": len(papers),
            "papers": papers
        }

    return {
        "total_papers_all_subjects": total_count,
        "subjects": grouped
    }

