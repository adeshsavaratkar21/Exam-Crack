import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=True)
    course_code = Column(String(100), nullable=True)
    credits = Column(Integer, default=4)
    target_exam = Column(String(200), default="Semester Exam")
    total_marks = Column(Float, default=100.0)
    exam_scheme = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    chapters = relationship("Chapter", back_populates="subject", cascade="all, delete-orphan", order_by="Chapter.order")
    pyq_documents = relationship("PYQDocument", back_populates="subject", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="subject", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="subject", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(250), nullable=False)
    unit_number = Column(Integer, nullable=True)
    order = Column(Integer, default=1)
    teaching_hours = Column(Integer, default=8)
    weightage_marks = Column(Float, default=15.0)
    estimated_ese_marks = Column(Float, nullable=True)
    weightage_percent = Column(Float, default=15.0)
    topics = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    subject = relationship("Subject", back_populates="chapters")
    questions = relationship("Question", back_populates="chapter")
    quizzes = relationship("Quiz", back_populates="chapter", cascade="all, delete-orphan")
    summary = relationship("ChapterSummary", back_populates="chapter", uselist=False, cascade="all, delete-orphan")
    readiness_metric = relationship("ReadinessMetric", back_populates="chapter", uselist=False, cascade="all, delete-orphan")


class PYQDocument(Base):
    __tablename__ = "pyq_documents"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    exam_year = Column(String(20), default="2024")
    exam_session = Column(String(100), default="End-Semester")
    total_questions_extracted = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    subject = relationship("Subject", back_populates="pyq_documents")
    questions = relationship("Question", back_populates="pyq_document", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True)
    pyq_doc_id = Column(Integer, ForeignKey("pyq_documents.id", ondelete="SET NULL"), nullable=True)
    
    text = Column(Text, nullable=False)
    question_type = Column(String(50), default="Short")  # MCQ, Short, Long, Numerical
    marks = Column(Float, default=5.0)
    solution = Column(Text, nullable=True)
    difficulty = Column(String(30), default="Medium")  # Easy, Medium, Hard
    exam_year = Column(String(20), nullable=True)
    source_paper = Column(String(200), nullable=True)
    tags = Column(Text, default="[]")  # JSON encoded tags
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    subject = relationship("Subject", back_populates="questions")
    chapter = relationship("Chapter", back_populates="questions")
    pyq_document = relationship("PYQDocument", back_populates="questions")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    mode = Column(String(50), default="Standard")  # Standard, PYQ-Only, Conceptual
    score = Column(Float, default=0.0)
    total_marks = Column(Float, default=10.0)
    accuracy_percent = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    subject = relationship("Subject", back_populates="quizzes")
    chapter = relationship("Chapter", back_populates="quizzes")
    quiz_questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    original_question_id = Column(Integer, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    
    question_text = Column(Text, nullable=False)
    options = Column(Text, default="[]")  # JSON list of options
    correct_answer = Column(String(255), nullable=False)
    user_answer = Column(String(255), nullable=True)
    explanation = Column(Text, nullable=True)
    question_type = Column(String(50), default="MCQ")
    marks = Column(Float, default=1.0)
    is_correct = Column(Boolean, nullable=True)

    quiz = relationship("Quiz", back_populates="quiz_questions")


class ChapterSummary(Base):
    __tablename__ = "chapter_summaries"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="CASCADE"), unique=True, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    gemini_summary_md = Column(Text, nullable=False)
    openai_summary_md = Column(Text, nullable=False)
    key_formulas = Column(Text, default="[]")
    pitfalls = Column(Text, default="[]")
    mnemonics = Column(Text, default="[]")
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    chapter = relationship("Chapter", back_populates="summary")


class ReadinessMetric(Base):
    __tablename__ = "readiness_metrics"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="CASCADE"), unique=True, nullable=False)
    accuracy_score = Column(Float, default=0.0)
    quiz_count = Column(Integer, default=0)
    readiness_index = Column(Float, default=0.0)  # 0 to 100
    priority_level = Column(String(50), default="HIGH FOCUS")  # HIGH FOCUS, REVIEW NEEDED, MASTERED
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    chapter = relationship("Chapter", back_populates="readiness_metric")
