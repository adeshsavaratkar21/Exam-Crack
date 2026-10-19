import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas import schemas
from app.services.gemini_service import gemini_service
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/quiz", tags=["Chapter Practice Quiz"])


@router.post("/generate", response_model=schemas.QuizResponse)
def generate_chapter_quiz(
    payload: schemas.QuizGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generates an interactive 10-question practice quiz based on past PYQs and conceptual variations.
    """
    chapter = db.query(models.Chapter).filter(models.Chapter.id == payload.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    subject = db.query(models.Subject).filter(models.Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Fetch PYQ questions from this chapter for high-yield context
    pyqs = db.query(models.Question).filter(
        models.Question.chapter_id == chapter.id
    ).all()
    pyq_texts = [q.text for q in pyqs]

    # Generate questions via Gemini
    generated_raw = gemini_service.generate_quiz(
        chapter_name=chapter.name,
        subject_name=subject.name,
        pyqs_context=pyq_texts,
        count=payload.num_questions or 10,
        mode=payload.mode or "Standard"
    )

    # Create Quiz record
    quiz = models.Quiz(
        subject_id=subject.id,
        chapter_id=chapter.id,
        title=f"{chapter.name} — Practice Quiz ({payload.mode})",
        mode=payload.mode or "Standard",
        score=0.0,
        total_marks=float(len(generated_raw)),
        accuracy_percent=0.0,
        is_completed=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(quiz)
    db.flush()

    quiz_questions_out = []
    for item in generated_raw:
        options_list = item.get("options", [])
        if isinstance(options_list, str):
            try:
                options_list = json.loads(options_list)
            except Exception:
                options_list = [options_list]

        q_obj = models.QuizQuestion(
            quiz_id=quiz.id,
            question_text=item.get("question_text", "Question"),
            options=json.dumps(options_list),
            correct_answer=str(item.get("correct_answer", "A")).strip().upper(),
            explanation=item.get("explanation", "Verified conceptual solution."),
            question_type=item.get("question_type", "MCQ"),
            marks=float(item.get("marks", 1.0)),
            is_correct=None
        )
        db.add(q_obj)
        db.flush()

        # For in-progress quiz, hide correct_answer and explanation from response
        quiz_questions_out.append(
            schemas.QuizQuestionItem(
                id=q_obj.id,
                question_text=q_obj.question_text,
                options=options_list,
                question_type=q_obj.question_type,
                marks=q_obj.marks,
                user_answer=None,
                is_correct=None,
                explanation=None,
                correct_answer=None
            )
        )

    db.commit()

    return schemas.QuizResponse(
        quiz_id=quiz.id,
        subject_id=subject.id,
        chapter_id=chapter.id,
        chapter_name=chapter.name,
        title=quiz.title,
        mode=quiz.mode,
        total_questions=len(quiz_questions_out),
        total_marks=quiz.total_marks,
        questions=quiz_questions_out
    )


@router.get("/{quiz_id}", response_model=schemas.QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """
    Fetches quiz by ID.
    """
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz.id).all()
    questions_out = []

    for q in questions:
        try:
            options = json.loads(q.options)
        except Exception:
            options = []

        # Only reveal explanation and correct_answer if quiz is completed
        questions_out.append(
            schemas.QuizQuestionItem(
                id=q.id,
                question_text=q.question_text,
                options=options,
                question_type=q.question_type,
                marks=q.marks,
                user_answer=q.user_answer,
                is_correct=q.is_correct,
                explanation=q.explanation if quiz.is_completed else None,
                correct_answer=q.correct_answer if quiz.is_completed else None
            )
        )

    return schemas.QuizResponse(
        quiz_id=quiz.id,
        subject_id=quiz.subject_id,
        chapter_id=quiz.chapter_id,
        chapter_name=quiz.chapter.name if quiz.chapter else "Chapter",
        title=quiz.title,
        mode=quiz.mode,
        total_questions=len(questions_out),
        total_marks=quiz.total_marks,
        questions=questions_out
    )


@router.post("/submit", response_model=schemas.QuizResultResponse)
def submit_quiz(payload: schemas.QuizSubmitRequest, db: Session = Depends(get_db)):
    """
    Submits user answers, calculates score, reveals explanations, and updates the Readiness Index.
    """
    quiz = db.query(models.Quiz).filter(models.Quiz.id == payload.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    answer_map = {ans.question_id: ans.answer.strip().upper() for ans in payload.answers}

    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz.id).all()
    total_score = 0.0
    total_marks = 0.0
    evaluated_questions = []

    for q in questions:
        total_marks += q.marks
        user_ans = answer_map.get(q.id, "")
        
        # Check correctness (handles "A", "A)", "Option A")
        cleaned_user = user_ans.replace(")", "").replace("OPTION", "").strip()[:1]
        cleaned_correct = q.correct_answer.replace(")", "").replace("OPTION", "").strip()[:1]
        
        is_corr = (cleaned_user == cleaned_correct) if cleaned_user else False
        if is_corr:
            total_score += q.marks
        
        q.user_answer = user_ans
        q.is_correct = is_corr

        try:
            options = json.loads(q.options)
        except Exception:
            options = []

        evaluated_questions.append(
            schemas.QuizQuestionItem(
                id=q.id,
                question_text=q.question_text,
                options=options,
                question_type=q.question_type,
                marks=q.marks,
                user_answer=q.user_answer,
                is_correct=is_corr,
                explanation=q.explanation,
                correct_answer=q.correct_answer
            )
        )

    accuracy_pct = round((total_score / total_marks) * 100, 1) if total_marks > 0 else 0.0

    quiz.score = total_score
    quiz.accuracy_percent = accuracy_pct
    quiz.is_completed = True
    quiz.completed_at = datetime.datetime.utcnow()

    # Recalculate chapter metrics and strategic readiness
    updated_metrics = analytics_service.calculate_chapter_metrics(db, quiz.chapter_id)

    db.commit()

    return schemas.QuizResultResponse(
        quiz_id=quiz.id,
        subject_id=quiz.subject_id,
        chapter_id=quiz.chapter_id,
        score=total_score,
        total_marks=total_marks,
        accuracy_percent=accuracy_pct,
        is_completed=True,
        readiness_index_updated=updated_metrics["readiness_index"],
        priority_level=updated_metrics["priority_quadrant"],
        questions=evaluated_questions
    )


@router.get("/history/{chapter_id}", response_model=List[dict])
def get_chapter_quiz_history(chapter_id: int, db: Session = Depends(get_db)):
    """
    Returns previous quiz performance logs for a chapter.
    """
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.chapter_id == chapter_id,
        models.Quiz.is_completed == True
    ).order_by(models.Quiz.completed_at.desc()).all()

    return [
        {
            "id": q.id,
            "title": q.title,
            "mode": q.mode,
            "score": q.score,
            "total_marks": q.total_marks,
            "accuracy_percent": q.accuracy_percent,
            "completed_at": q.completed_at.isoformat() if q.completed_at else None
        }
        for q in quizzes
    ]
