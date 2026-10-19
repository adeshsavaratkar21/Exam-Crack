import datetime
import json
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas import schemas
from app.services.analytics_service import analytics_service
from app.core.config import settings

router = APIRouter(tags=["Analytics & Syllabus Management"])


# ---------------- SUBJECTS ---------------- #
@router.get("/subjects", response_model=List[schemas.SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    """
    Returns all subjects with calculated readiness and chapter counts.
    """
    subjects = db.query(models.Subject).order_by(models.Subject.id).all()
    results = []
    for s in subjects:
        ch_count = len(s.chapters)
        
        # Calculate real uploaded papers count from disk
        sub_dir = os.path.join(settings.UPLOAD_DIR, s.code)
        disk_count = 0
        if os.path.exists(sub_dir):
            disk_count = len([f for f in os.listdir(sub_dir) if f.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png'))])
        pyq_count = max(len(s.pyq_documents), disk_count)
        
        # Calculate subject readiness
        report = analytics_service.get_subject_readiness_report(db, s.id)
        overall_readiness = report["overall_readiness_index"] if report else 0.0

        exam_scheme_parsed = None
        if s.exam_scheme:
            try:
                exam_scheme_parsed = json.loads(s.exam_scheme)
            except Exception:
                pass

        results.append(schemas.SubjectResponse(
            id=s.id,
            name=s.name,
            code=s.code,
            course_code=s.course_code,
            credits=s.credits or 4,
            target_exam=s.target_exam,
            total_marks=s.total_marks,
            exam_scheme=exam_scheme_parsed,
            created_at=s.created_at,
            chapter_count=ch_count,
            pyq_count=pyq_count,
            overall_readiness=overall_readiness
        ))
    return results


@router.post("/subjects", response_model=schemas.SubjectDetailResponse)
def create_subject(payload: schemas.SubjectCreate, db: Session = Depends(get_db)):
    """
    Creates a new subject along with chapters and initial weightage distributions.
    """
    subject = models.Subject(
        name=payload.name,
        code=payload.code,
        target_exam=payload.target_exam or "Semester Exam",
        total_marks=payload.total_marks or 100.0,
        created_at=datetime.datetime.utcnow()
    )
    db.add(subject)
    db.flush()

    total_chapters = len(payload.chapters) if payload.chapters else 1
    default_pct = round(100.0 / total_chapters, 1)

    created_chapters = []
    if payload.chapters:
        for idx, ch in enumerate(payload.chapters):
            ch_obj = models.Chapter(
                subject_id=subject.id,
                name=ch.name,
                order=ch.order or (idx + 1),
                weightage_marks=ch.weightage_marks or ((default_pct / 100.0) * subject.total_marks),
                weightage_percent=ch.weightage_percent or default_pct,
                is_completed=ch.is_completed or False
            )
            db.add(ch_obj)
            db.flush()
            created_chapters.append(ch_obj)
    else:
        # Default starter chapter
        ch_obj = models.Chapter(
            subject_id=subject.id,
            name="Chapter 1: Foundations & Architecture",
            order=1,
            weightage_marks=20.0,
            weightage_percent=20.0,
            is_completed=False
        )
        db.add(ch_obj)
        db.flush()
        created_chapters.append(ch_obj)

    db.commit()

    return schemas.SubjectDetailResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        target_exam=subject.target_exam,
        total_marks=subject.total_marks,
        created_at=subject.created_at,
        chapter_count=len(created_chapters),
        pyq_count=0,
        overall_readiness=0.0,
        chapters=[
            schemas.ChapterResponse(
                id=c.id,
                subject_id=c.subject_id,
                name=c.name,
                order=c.order,
                weightage_marks=c.weightage_marks,
                weightage_percent=c.weightage_percent,
                is_completed=c.is_completed,
                completed_at=c.completed_at,
                questions_count=0,
                accuracy_score=0.0,
                readiness_index=0.0,
                priority_level="HIGH FOCUS"
            ) for c in created_chapters
        ]
    )


@router.get("/subjects/{subject_id}", response_model=schemas.SubjectDetailResponse)
def get_subject_detail(subject_id: int, db: Session = Depends(get_db)):
    """
    Returns detailed subject data including chapters, metrics, and question counts.
    """
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    chapters = db.query(models.Chapter).filter(models.Chapter.subject_id == subject.id).order_by(models.Chapter.order).all()
    chapters_out = []

    for ch in chapters:
        q_count = db.query(models.Question).filter(models.Question.chapter_id == ch.id).count()
        metrics = analytics_service.calculate_chapter_metrics(db, ch.id)

        topics_parsed = []
        if ch.topics:
            try:
                topics_parsed = json.loads(ch.topics)
            except Exception:
                pass

        chapters_out.append(schemas.ChapterResponse(
            id=ch.id,
            subject_id=ch.subject_id,
            name=ch.name,
            unit_number=ch.unit_number or ch.order,
            order=ch.order,
            teaching_hours=ch.teaching_hours or 8,
            weightage_marks=ch.weightage_marks,
            estimated_ese_marks=ch.estimated_ese_marks or ch.weightage_marks,
            weightage_percent=ch.weightage_percent,
            topics=topics_parsed,
            is_completed=ch.is_completed,
            completed_at=ch.completed_at,
            questions_count=q_count,
            accuracy_score=metrics["accuracy"],
            readiness_index=metrics["readiness_index"],
            priority_level=metrics["priority_quadrant"]
        ))

    report = analytics_service.get_subject_readiness_report(db, subject.id)
    overall_readiness = report["overall_readiness_index"] if report else 0.0

    exam_scheme_parsed = None
    if subject.exam_scheme:
        try:
            exam_scheme_parsed = json.loads(subject.exam_scheme)
        except Exception:
            pass

    sub_dir = os.path.join(settings.UPLOAD_DIR, subject.code)
    disk_count = 0
    if os.path.exists(sub_dir):
        disk_count = len([f for f in os.listdir(sub_dir) if f.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png'))])
    real_pyq_count = max(len(subject.pyq_documents), disk_count)

    return schemas.SubjectDetailResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        course_code=subject.course_code,
        credits=subject.credits or 4,
        target_exam=subject.target_exam,
        total_marks=subject.total_marks,
        exam_scheme=exam_scheme_parsed,
        created_at=subject.created_at,
        chapter_count=len(chapters),
        pyq_count=real_pyq_count,
        overall_readiness=overall_readiness,
        chapters=chapters_out
    )


# ---------------- READINESS TRACKER & WEIGHTAGE ---------------- #
@router.get("/analytics/subject/{subject_id}", response_model=schemas.SubjectReadinessReport)
def get_subject_readiness(subject_id: int, db: Session = Depends(get_db)):
    """
    Calculates the Exam Readiness Index and highlights high-weightage, low-accuracy topics.
    """
    report = analytics_service.get_subject_readiness_report(db, subject_id)
    if not report:
        raise HTTPException(status_code=404, detail="Subject not found")
    return report


@router.post("/analytics/weightage")
def update_weightage_distribution(
    payload: schemas.UpdateWeightageBatchRequest,
    db: Session = Depends(get_db)
):
    """
    Updates total marks and chapter-wise weightage distribution.
    """
    subject = db.query(models.Subject).filter(models.Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    subject.total_marks = payload.total_marks

    total_weight_marks = sum(item.weightage_marks for item in payload.chapters) or 1.0

    for item in payload.chapters:
        ch = db.query(models.Chapter).filter(
            models.Chapter.id == item.chapter_id,
            models.Chapter.subject_id == payload.subject_id
        ).first()
        if ch:
            ch.weightage_marks = item.weightage_marks
            ch.weightage_percent = round((item.weightage_marks / total_weight_marks) * 100.0, 1)

    db.commit()

    return analytics_service.get_subject_readiness_report(db, payload.subject_id)


@router.post("/syllabus/chapter/{chapter_id}/toggle-complete")
def toggle_chapter_completion(chapter_id: int, db: Session = Depends(get_db)):
    """
    Marks a chapter completed or active.
    """
    ch = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")

    ch.is_completed = not ch.is_completed
    ch.completed_at = datetime.datetime.utcnow() if ch.is_completed else None
    
    # Recalculate metrics
    updated_metrics = analytics_service.calculate_chapter_metrics(db, chapter_id)
    db.commit()

    return {
        "chapter_id": ch.id,
        "is_completed": ch.is_completed,
        "completed_at": ch.completed_at.isoformat() if ch.completed_at else None,
        "updated_readiness_index": updated_metrics["readiness_index"],
        "priority_level": updated_metrics["priority_quadrant"]
    }


# ---------------- API SETTINGS & KEY MANAGEMENT ---------------- #
@router.get("/settings/status", response_model=schemas.ApiKeyStatusResponse)
def get_api_status():
    """
    Returns the live status of Gemini and OpenAI API keys.
    """
    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
    openai_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY", "")

    return schemas.ApiKeyStatusResponse(
        gemini_configured=bool(gemini_key and len(gemini_key) > 5),
        openai_configured=bool(openai_key and len(openai_key) > 5),
        project_name=settings.PROJECT_NAME,
        version="1.0.0"
    )


@router.post("/settings/keys")
def update_api_keys(payload: schemas.UpdateApiKeysRequest):
    """
    Updates API keys in runtime and persists them to .env.
    """
    updated = []
    env_lines = {}

    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.strip().split("=", 1)
                    env_lines[k.strip()] = v.strip().strip('"').strip("'")

    if payload.gemini_api_key is not None:
        settings.GEMINI_API_KEY = payload.gemini_api_key.strip()
        os.environ["GEMINI_API_KEY"] = payload.gemini_api_key.strip()
        env_lines["GEMINI_API_KEY"] = payload.gemini_api_key.strip()
        updated.append("Gemini API Key")

    if payload.openai_api_key is not None:
        settings.OPENAI_API_KEY = payload.openai_api_key.strip()
        os.environ["OPENAI_API_KEY"] = payload.openai_api_key.strip()
        env_lines["OPENAI_API_KEY"] = payload.openai_api_key.strip()
        updated.append("OpenAI API Key")

    # Write back to .env
    with open(env_path, "w", encoding="utf-8") as f:
        for k, v in env_lines.items():
            f.write(f'{k}="{v}"\n')

    return {"message": f"Successfully updated: {', '.join(updated)}"}


# ---------------- SEED DATABASE ENDPOINT ---------------- #
@router.post("/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """
    Seeds comprehensive academic demo data for instant platform testing.
    """
    # Check if already seeded
    existing = db.query(models.Subject).first()
    if existing:
        return {"message": "Database already contains subjects.", "subject_id": existing.id}

    # Subjects to seed: DC, SE, AISC, TOC, CNS, MDM
    from seed_curriculum import subjects_data
    for s_info in subjects_data:
        sub = models.Subject(
            name=s_info["name"],
            code=s_info["code"],
            target_exam=s_info["target_exam"],
            total_marks=s_info["total_marks"],
            created_at=datetime.datetime.utcnow()
        )
        db.add(sub)
        db.flush()

        ch_map = {}
        created_chs = []
        for idx, c_info in enumerate(s_info["chapters"]):
            ch = models.Chapter(
                subject_id=sub.id,
                name=c_info["name"],
                order=idx + 1,
                weightage_marks=c_info["marks"],
                weightage_percent=c_info["pct"],
                is_completed=c_info["comp"],
                completed_at=datetime.datetime.utcnow() if c_info["comp"] else None
            )
            db.add(ch)
            db.flush()
            ch_map[c_info["name"]] = ch.id
            created_chs.append(ch)

        for ch_name, q_text, q_type, marks, diff in s_info.get("pyqs", []):
            target_ch_id = ch_map.get(ch_name, created_chs[0].id)
            q = models.Question(
                subject_id=sub.id,
                chapter_id=target_ch_id,
                text=q_text,
                question_type=q_type,
                marks=marks,
                difficulty=diff,
                exam_year="2023",
                source_paper=f"{s_info['code']} End-Sem Exam",
                tags=json.dumps([s_info["code"].lower(), q_type.lower()])
            )
            db.add(q)

        # Pre-seed quiz for Chapter 1
        ch1 = created_chs[0]
        quiz = models.Quiz(
            subject_id=sub.id,
            chapter_id=ch1.id,
            title=f"{ch1.name} — Practice Quiz #1",
            mode="Standard",
            score=8.5,
            total_marks=10.0,
            accuracy_percent=85.0,
            is_completed=True,
            created_at=datetime.datetime.utcnow(),
            completed_at=datetime.datetime.utcnow()
        )
        db.add(quiz)
        db.flush()

        # Pre-seed Dual-AI Notes for Chapter 1
        from app.services.gemini_service import gemini_service
        from app.services.openai_service import openai_service

        gemini_summary = gemini_service._fallback_gemini_summary(ch1.name, sub.name)
        openai_summary = openai_service._fallback_openai_summary(ch1.name, sub.name)

        summary = models.ChapterSummary(
            chapter_id=ch1.id,
            subject_id=sub.id,
            gemini_summary_md=gemini_summary["summary_md"],
            openai_summary_md=openai_summary["summary_md"],
            key_formulas=json.dumps(gemini_summary["formulas"] + openai_summary["formulas"]),
            pitfalls=json.dumps(gemini_summary["pitfalls"]),
            mnemonics=json.dumps(openai_summary["mnemonics"]),
            generated_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        db.add(summary)

        for c in created_chs:
            analytics_service.calculate_chapter_metrics(db, c.id)

    db.commit()
    first_sub = db.query(models.Subject).first()
    return {"message": "Demo subjects DC, SE, AISC, TOC, CNS, MDM successfully seeded!", "subject_id": first_sub.id if first_sub else None}
