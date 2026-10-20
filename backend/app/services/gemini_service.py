import os
import json
import re
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from app.core.config import settings
from app.services.curriculum_knowledge import get_detailed_mastery_content, get_subject_quiz_bank


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")

    def get_client(self) -> Optional[genai.Client]:
        key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        if key:
            return genai.Client(api_key=key)
        return None

    def extract_questions_from_pyq(
        self,
        pyq_text: str,
        subject_name: str,
        chapter_names: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Uses Gemini to extract and categorize questions from PYQ paper text.
        """
        client = self.get_client()
        chapters_formatted = ", ".join(f'"{c}"' for c in chapter_names) if chapter_names else "General chapters"

        if client:
            prompt = f"""
You are an expert university exam grader and syllabus curator.
Analyze the following text extracted from a Previous Year Question (PYQ) paper for the subject: "{subject_name}".

Known Chapters in this subject:
{chapters_formatted}

Extract every distinct exam question from this text. For each question, categorize it precisely into this JSON format:
[
  {{
    "text": "Full verbatim question text including subparts",
    "question_type": "MCQ" | "Short" | "Long" | "Numerical",
    "marks": 5.0,
    "chapter_name": "Best matching chapter name from the provided list, or closest topic",
    "difficulty": "Easy" | "Medium" | "Hard",
    "solution": "Concise 2-3 sentence outline of the ideal answer or key steps",
    "tags": ["keyword1", "keyword2"]
  }}
]

Return strictly valid JSON. Do not include markdown code blocks or extra conversational text.

PYQ Document Text:
{pyq_text[:12000]}
"""
            try:
                # Use gemini-2.5-flash or gemini-1.5-flash
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                raw_text = response.text.strip()
                # Clean JSON codeblock wrappers if any
                raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                raw_text = re.sub(r"\s*```$", "", raw_text)
                parsed = json.loads(raw_text)
                if isinstance(parsed, list) and len(parsed) > 0:
                    return parsed
            except Exception as e:
                print(f"[GeminiService] Real API extraction error: {e}. Falling back to heuristic/sample extractor.")

        # Fallback heuristic / intelligent question parser
        return self._fallback_question_extractor(pyq_text, subject_name, chapter_names)

    def generate_theory_summary(
        self,
        chapter_name: str,
        subject_name: str,
        pyqs_context: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generates a 1-page structured revision summary focusing on:
        Theory, Definitions, Derivations, and Common Exam Pitfalls.
        """
        client = self.get_client()
        pyq_snippet = "\n".join(f"- {q}" for q in (pyqs_context or [])[:5])

        if client:
            prompt = f"""
You are a premier university professor preparing a crisp "1-Page High-Yield Revision Sheet" for students reviewing:
Subject: {subject_name}
Chapter: {chapter_name}

Past Exam Questions for context:
{pyq_snippet if pyq_snippet else "Standard university syllabus questions"}

Generate a dense, high-retention 1-Page Revision Summary in GitHub Flavored Markdown adhering strictly to this structure:
# 📚 {chapter_name} — Theory & Foundations (Gemini Edition)

### 1. 🎯 Core Concepts & Exact Definitions
- Define the primary abstractions with exam-ready precision.
- Provide the key underlying principles.

### 2. 📐 Mathematical Derivations & Step-by-Step Mechanisms
- Step-by-step mathematical derivation or procedural flow.
- Exact theorems, bounds, and asymptotic properties.

### 3. ⚠️ Critical Exam Pitfalls & Traps (Professors' Favorites!)
- Common errors students make when answering 5 to 10 mark questions.
- Misconceptions between closely related terms.

### 4. 🏆 High-Probability University Exam Questions
- 3 guaranteed question patterns with marks breakdown and answering strategy.

Keep it dense, strictly academic, without unnecessary filler.
"""
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                md = response.text.strip()
                pitfalls = self._extract_pitfalls_from_md(md)
                return {
                    "summary_md": md,
                    "pitfalls": pitfalls,
                    "formulas": [f"Standard core equations for {chapter_name}"]
                }
            except Exception as e:
                print(f"[GeminiService] API summary error: {e}. Falling back to curated academic template.")

        return self._fallback_gemini_summary(chapter_name, subject_name)

    def generate_quiz(
        self,
        chapter_name: str,
        subject_name: str,
        pyqs_context: Optional[List[str]] = None,
        count: int = 10,
        mode: str = "Standard",
        topics: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generates an interactive 10-question quiz strictly based on the subject's curriculum syllabus and past PYQs.
        """
        client = self.get_client()
        pyq_snippet = "\n".join(f"- {q}" for q in (pyqs_context or [])[:6])
        topics_snippet = f"\nOfficial Syllabus Topics: {topics}\n" if topics else ""

        if client:
            prompt = f"""
You are an expert university examiner creating a practice quiz for:
Subject: {subject_name}
Chapter: {chapter_name}
{topics_snippet}
Mode: {mode} (generate exactly {count} questions)

Past Exam Context:
{pyq_snippet if pyq_snippet else "General high-weightage university questions"}

CRITICAL REQUIREMENT: Every single question MUST strictly belong to the syllabus and curriculum for {subject_name} — {chapter_name}. Under NO circumstance include questions from unrelated subjects (e.g., do not ask OS/scheduling questions in Automata/TOC or Soft Computing).

Generate exactly {count} multiple choice questions (MCQ). Each question must have:
- 4 plausible, distinct options of balanced length labeled "A) ...", "B) ...", "C) ...", "D) ..."
- Correct answer letter ("A", "B", "C", or "D")
- Detailed step-by-step explanation why the correct answer is right and why distractors are wrong
- Marks (1.0)

Return strictly a valid JSON array:
[
  {{
    "question_text": "Clear question formulation?",
    "options": ["A) option 1", "B) option 2", "C) option 3", "D) option 4"],
    "correct_answer": "B",
    "explanation": "Because...",
    "question_type": "MCQ",
    "marks": 1.0
  }}
]
"""
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                raw = response.text.strip()
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
                questions = json.loads(raw)
                if isinstance(questions, list) and len(questions) > 0:
                    return questions
            except Exception as e:
                print(f"[GeminiService] Quiz API error: {e}. Falling back to curated quiz bank.")

        return self._fallback_quiz_generator(chapter_name, subject_name, count)

    def answer_student_doubt(
        self,
        subject_name: str,
        chapter_name: str,
        student_message: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        book_context: str = "",
        current_topic: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Answers a student's conceptual doubt for a specific chapter and subject,
        grounded in college textbooks and curriculum knowledge.
        """
        conversation_context = ""
        if chat_history:
            formatted_history = []
            for h in chat_history[-4:]:  # last 4 turns for context
                role = "Student" if h.get("role") == "user" else "Tutor"
                formatted_history.append(f"{role}: {h.get('content')}")
            conversation_context = "\nRecent Conversation:\n" + "\n".join(formatted_history)

        book_prompt_section = ""
        if book_context:
            book_prompt_section = f"\nRelevant College Textbook & Lecture PPT Excerpts:\n```\n{book_context[:3000]}\n```\n"

        prompt = f"""You are an inspiring, warm, and highly relatable university professor and AI study partner for the subject "{subject_name}".
The student is studying the chapter "{chapter_name}" and has sent you the following message:

Student Message:
"{student_message}"

{book_prompt_section}
{conversation_context}

IMPORTANT GUIDELINES:
1. Tone: Warm, humanized, empathetic, engaging, and encouraging. Never sound like a robotic template. Talk like a friendly professor or study buddy.
2. If the student is greeting you ("hi", "hello", "hey", etc.) or asking what to study:
   - Greet them warmly and enthusiastically.
   - Introduce yourself as their dedicated AI tutor for "{chapter_name}".
   - Highlight 3-4 key high-yield topics they can ask about from this chapter.
3. If the student has a conceptual doubt:
   - Start with a simple, intuitive real-world analogy so the concept clicks immediately.
   - Explain the formal academic definition and mathematical formulations (using standard LaTeX $...$ and $$...$$).
   - Walk through a concrete numerical calculation, trace table, or worked example.
   - Share a critical "Professor's Exam Trap" to watch out for in university exams.
   - Mention how this topic is typically asked in 5-mark and 10-mark questions.
4. Ground your answer in the official syllabus, textbooks, and lecture PPT slides provided.

End your reply with a JSON array on a new line formatted exactly as:
SUGGESTIONS: ["Suggested Follow-up Question 1", "Suggested Follow-up Question 2", "Suggested Follow-up Question 3"]
"""

        client = self.get_client()
        if client:
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                raw_text = response.text.strip()

                suggestions = []
                if "SUGGESTIONS:" in raw_text:
                    parts = raw_text.split("SUGGESTIONS:")
                    main_reply = parts[0].strip()
                    sugg_part = parts[1].strip()
                    try:
                        clean_sugg = re.search(r"\[.*?\]", sugg_part, re.DOTALL)
                        if clean_sugg:
                            suggestions = json.loads(clean_sugg.group(0))
                    except Exception:
                        suggestions = []
                else:
                    main_reply = raw_text

                if not suggestions:
                    suggestions = [
                        f"Can you explain another real-world example of {current_topic or chapter_name}?",
                        "What is a typical university exam numerical on this?",
                        "How do I prove or derive the key formula here?"
                    ]

                return {
                    "reply": main_reply,
                    "suggested_questions": suggestions
                }
            except Exception as e:
                print(f"[GeminiService] Chat doubt error: {e}. Falling back to curriculum knowledge.")

        # Grounded Humanized Fallback (No robotic templates!)
        msg_lower = (student_message or "").strip().lower()

        # 1. Handle Greetings & Casual Messages Humanely
        greeting_words = {"hi", "hello", "hey", "hola", "greetings", "good morning", "good afternoon", "good evening", "sup", "yo", "help", "start"}
        if msg_lower in greeting_words or len(msg_lower) <= 3:
            return {
                "reply": f"""### 👋 Hey there! Welcome to your **{subject_name}** study session!

I'm your dedicated AI Academic Tutor for **{chapter_name}**. 

I'm here to make sure every concept, definition, and derivation from your syllabus, reference textbooks, and lecture PPTs is crystal clear before your exams.

Here are a few high-yield topics from this unit we can dive into:
- 💡 **Core Concepts**: Breaking down complex definitions into simple everyday intuition.
- 📐 **Derivations & Formulas**: Step-by-step mathematical proofs and state models.
- 🔍 **Worked Problems**: Walking through past university numericals and trace tables.
- ⚠️ **Exam Traps**: The tricky boundary cases professors love testing!

What concept or topic in **{chapter_name}** would you like to start with?""",
                "suggested_questions": [
                    f"Explain the primary concept of {chapter_name} in simple words",
                    f"What are the top 3 university exam questions on {chapter_name}?",
                    "Can you give me an everyday real-world analogy for this unit?"
                ]
            }

        # 2. Concept-Specific Humanized Explanations
        sub_lower = (subject_name or "").lower()

        # Software Engineering Fallbacks
        if "software" in sub_lower or "se" in sub_lower:
            if "waterfall" in msg_lower or "agile" in msg_lower or "scrum" in msg_lower:
                return {
                    "reply": f"""### 💡 Understanding **Waterfall vs. Agile & Scrum** in Software Engineering

Great question! This is one of the most fundamental comparisons in Software Engineering and a favorite 10-mark question in university exams.

#### 1. The Real-World Intuition
- **Waterfall**: Imagine **building a suspension bridge**. You cannot pour concrete on the road deck before the towers and support cables are 100% designed and inspected. Everything flows sequentially: Requirements $\\to$ Design $\\to$ Coding $\\to$ Testing. If requirements change midway, rebuilding is astronomically expensive.
- **Agile**: Imagine **baking and refining a recipe for a dinner party**. You don't wait 6 months to serve the entire banquet; you release a small, working dish (a 2-week Sprint increment), get immediate feedback from your guests, and adapt the recipe for the next course.

#### 2. Key Conceptual Differences
| Parameter | Classical Waterfall Model | Agile (Scrum Framework) |
| :--- | :--- | :--- |
| **Philosophy** | Rigid, sequential, plan-driven | Iterative, adaptive, feedback-driven |
| **Customer Feedback** | Only at the beginning and end | At the end of every 2–4 week Sprint |
| **Handling Changes** | High resistance; requires formal change control | Welcomes requirement changes late in development |
| **Risk Management** | Risk discovered late during testing phase | Risk mitigated continuously through working increments |

#### 3. Scrum Framework Ceremonies
1. **Sprint Planning**: Team selects items from the Product Backlog into the Sprint Backlog.
2. **Daily Standup (Scrum)**: 15-minute sync answering: What did I do yesterday? What will I do today? What blockers exist?
3. **Sprint Review**: Live demonstration of the shippable software increment to stakeholders.
4. **Sprint Retrospective**: Team process inspection to discuss what went well and what to improve.

#### ⚠️ Professor's Exam Trap
In exams, never say "Agile has no documentation or planning!" The Agile Manifesto states it values *working software over comprehensive documentation*—it does **not** eliminate planning, but replaces monolithic upfront specs with dynamic user stories!""",
                    "suggested_questions": [
                        "What is Boehm's Spiral Model and how does it handle risk?",
                        "What are Functional vs Non-Functional Requirements in IEEE 830?",
                        "How is Cyclomatic Complexity V(G) calculated in software testing?"
                    ]
                }

            if "cyclomatic" in msg_lower or "complexity" in msg_lower or "testing" in msg_lower or "basis path" in msg_lower:
                return {
                    "reply": f"""### 💡 Demystifying **McCabe's Cyclomatic Complexity & Basis Path Testing**

Let's make Cyclomatic Complexity intuitive—professors regularly ask 5-mark and 10-mark numericals on this!

#### 1. Intuition in Simple Words
Cyclomatic complexity $V(G)$ simply counts **how many independent routes exist through your code**. If you imagine your code as a road network with intersections (if-statements, loops), $V(G)$ tells you the minimum number of test cars you need to drive to ensure every single road (branch) has been driven on at least once!

#### 2. The Governing Mathematical Formulas
For a program Control Flow Graph (CFG) $G$:
1. **Edge-Node Formula**:
   $$V(G) = E - N + 2P$$
   *(where $E$ = edges, $N$ = nodes, $P$ = connected components, usually $P = 1$)*
2. **Predicate Nodes Formula (Fastest for Exams!)**:
   $$V(G) = P_n + 1$$
   *(where $P_n$ is the count of conditional decision points: `if`, `while`, `for`, `case`)*
3. **Regions Formula**:
   $$V(G) = \\text{{Number of enclosed regions in planar CFG}} + 1$$

#### 3. Step-by-Step Numerical Example
Consider this code:
```python
if score >= 40:        # Decision 1
    if attendance >= 75:  # Decision 2
        print("Pass")
    else:
        print("Debarred")
else:
    print("Fail")
```
- Count decision statements: 2 decisions (`score >= 40` and `attendance >= 75`).
- Compute: $V(G) = 2 + 1 = 3$.
- **Basis Test Paths Needed**:
  - Path 1: `score = 30` (Fail branch)
  - Path 2: `score = 60, attendance = 60` (Debarred branch)
  - Path 3: `score = 80, attendance = 90` (Pass branch)

#### ⚠️ Professor's Exam Trap
$V(G)$ specifies the **minimum number of independent test paths** needed for 100% branch coverage—it does **not** guarantee 100% path coverage for infinite loops! Always draw the Control Flow Graph with numbered nodes in your exam paper!""",
                    "suggested_questions": [
                        "What is Boundary Value Analysis (BVA) vs Equivalence Class Partitioning?",
                        "What is the difference between Cohesion and Coupling?",
                        "Explain the SOLID design principles with code examples"
                    ]
                }

        # Distributed Computing Fallbacks
        if "distributed" in sub_lower or "dc" in sub_lower:
            if "clock" in msg_lower or "lamport" in msg_lower or "time" in msg_lower:
                return {
                    "reply": f"""### 💡 Understanding **Lamport Logical Clocks & Physical Clock Sync**

#### 1. The Core Intuition
In a distributed system, there is no shared physical quartz clock! If Computer A in Mumbai says 10:00:01 and Computer B in New York says 10:00:00, you cannot tell which event happened first using wall clocks due to clock drift and network latency.

Leslie Lamport realized: **We don't need real time; we only need causal order!** If message $m$ was sent by A and received by B, the send event *must* have happened before the receive event ($a \\to b$).

#### 2. Lamport's Clock Algorithm
Every node maintains an integer counter $L$:
1. Before an internal event: $L = L + 1$.
2. When sending message $m$: Attach timestamp $T_m = L$.
3. When receiving message $(m, T_m)$:
   $$L_{new} = \\max(L_{local}, T_m) + 1$$

#### ⚠️ Professor's Exam Trap
Lamport clocks guarantee causal consistency ($a \\to b \\implies L(a) < L(b)$). However, the reverse is **NOT true**: $L(a) < L(b)$ does **not** imply $a$ caused $b$ (they could be concurrent events)! To detect concurrency, **Vector Clocks** are required.""",
                    "suggested_questions": [
                        "What is the difference between Cristian's Algorithm and the Berkeley Algorithm?",
                        "Explain Two-Phase Commit (2PC) and why it is a blocking protocol",
                        "What are the 8 Fallacies of Distributed Systems?"
                    ]
                }

        # Artificial Intelligence and Soft Computing (AISC) Fallbacks
        if "soft" in sub_lower or "aisc" in sub_lower or "artificial" in sub_lower or "intelligence" in sub_lower:
            if "soft" in msg_lower and "hard" in msg_lower or "difference" in msg_lower or "computing" in msg_lower:
                return {
                    "reply": f"""### 💡 Understanding **Soft Computing vs. Hard Computing** in AISC

This is one of the most frequently asked 5-mark and 10-mark questions in the **Artificial Intelligence & Soft Computing** university exam!

---

#### 1. Real-World Intuition
- **Hard Computing (Conventional / Crisp)**: Imagine a **digital calculator or ATM**. If you ask it to compute $25 \\times 40$, it requires exact, unambiguous inputs and produces a 100% precise, deterministic answer ($1000$). If there is even a minor mathematical ambiguity or noisy input, traditional hard computing fails or crashes.
- **Soft Computing (Human-like / Tolerant)**: Imagine **how a human drives a car or parallel parks**. You don't solve complex Newtonian differential equations with 6 decimal places while braking; you say *"I'm getting pretty close, let me press the brake gently."* Soft computing mimics the remarkable human ability to make rational decisions in environments of **uncertainty, imprecision, partial truth, and approximation**.

---

#### 2. Comprehensive Comparison Table (Exam-Ready)

| Feature / Parameter | Hard Computing | Soft Computing |
| :--- | :--- | :--- |
| **Pioneering Foundation** | Alan Turing, John von Neumann | Lotfi A. Zadeh (1990s) |
| **Guiding Premise** | Exact, analytical mathematical model | Tolerance for imprecision, uncertainty, and partial truth |
| **Logic Utilized** | Two-valued Boolean logic (Strict 0 or 1, True or False) | Multi-valued Fuzzy logic ($[0, 1]$ degree of membership) |
| **Problem Solving** | Deterministic algorithms & exact formulas | Heuristics, meta-heuristics, and biological learning |
| **Search Space** | Sequential or exhaustive search | Stochastic, evolutionary search (e.g., Genetic Algorithms) |
| **Real-world Suitability** | Well-structured, mathematically tractable problems | Complex, non-linear, ill-defined, real-world systems |
| **Cost & Speed** | Computationally expensive for NP-hard problems | Low-cost, robust, and fast approximate solutions |

---

#### 3. The 4 Core Pillars of Soft Computing
Soft computing is not a single methodology; it is a synergistic partnership:
1. **Fuzzy Logic (FL)**: Models vagueness and human linguistic reasoning (*"warm", "fast", "steep"*).
2. **Artificial Neural Networks (ANN)**: Provides learning, adaptability, and pattern recognition from raw data.
3. **Genetic Algorithms (GA)**: Provides global optimization and survival-of-the-fittest evolutionary search.
4. **Probabilistic Reasoning (PR)**: Handles uncertainty and belief propagation (Bayesian Networks, Chaos Theory).

---

#### ⚠️ Professor's Exam Trap & Zadeh's Principle
> **Principle of Incompatibility (Lotfi Zadeh)**: *"As the complexity of a system increases, our ability to make precise and yet significant statements about its behavior diminishes until a threshold is reached beyond which precision and significance become almost mutually exclusive characteristics."*
> 
> In exams, remember: Soft computing does **NOT** compete with hard computing—it complements it! Hybrid systems like **Neuro-Fuzzy (ANFIS)** combine the learning ability of ANNs with the transparency of Fuzzy Logic.
""",
                    "suggested_questions": [
                        "What is the difference between Crisp Sets and Fuzzy Sets?",
                        "Explain the architecture and learning rule of a Single-Layer Perceptron",
                        "What are the genetic operators (Selection, Crossover, Mutation) in GA?",
                        "Explain the Mamdani vs Sugeno Fuzzy Inference Systems"
                    ]
                }

        # General Humanized Conceptual Answer
        return {
            "reply": f"""### 💡 Let's Break Down Your Question on **{student_message}**
*Subject: {subject_name} | Module: {chapter_name}*

Here is a clear, step-by-step pedagogical explanation to make this concept click:

#### 1. Intuition & The Big Picture
In **{subject_name}**, this topic is all about solving a fundamental tradeoff. Rather than memorizing abstract rules, think of it in terms of what problem engineers were trying to solve:
- **The Challenge**: Balancing system efficiency, reliability, and correctness under real-world constraints.
- **The Approach**: Decomposing the system into clear, manageable states and deterministic transitions.

#### 2. Core Concepts from Your Prescribed Syllabus & Book/PPT
- **Primary Mechanism**: When inputs enter the system, they follow formal transformation rules governed by boundary invariants.
- **Key Relationship**: Inputs and outputs must maintain consistency across all operational states.

#### 3. Step-by-Step Problem Solving Strategy
1. **Clarify Inputs & Given Values**: Always write down the initial parameters and assumptions first in your exam answer.
2. **Map the Intermediate State**: Draw a quick diagram (state diagram, flow graph, or block architecture).
3. **Check Edge Conditions**: Verify null inputs, upper bounds, and unexpected failure modes.

#### 🎓 University Exam Tip
When answering this topic in university exams, professors award maximum marks to answers that start with a clear **labeled block or state diagram** followed by a structured 3-point explanation. Avoid writing uninterrupted blocks of text!""",
            "suggested_questions": [
                f"Can you explain a concrete worked example of {chapter_name}?",
                f"What are the guaranteed 5-mark and 10-mark questions on {chapter_name}?",
                "What common traps should I avoid in this topic during exams?"
            ]
        }
    def _fallback_question_extractor(
        self,
        text: str,
        subject_name: str,
        chapter_names: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Extracts questions using question pattern matching or generates rich subject-specific questions.
        """
        extracted = []
        # Look for patterns like Q1., Question 1, 1), a) etc.
        pattern = r"(?:Q(?:uestion)?\.?\s*\d+|^\s*\d+[\.\)])\s*([^\n]+(?:\n(?!(?:Q(?:uestion)?\.?\s*\d+|^\s*\d+[\.\)]))[^\n]+)*)"
        matches = re.finditer(pattern, text, re.MULTILINE)

        q_num = 1
        for match in matches:
            q_text = match.group(1).strip()
            if len(q_text) > 25:
                # Assign to chapter by simple keyword or round-robin
                assigned_chapter = chapter_names[(q_num - 1) % len(chapter_names)] if chapter_names else "General Core"
                marks = 5.0 if q_num % 2 == 0 else (10.0 if q_num % 3 == 0 else 2.0)
                q_type = "MCQ" if marks <= 2 else ("Numerical" if "calculate" in q_text.lower() or "find" in q_text.lower() else "Long")
                extracted.append({
                    "text": q_text,
                    "question_type": q_type,
                    "marks": marks,
                    "chapter_name": assigned_chapter,
                    "difficulty": "Medium" if marks <= 5 else "Hard",
                    "solution": f"Model answer covers primary definitions, architectural diagrams, and key evaluation metrics for {assigned_chapter}.",
                    "tags": [subject_name.lower(), assigned_chapter.lower()]
                })
                q_num += 1

        if len(extracted) >= 3:
            return extracted

        # If text had no identifiable pattern (e.g. sample run or unstructured file), produce realistic domain questions
        default_ch = chapter_names[0] if chapter_names else "Core Architecture"
        second_ch = chapter_names[1] if len(chapter_names) > 1 else default_ch
        third_ch = chapter_names[2] if len(chapter_names) > 2 else default_ch

        return [
            {
                "text": f"Explain the fundamental architecture and lifecycle states in {default_ch}. Illustrate with a detailed state transition diagram.",
                "question_type": "Long",
                "marks": 10.0,
                "chapter_name": default_ch,
                "difficulty": "Medium",
                "solution": "Draw the 5-state process model (New, Ready, Running, Waiting, Terminated) and explain scheduler dispatches.",
                "tags": ["core", "diagram", "lifecycle"]
            },
            {
                "text": f"Compare and contrast the preemptive vs non-preemptive strategies used in {default_ch}.",
                "question_type": "Short",
                "marks": 5.0,
                "chapter_name": default_ch,
                "difficulty": "Easy",
                "solution": "Provide comparison on criteria: response time, context switch overhead, starvation susceptibility.",
                "tags": ["comparison", "algorithms"]
            },
            {
                "text": f"Given a set of 4 workloads with arrival and burst times [P1: (0, 8), P2: (1, 4), P3: (2, 9), P4: (3, 5)], compute the average turnaround time and waiting time using Shortest Remaining Time First (SRTF).",
                "question_type": "Numerical",
                "marks": 10.0,
                "chapter_name": second_ch,
                "difficulty": "Hard",
                "solution": "Construct Gantt chart: P1(0-1), P2(1-5), P4(5-10), P1(10-17), P3(17-26). Calculate completion times and waiting times.",
                "tags": ["numerical", "gantt-chart", "srtf"]
            },
            {
                "text": f"What are the four necessary and sufficient conditions for deadlock to occur in {second_ch}? How does Banker's Algorithm ensure safety?",
                "question_type": "Long",
                "marks": 10.0,
                "chapter_name": second_ch,
                "difficulty": "Hard",
                "solution": "List Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait. Detail safety algorithm matrix checking Need <= Work.",
                "tags": ["deadlock", "bankers-algorithm"]
            },
            {
                "text": f"Which of the following describes the condition when excessive paging operations cause the CPU utilization to collapse?",
                "question_type": "MCQ",
                "marks": 2.0,
                "chapter_name": third_ch,
                "difficulty": "Easy",
                "solution": "Thrashing occurs when the sum of working set sizes exceeds total physical memory frames.",
                "tags": ["mcq", "virtual-memory", "thrashing"]
            },
            {
                "text": f"Explain the working of Translation Lookaside Buffer (TLB) and compute Effective Memory Access Time (EMAT) with 80% hit ratio and 20ns TLB lookup.",
                "question_type": "Numerical",
                "marks": 7.0,
                "chapter_name": third_ch,
                "difficulty": "Medium",
                "solution": "EMAT = Hit_Ratio * (TLB + Mem) + (1 - Hit_Ratio) * (TLB + 2 * Mem).",
                "tags": ["tlb", "emat", "paging"]
            }
        ]

    def _fallback_gemini_summary(self, chapter_name: str, subject_name: str) -> Dict[str, Any]:
        specific = get_detailed_mastery_content(subject_name, chapter_name)
        if specific:
            return specific

        return {
            "summary_md": f"# 📚 {chapter_name} — High-Yield Conceptual Mastery\n*Subject: {subject_name}*\n\n### 1. 🎯 Overview & Definitions\nComprehensive coverage of syllabus concepts for {chapter_name} in {subject_name}.",
            "pitfalls": [f"Overlooking boundary cases in {chapter_name}"],
            "formulas": ["Standard curriculum formulations apply"]
        }

    def _fallback_quiz_generator(self, chapter_name: str, subject_name: str, count: int) -> List[Dict[str, Any]]:
        specific = get_subject_quiz_bank(subject_name, chapter_name, count)
        if specific:
            return specific

        bank = [
            {
                "question_text": f"In {chapter_name}, which scheduling strategy guarantees the minimum average waiting time for a given set of stationary processes?",
                "options": [
                    "A) First-Come, First-Served (FCFS)",
                    "B) Shortest Job First (SJF / SRTF)",
                    "C) Round Robin with large time quantum",
                    "D) Priority Scheduling without aging"
                ],
                "correct_answer": "B",
                "explanation": "Shortest Job First (SJF) is mathematically optimal as it gives the minimum average waiting time by scheduling shorter jobs first, minimizing cumulative queue delays.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "What phenomenon occurs when a high-priority process is indirectly preempted by a lower-priority process holding a shared lock?",
                "options": [
                    "A) Thrashing",
                    "B) Priority Inversion",
                    "C) Convoy Effect",
                    "D) Belady's Anomaly"
                ],
                "correct_answer": "B",
                "explanation": "Priority Inversion happens when a higher-priority task is blocked waiting for a resource locked by a lower-priority task, while medium-priority tasks prevent the lower-priority task from releasing it.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "Which of the following is NOT one of Coffman's four conditions required for deadlock to occur?",
                "options": [
                    "A) Mutual Exclusion",
                    "B) Circular Wait",
                    "C) Preemption allowed by kernel",
                    "D) Hold and Wait"
                ],
                "correct_answer": "C",
                "explanation": "No preemption is the necessary condition. If preemption is allowed, deadlock cannot occur because resources can be forcibly reclaimed.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "In a paged virtual memory system with a 4 KB page size, how many bits are required for the page offset?",
                "options": [
                    "A) 10 bits",
                    "B) 12 bits",
                    "C) 14 bits",
                    "D) 16 bits"
                ],
                "correct_answer": "B",
                "explanation": "Page offset = log2(Page Size). 4 KB = 4096 bytes = 2^12 bytes, so exactly 12 bits represent the page offset.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "What is the primary motivation for using Multi-Level Feedback Queues (MLFQ)?",
                "options": [
                    "A) Eliminating the need for context switches completely",
                    "B) Dynamically adjusting priority based on process CPU burst history without prior knowledge",
                    "C) Ensuring strict FCFS order for batch jobs",
                    "D) Maximizing memory fragmentation"
                ],
                "correct_answer": "B",
                "explanation": "MLFQ observes process behavior dynamically: I/O bound jobs stay in high-priority short-quantum queues, while CPU-bound jobs drop to lower-priority long-quantum queues.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "If a TLB lookup takes 10 ns and main memory access takes 100 ns, what is the Effective Access Time with an 80% TLB hit ratio?",
                "options": [
                    "A) 110 ns",
                    "B) 130 ns",
                    "C) 150 ns",
                    "D) 190 ns"
                ],
                "correct_answer": "B",
                "explanation": "EAT = 0.80 * (10 + 100) + 0.20 * (10 + 100 + 100) = 0.80 * 110 + 0.20 * 210 = 88 + 42 = 130 ns.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "Which page replacement algorithm can suffer from Belady's Anomaly (where increasing frame count increases page faults)?",
                "options": [
                    "A) Optimal (OPT)",
                    "B) Least Recently Used (LRU)",
                    "C) First-In, First-Out (FIFO)",
                    "D) Clock Algorithm"
                ],
                "correct_answer": "C",
                "explanation": "FIFO is not a stack algorithm, meaning the set of pages in memory for n frames is not guaranteed to be a subset of that for n+1 frames, leading to Belady's Anomaly.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "What is the Convoy Effect in CPU scheduling?",
                "options": [
                    "A) Fast processes causing slow processes to starve",
                    "B) Many short I/O bound processes waiting behind one long CPU-bound process in FCFS",
                    "C) Deadlock between multiple threads",
                    "D) Rapid thrashing between disk and RAM"
                ],
                "correct_answer": "B",
                "explanation": "Convoy effect happens under FCFS when one CPU-heavy process holds the CPU, while all fast I/O bound tasks sit idly in the ready queue, lowering overall device utilization.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "In Banker's Algorithm, a state is considered 'Safe' if:",
                "options": [
                    "A) No deadlock exists at the exact current second",
                    "B) There exists at least one sequence of process executions that allows all processes to finish without deadlock",
                    "C) All available resources exceed allocated resources",
                    "D) No thread requests more than 1 resource"
                ],
                "correct_answer": "B",
                "explanation": "A safe state means the system can allocate resources to each thread up to its maximum requirement in some safe order, avoiding deadlock.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "Why does Paging not suffer from External Fragmentation?",
                "options": [
                    "A) Because pages can be variable in size at runtime",
                    "B) Because physical memory is divided into fixed-size frames that can allocate any free frame to any page",
                    "C) Because the OS moves memory segments constantly",
                    "D) Because virtual memory is smaller than physical RAM"
                ],
                "correct_answer": "B",
                "explanation": "Any page can be mapped to any free physical frame, eliminating non-contiguous unusable holes between allocations (external fragmentation).",
                "question_type": "MCQ",
                "marks": 1.0
            }
        ]
        return bank[:count]

    def _extract_pitfalls_from_md(self, md: str) -> List[str]:
        pitfalls = []
        lines = md.split("\n")
        capture = False
        for line in lines:
            if "Pitfall" in line or "Trap" in line:
                capture = True
                continue
            if capture:
                if line.startswith("#"):
                    break
                if line.strip().startswith("-") or line.strip().startswith("*"):
                    clean = re.sub(r"^[\-\*\s]+", "", line).strip()
                    if clean:
                        pitfalls.append(clean)
        return pitfalls[:4] if pitfalls else ["Verify base cases in derivations", "Distinguish starvation from deadlock"]

    def generate_mastery_content(
        self,
        chapter_name: str,
        subject_name: str,
        pyqs_context: Optional[List[str]] = None,
        book_context: Optional[str] = None,
        topics: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates an in-depth, textbook-grounded mastery breakdown in Markdown.
        Integrates excerpts from student uploaded reference books (Hopcroft, Sivanandam, etc.).
        """
        client = self.get_client()
        pyq_snippet = "\n".join(f"- {q}" for q in (pyqs_context or [])[:6])

        if client:
            book_section = ""
            if book_context and len(book_context.strip()) > 50:
                book_section = f"""
Official College Prescribed Reference Materials (Extracted from Uploaded Books / PPTs):
{book_context}

CRITICAL INSTRUCTION: Fully analyze and synthesize the concepts, formal definitions, algorithms, diagrams, and slide notes from these uploaded Book/PPT excerpts, grounding every explanation strictly in the official {subject_name} syllabus!
"""
            topics_section = f"\nSpecific Syllabus Topics to Cover in Full Depth:\n{topics}\n" if topics else ""

            prompt = f"""
You are a distinguished university professor and master tutor creating an exhaustive, in-depth "Mastery Guide" for engineering students studying:
Subject: {subject_name}
Chapter: {chapter_name}
{topics_section}
{book_section}
Past Exam Questions for context:
{pyq_snippet if pyq_snippet else "Standard university syllabus questions"}

Generate a comprehensive, crystal-clear, deep-dive academic textbook guide in GitHub Flavored Markdown.
The student requested deep theoretical explanations so that once they read it, every concept is 100% clear before attempting the quiz.

STRICTLY use these 5 section headings in order (use ### prefix):

### 1. 🎯 Concept Overview & Core Definitions
Provide comprehensive, multi-paragraph conceptual foundations. Do not write brief bullet points.
Explain the intuition, architectural motivation, and exact mathematical definitions for all core terms.
Include ASCII or markdown state tables and structural diagrams where appropriate.

### 2. 📐 Derivations & Mathematical Foundations
Provide step-by-step mathematical proofs and rigorous derivations of all key formulas and theorems.
Use LaTeX math notation: $...$ for inline math and $$...$$ for block equations on separate lines.
Number each step clearly and explain the algebraic substitution and theoretical justification at every transition.

### 3. 💡 Worked Examples & Step-by-Step Solutions
Provide 2-3 comprehensive, fully worked numerical or architectural design examples from university exam papers.
Show the complete solution step-by-step, including input values, substitutions, and intermediate outputs.

### 4. 🏆 Exam Q&As — High-Probability Questions
List 4-5 expected university examination questions (including 5-mark and 10-mark questions) with complete, detailed model answers that would receive full marks from university examiners.
Format: **Q: [question text]** followed by the comprehensive answer below.

### 5. 🔑 Key Takeaways & Memory Hooks
Provide structured, high-yield summary points, common exam pitfalls to avoid, and mnemonic techniques.

Important Constraints:
- Use proper LaTeX math notation: $formula$ for inline, $$formula$$ for block (on their own lines)
- Do not use \\( \\) or \\[ \\] notation
- Keep math rigorous, accurate, and completely readable
- Depth requirement: Comprehensive, detailed explanation (1500 to 2500+ words). Leave no conceptual gaps.
"""
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                md = response.text.strip()
                pitfalls = self._extract_pitfalls_from_md(md)
                formulas = self._extract_formulas_from_md(md)
                return {
                    "unified_md": md,
                    "pitfalls": pitfalls,
                    "formulas": formulas,
                }
            except Exception as e:
                print(f"[GeminiService] Mastery content error: {e}. Falling back to template.")

        fallback = self._fallback_gemini_summary(chapter_name, subject_name)
        return {
            "unified_md": fallback["summary_md"],
            "pitfalls": fallback["pitfalls"],
            "formulas": fallback["formulas"],
        }

    def generate_revision_sheet(
        self,
        chapter_name: str,
        subject_name: str,
        pyqs_context: Optional[List[str]] = None,
        existing_pitfalls: Optional[List[str]] = None,
        existing_formulas: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generates a concise 1-page handwritten-style revision sheet as structured data:
        - summary_md: brief Markdown body (key points, derivations)
        - formulas: list of formula strings
        - mnemonics: list of memory hooks
        - pitfalls: list of exam traps
        - exam_questions: list of high-probability questions
        """
        client = self.get_client()
        pyq_snippet = "\n".join(f"- {q}" for q in (pyqs_context or [])[:5])

        if client:
            prompt = f"""
You are creating a condensed "1-Page Handwritten Revision Sheet" for a student's exam.
Subject: {subject_name}
Chapter: {chapter_name}

Past Exam Questions:
{pyq_snippet if pyq_snippet else "Standard university questions"}

Return ONLY valid JSON (no markdown, no code blocks) in this exact structure:
{{
  "summary_md": "Concise markdown body — key definitions, theorems, and derivations. Use $...$ for inline math and $$...$$ on separate lines for block math. Max 250 words.",
  "formulas": ["Formula 1 with notation", "Formula 2 with notation", "..."],
  "mnemonics": ["Memory hook 1", "Memory hook 2", "Acronym: EXAMPLE = E...", "..."],
  "pitfalls": ["Common mistake 1 students make", "Common mistake 2", "..."],
  "exam_questions": ["Expected question 1 (X marks)", "Expected question 2 (Y marks)", "..."]
}}

Rules:
- summary_md: 3-5 bullet points or short paragraphs with key concepts
- formulas: exactly 4-6 key formulas
- mnemonics: exactly 3-4 memory hooks
- pitfalls: exactly 3-4 common exam errors
- exam_questions: exactly 4-5 high-probability questions with marks hints
- All math: use $...$ inline, $$...$$ block (on their own line)
- Return ONLY the JSON object, nothing else
"""
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                raw = response.text.strip()
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
                parsed = json.loads(raw)
                return {
                    "summary_md": parsed.get("summary_md", ""),
                    "formulas": parsed.get("formulas", existing_formulas or []),
                    "mnemonics": parsed.get("mnemonics", []),
                    "pitfalls": parsed.get("pitfalls", existing_pitfalls or []),
                    "exam_questions": parsed.get("exam_questions", []),
                }
            except Exception as e:
                print(f"[GeminiService] Revision sheet error: {e}. Falling back to template.")

        # Fallback
        fb = self._fallback_gemini_summary(chapter_name, subject_name)
        return {
            "summary_md": fb["summary_md"][:800],
            "formulas": existing_formulas or fb["formulas"],
            "mnemonics": [
                f"CORE = C-oncept, O-peration, R-esult, E-xample for {chapter_name}",
                "Remember: Always write units, check boundary conditions",
            ],
            "pitfalls": existing_pitfalls or fb["pitfalls"],
            "exam_questions": [
                f"Define and explain {chapter_name} with examples. (5 marks)",
                f"Derive the key formula for {chapter_name}. (7 marks)",
                f"Compare and contrast two approaches in {chapter_name}. (5 marks)",
                f"Solve a numerical problem involving {chapter_name}. (10 marks)",
            ],
        }

    def _extract_formulas_from_md(self, md: str) -> List[str]:
        """Extract LaTeX formulas from markdown content."""
        formulas = []
        # Match $$ ... $$ block math
        block = re.findall(r'\$\$(.*?)\$\$', md, re.DOTALL)
        for f in block[:4]:
            clean = f.strip().replace('\n', ' ')
            if clean and len(clean) < 200:
                formulas.append(clean)
        # Match $ ... $ inline math (short ones only — likely formulas)
        inline = re.findall(r'\$([^$]{5,80})\$', md)
        for f in inline[:3]:
            if f.strip() not in formulas:
                formulas.append(f.strip())
        return formulas[:6] if formulas else [f"Core equations for {md[:30]}..."]


gemini_service = GeminiService()
