# ExamPrepAI 🚀
### Production-Grade AI Exam Preparation & Readiness Platform

**ExamPrepAI** is a full-stack, AI-powered exam preparation platform engineered for university semester exams and competitive technical assessments. It bridges the gap between static syllabi and dynamic past papers using intelligent document processing, adaptive daily quizzes, parallel Dual-AI structured revision sheets, and strategic readiness analytics.

---

## 🌟 Core Architecture & Key Pillars

```
+----------------------------------------------------------------------------------------------------+
|                                         ExamPrepAI PLATFORM                                        |
+----------------------------------------------------------------------------------------------------+
| 1. PYQ Processing       | 2. Daily Chapter Quiz    | 3. Dual-AI 1-Page Notes  | 4. Readiness Tracker|
| - pypdf / pdfplumber    | - 10-Question Engine     | - Parallel GenAI Engine  | - Weightage Matrix  |
| - Gemini LLM Structuring| - Instant Scoring & Math | - Gemini (Theory/Proofs) | - 4-Quadrant Focus  |
| - Subject/Type/Marks Map| - AI Explanations + Traps| - OpenAI (Mnemonics/Tab) | - Urgent Alerts     |
+----------------------------------------------------------------------------------------------------+
                                      |                                  |
                                      v                                  v
                FastAPI Backend (Python 3.11+, SQLAlchemy)      Vite React UI (Tailwind CSS)
```

### 1. 📂 PYQ Document Processing
- **PDF Extraction**: Ingests official Previous Year Question (PYQ) papers using `pypdf` and `pdfplumber`.
- **LLM Structured Output**: Parses raw question text into structured schemas categorized by:
  - Subject and Chapter mapping
  - Question Type (`MCQ`, `Short`, `Long`, `Numerical`)
  - Marks weightage (e.g., 2, 5, 8, 10 Marks)
  - Solution blueprint / ideal grader outline
  - Difficulty ranking (`Easy`, `Medium`, `Hard`)
- **Interactive Question Bank**: Real-time filtering by chapter, marks, type, and keyword search with one-click "Practice in Quiz" routing.

### 2. ⚡ Daily Chapter Practice Quiz
- **Adaptive 10-Question Engine**: Generates interactive 10-question practice quizzes based on previous PYQs and conceptual variants.
- **Multiple Modes**:
  - `Standard`: Balanced mix of past paper questions and conceptual checks.
  - `PYQ-Only`: Real questions extracted from uploaded semester papers.
  - `Conceptual Variations`: Professor traps, edge cases, and numerical variations.
- **Real-Time Evaluation**: Instant score calculation, accuracy percentages, celebratory confetti animations (`canvas-confetti`), and question-by-question breakdowns with verified AI explanations.

### 3. 📑 Dual-AI 1-Page Summary Revision Notes
When a chapter is completed, the system generates two distinct, high-yield 1-page structured revision summaries in parallel:
- **Left Column (Google Gemini GenAI)**:
  - Rigorous theoretical definitions & axiomatic foundations
  - Step-by-step mathematical derivations & algorithm mechanics
  - Critical professor traps & common student exam mistakes
  - 3 high-probability university question patterns
- **Right Column (OpenAI ChatGPT)**:
  - High-retention memory mnemonics (catchy visual hooks and acronyms)
  - Fast formula sheet & complexity cheat sheets
  - Side-by-side comparison tables (e.g., Preemptive vs Non-Preemptive, Paging vs Segmentation)
  - 60-second rapid-fire cram bullet points
- **Export Capabilities**:
  - Synchronized and independent scrolling
  - One-click copy to clipboard
  - Native `.md` Markdown download
  - One-click clean printable 1-page PDF export via backend `reportlab` or browser print stylesheets.

### 4. 🎯 Strategic Exam Readiness Tracker
- **Customizable Weightage**: Input subject total marks (e.g. 100, 70, 80) and chapter-wise weightage distributions.
- **Dynamic Readiness Index**:
  $$\text{Readiness Index} = (\text{Quiz Accuracy} \times 0.65) + (\text{Chapter Completion} \times 0.25) + (\text{Practice Frequency} \times 0.10)$$
  $$\text{Overall Subject Readiness} = \sum_{i=1}^n \left( \frac{\text{Weightage}_i}{\sum \text{Weightage}} \times \text{Readiness Index}_i \right)$$
- **4-Quadrant Strategic Focus Matrix**:
  - 🔴 **Quadrant 1: URGENT FOCUS** *(High Weightage + Low Accuracy)* — Critical GPA hazard; triggers real-time alerts.
  - 🟢 **Quadrant 2: CORE STRENGTH** *(High Weightage + High Accuracy)* — High-yield marks bank; maintain with light revision.
  - 🟡 **Quadrant 3: REVIEW LATER** *(Low Weightage + Low Accuracy)* — Low ROI initially; tackle after Quadrant 1 is secured.
  - 🔵 **Quadrant 4: MAINTAIN** *(Low Weightage + High Accuracy)* — Mastered auxiliary concepts.

---

## 🛠️ Project Directory Structure

```text
exam-prep-platform/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py               # Pydantic Settings, CORS, API keys
│   │   ├── db/
│   │   │   ├── database.py             # SQLAlchemy session factory & SQLite/PostgreSQL engine
│   │   │   └── models.py               # Subject, Chapter, PYQ, Question, Quiz, ChapterSummary
│   │   ├── schemas/
│   │   │   └── schemas.py              # Pydantic v2 schemas for request/response validation
│   │   ├── services/
│   │   │   ├── pdf_service.py          # pypdf & pdfplumber text extraction & cleaning
│   │   │   ├── gemini_service.py       # Official google-genai SDK (Theory, Derivations, Traps)
│   │   │   ├── openai_service.py       # Official openai SDK (Mnemonics, Formulas, Tables)
│   │   │   └── analytics_service.py    # Readiness Index & 4-Quadrant Focus Matrix algorithms
│   │   ├── routers/
│   │   │   ├── pyq.py                  # PDF upload, question extraction, question bank search
│   │   │   ├── quiz.py                 # Quiz generation, interactive submission, history
│   │   │   ├── notes.py                # Dual-AI parallel generation, MD/PDF export
│   │   │   └── analytics.py            # Weightage editor, readiness reports, seed & settings
│   │   └── main.py                     # FastAPI entrypoint, lifespan seeding, CORS
│   ├── sample_docs/
│   │   └── Operating_Systems_PYQ_2023.pdf # Sample university PYQ paper for instant testing
│   ├── requirements.txt                # FastAPI, google-genai, openai, reportlab, etc.
│   ├── test_e2e.py                     # Automated 9-step end-to-end integration test
│   └── .env.example                    # Environment template
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Navigation, subject switcher, live AI badges
│   │   │   ├── FileUploader.jsx        # Drag-drop PDF upload, structured question bank
│   │   │   ├── QuizCard.jsx            # 10-Question test engine, timer, confetti, solutions
│   │   │   ├── SplitNotesViewer.jsx    # Side-by-side Gemini & ChatGPT viewer, sync scroll, exports
│   │   │   ├── ReadinessChart.jsx      # 4-Quadrant Focus Matrix, index gauge, progress table
│   │   │   └── SettingsModal.jsx       # Dynamic API key input & subject creation modal
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # Global overview, urgent alerts, quick action cards
│   │   │   ├── QuizPage.jsx            # Chapter quiz launcher & attempt history
│   │   │   ├── NotesPage.jsx           # Dual-AI summary hub with parallel generator
│   │   │   └── SyllabusPage.jsx        # Exam weightage blueprint editor & readiness tracker
│   │   ├── services/
│   │   │   └── api.js                  # Axios client for all backend endpoints
│   │   ├── App.jsx                     # Root application container & tab router
│   │   ├── main.jsx                    # Vite entrypoint
│   │   └── index.css                   # Custom Tailwind directives, glassmorphism, print CSS
│   ├── index.html                      # HTML5 template with Inter typography
│   ├── package.json                    # React, Lucide Icons, Tailwind CSS, Axios, Confetti
│   ├── postcss.config.js
│   └── tailwind.config.js              # Custom dark cyber-indigo theme palette
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python**: 3.11 or 3.12 (`python --version`)
- **Node.js**: v18+ or v24+ (`node --version`)
- **Package Managers**: `pip` and `npm`

---

### Step 1: Run the FastAPI Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   - On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
3. (Optional) Configure API keys in `.env` or set them later via the frontend Settings UI:
   ```env
   GEMINI_API_KEY="your-google-ai-studio-key"
   OPENAI_API_KEY="your-openai-key"
   ```
   > **Note:** Even without API keys set initially, ExamPrepAI includes high-quality academic fallback generators for university engineering curricula, ensuring 100% of the UI, quiz scoring, and PDF generation work immediately out-of-the-box!
4. Launch the FastAPI server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
5. Verify backend health:
   - API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Step 2: Run the Vite React Frontend

1. In a separate terminal, navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   ```text
   http://127.0.0.1:5173/
   ```

---

### Step 3: Run the Automated Integration Tests

A comprehensive 9-phase end-to-end integration test is provided in `backend/test_e2e.py`. It tests:
1. Health check & database connection
2. Subject retrieval & auto-seeded curriculum
3. PDF upload and text extraction using the sample PYQ paper
4. 10-Question practice quiz generation
5. Quiz submission, answer validation, and score calculation
6. Parallel Dual-AI notes generation (Gemini + OpenAI)
7. Markdown export (`.md`)
8. PDF document generation (`%PDF` binary stream)
9. 4-Quadrant Focus Matrix recalculation

To run the test:
```powershell
cd backend
.\venv\Scripts\python test_e2e.py
```

Expected output:
```text
=== 1. Testing Health Endpoint ===
Health: {'status': 'healthy', 'service': 'ExamPrepAI', 'database': 'connected', ...}
=== 2. Testing Subjects List ===
Found 2 subjects. First subject: Operating Systems
=== 3. Testing PYQ Upload with Sample PDF ===
Uploaded PYQ successfully! Extracted 10 questions from PDF.
=== 4. Testing Daily Practice Quiz Generation (10 Questions) ===
Quiz generated: '1. Introduction, System Calls & OS Structures - Practice Quiz' with 10 questions.
=== 5. Testing Quiz Submission & Instant Scoring ===
Quiz Scored: 8.0/10.0 (80.0%)
=== 6. Testing Dual-AI 1-Page Summary Revision Notes ===
Dual Notes Generated for '1. Introduction, System Calls & OS Structures':
- Gemini Summary Length: 2547 chars
- OpenAI Summary Length: 3050 chars
=== 7. Testing Markdown & PDF Export Endpoints ===
Markdown exported successfully (6078 bytes).
PDF exported successfully (3625 bytes). Header: b'%PDF-'
=== 8. Testing Strategic Exam Readiness Report & 4-Quadrant Focus Matrix ===
Overall Readiness Index: 28.7%
Urgent Topics Count: 3
=== 9. Testing Weightage Distribution Update ===
Weightage updated. Overall Readiness: 32.8

>>> ALL 9 END-TO-END PIPELINE CHECKS PASSED WITH 100% SUCCESS! <<<
```

---

## 💡 AI Integrations Details

### Google GenAI SDK (`google-genai`)
- Official SDK: `from google import genai`
- Models: `gemini-2.5-flash` / `gemini-1.5-flash`
- Applied for:
  - Unstructured PDF question categorization
  - Mathematical derivations & theorem formulations
  - Common exam traps and professor grading caveats

### OpenAI SDK (`openai`)
- Official SDK: `from openai import OpenAI`
- Models: `gpt-4o-mini` / `gpt-4o`
- Applied for:
  - Memory mnemonics & cognitive recall hooks
  - Formula cheat sheets & unit tables
  - Side-by-side comparison tables

---

## 📄 License
MIT License. Built for university students and educators using Google Antigravity.
