from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field


# ---------------- CHAPTER SCHEMAS ---------------- #
class ChapterBase(BaseModel):
    name: str
    unit_number: Optional[int] = None
    order: Optional[int] = 1
    teaching_hours: Optional[int] = 8
    weightage_marks: Optional[float] = 15.0
    estimated_ese_marks: Optional[float] = None
    weightage_percent: Optional[float] = 15.0
    topics: Optional[List[str]] = []
    is_completed: Optional[bool] = False


class ChapterCreate(ChapterBase):
    pass


class ChapterUpdate(BaseModel):
    name: Optional[str] = None
    weightage_marks: Optional[float] = None
    weightage_percent: Optional[float] = None
    is_completed: Optional[bool] = None


class ChapterResponse(ChapterBase):
    id: int
    subject_id: int
    completed_at: Optional[datetime] = None
    questions_count: Optional[int] = 0
    accuracy_score: Optional[float] = 0.0
    readiness_index: Optional[float] = 0.0
    priority_level: Optional[str] = "HIGH FOCUS"

    class Config:
        from_attributes = True


# ---------------- SUBJECT SCHEMAS ---------------- #
class SubjectBase(BaseModel):
    name: str
    code: Optional[str] = None
    course_code: Optional[str] = None
    credits: Optional[int] = 4
    target_exam: Optional[str] = "Semester Exam"
    total_marks: Optional[float] = 100.0
    exam_scheme: Optional[Any] = None


class SubjectCreate(SubjectBase):
    chapters: Optional[List[ChapterCreate]] = []


class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime
    chapter_count: Optional[int] = 0
    pyq_count: Optional[int] = 0
    overall_readiness: Optional[float] = 0.0

    class Config:
        from_attributes = True


class SubjectDetailResponse(SubjectResponse):
    chapters: List[ChapterResponse] = []


# ---------------- QUESTION & PYQ SCHEMAS ---------------- #
class QuestionBase(BaseModel):
    text: str
    question_type: str = "Short"  # MCQ, Short, Long, Numerical
    marks: float = 5.0
    solution: Optional[str] = None
    difficulty: Optional[str] = "Medium"
    exam_year: Optional[str] = "2024"
    source_paper: Optional[str] = None
    chapter_name: Optional[str] = None


class ExtractedQuestionItem(QuestionBase):
    chapter_id: Optional[int] = None
    tags: Optional[List[str]] = []


class QuestionResponse(QuestionBase):
    id: int
    subject_id: int
    chapter_id: Optional[int] = None
    pyq_doc_id: Optional[int] = None
    tags: Optional[List[str]] = []
    created_at: datetime

    class Config:
        from_attributes = True


class PYQExtractResponse(BaseModel):
    doc_id: int
    filename: str
    exam_year: str
    exam_session: str
    total_extracted: int
    questions: List[QuestionResponse]


# ---------------- QUIZ SCHEMAS ---------------- #
class QuizGenerateRequest(BaseModel):
    subject_id: int
    chapter_id: int
    num_questions: Optional[int] = 10
    mode: Optional[str] = "Standard"  # Standard, PYQ-Only, Conceptual


class QuizQuestionItem(BaseModel):
    id: int
    question_text: str
    options: List[str]
    question_type: str
    marks: float
    user_answer: Optional[str] = None
    is_correct: Optional[bool] = None
    explanation: Optional[str] = None
    correct_answer: Optional[str] = None


class QuizResponse(BaseModel):
    quiz_id: int
    subject_id: int
    chapter_id: int
    chapter_name: str
    title: str
    mode: str
    total_questions: int
    total_marks: float
    questions: List[QuizQuestionItem]


class QuizSubmitAnswer(BaseModel):
    question_id: int
    answer: str


class QuizSubmitRequest(BaseModel):
    quiz_id: int
    answers: List[QuizSubmitAnswer]


class QuizResultResponse(BaseModel):
    quiz_id: int
    subject_id: int
    chapter_id: int
    score: float
    total_marks: float
    accuracy_percent: float
    is_completed: bool
    readiness_index_updated: float
    priority_level: str
    questions: List[QuizQuestionItem]


# ---------------- MASTERY & REVISION NOTES SCHEMAS ---------------- #
class NotesGenerateRequest(BaseModel):
    subject_id: int
    chapter_id: int
    force_regenerate: Optional[bool] = False


class RevisionSheetGenerateRequest(BaseModel):
    subject_id: int
    chapter_id: int
    force_regenerate: Optional[bool] = False


class TutorStep(BaseModel):
    title: str
    body: str


class MasteryNotesResponse(BaseModel):
    chapter_id: int
    chapter_name: str
    subject_name: str
    unified_md: str
    steps: Optional[List[TutorStep]] = None
    key_formulas: List[str] = []
    pitfalls: List[str] = []
    mnemonics: List[str] = []
    generated_at: datetime
    module_completed: bool = False
    sources_used: Optional[str] = "PYQ Papers & University Syllabus"


# Backward-compat alias so old code referencing DualNotesResponse still works
class DualNotesResponse(MasteryNotesResponse):
    gemini_summary_md: Optional[str] = ""
    openai_summary_md: Optional[str] = ""


class RevisionSheetResponse(BaseModel):
    chapter_id: int
    chapter_name: str
    subject_name: str
    summary_md: str
    formulas: List[str] = []
    pitfalls: List[str] = []
    mnemonics: List[str] = []
    exam_questions: List[str] = []
    generated_at: datetime


# ---------------- STRATEGIC READINESS TRACKER SCHEMAS ---------------- #
class WeightageItemUpdate(BaseModel):
    chapter_id: int
    weightage_marks: float


class UpdateWeightageBatchRequest(BaseModel):
    subject_id: int
    total_marks: float
    chapters: List[WeightageItemUpdate]


class ReadinessQuadrantTopic(BaseModel):
    chapter_id: int
    chapter_name: str
    weightage_percent: float
    weightage_marks: float
    accuracy_score: float
    readiness_index: float
    quiz_attempts: int
    is_completed: bool
    priority_quadrant: str  # "URGENT FOCUS", "STRENGTH", "REVIEW LATER", "MAINTAIN"
    reason: str


class SubjectReadinessReport(BaseModel):
    subject_id: int
    subject_name: str
    total_marks: float
    overall_readiness_index: float
    completed_chapters_count: int
    total_chapters_count: int
    urgent_topics: List[ReadinessQuadrantTopic]
    all_topics: List[ReadinessQuadrantTopic]
    recommendation: str


# ---------------- API SETTINGS & HEALTH ---------------- #
class ApiKeyStatusResponse(BaseModel):
    gemini_configured: bool
    openai_configured: bool
    project_name: str
    version: str = "1.0.0"


class UpdateApiKeysRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None


# ---------------- TUTOR CHAT SCHEMAS ---------------- #
class TutorChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class TutorChatRequest(BaseModel):
    subject_id: int
    chapter_id: int
    message: str
    history: Optional[List[TutorChatMessage]] = []
    current_topic: Optional[str] = None


class TutorChatResponse(BaseModel):
    reply: str
    suggested_questions: Optional[List[str]] = []
