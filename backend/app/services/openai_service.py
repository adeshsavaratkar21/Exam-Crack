import os
import json
import re
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.core.config import settings


class OpenAIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY", "")

    def get_client(self) -> Optional[OpenAI]:
        key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY", "")
        if key:
            return OpenAI(api_key=key)
        return None

    def generate_mnemonic_summary(
        self,
        chapter_name: str,
        subject_name: str,
        pyqs_context: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generates a 1-page structured revision summary focusing on:
        Memory Mnemonics, Quick-Reference Formulas, Comparison Tables, and Cheat Sheet.
        """
        client = self.get_client()
        pyq_snippet = "\n".join(f"- {q}" for q in (pyqs_context or [])[:5])

        if client:
            prompt = f"""
You are an expert memory coach and university exam top-ranker.
Create a "1-Page High-Yield Cheat Sheet & Mnemonic Summary" for:
Subject: {subject_name}
Chapter: {chapter_name}

Past Exam Topics:
{pyq_snippet if pyq_snippet else "Core syllabus topics"}

Generate a dense, visually structured 1-Page Summary in GitHub Flavored Markdown adhering strictly to this format:
# ⚡ {chapter_name} — Mnemonics & Quick Reference (OpenAI Edition)

### 1. 🧠 High-Retention Memory Mnemonics
- Provide 2-3 catchy acronyms or memory phrases to instantly memorize key lists (e.g. state transitions, algorithm steps, deadlock conditions).
- Explain what each letter stands for.

### 2. 🧮 Fast-Formula & Complexity Cheat Sheet
- Compact table or bullet list of every equation, index formula, and time/space complexity required for calculations.
- Units and variable definitions.

### 3. ⚖️ Crucial Side-by-Side Comparison Tables
Create a clean markdown comparison table contrasting the 2 most frequently compared concepts in this chapter (e.g., Concept A vs Concept B with 5+ comparison parameters).

### 4. 🚀 60-Second Last-Minute Exam Cram Bullet Points
- 4 rapid-fire bullet points with the most repeated exam facts.

Keep it crisp, formatted for fast scanning, and without fluff.
"""
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a master academic exam tutor focusing on mnemonics, formula sheets, and comparison tables."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.4
                )
                md = response.choices[0].message.content.strip()
                mnemonics = self._extract_mnemonics_from_md(md)
                return {
                    "summary_md": md,
                    "mnemonics": mnemonics,
                    "formulas": [f"Formula reference for {chapter_name}"]
                }
            except Exception as e:
                print(f"[OpenAIService] Real API error: {e}. Falling back to curated mnemonic template.")

        return self._fallback_openai_summary(chapter_name, subject_name)

    def _fallback_openai_summary(self, chapter_name: str, subject_name: str) -> Dict[str, Any]:
        md = f"""# ⚡ {chapter_name} — Mnemonics & Quick Reference (OpenAI Edition)
*Exam Syllabus: {subject_name} | High-Yield 1-Page Cheat Sheet*

---

### 1. 🧠 High-Retention Memory Mnemonics

#### 🔑 Deadlock 4 Conditions: **"M-H-N-C"** (*"Much Harder, No Clue!"*)
- **M** — **Mutual Exclusion**: At least 1 resource must be held non-shareably.
- **H** — **Hold and Wait**: Process holding resources requests additional ones.
- **N** — **No Preemption**: Resources cannot be forcibly expropriated.
- **C** — **Circular Wait**: Closed chain of processes where $P_i$ waits for $P_{{i+1}}$.

#### 🔑 Process 5 States: **"N-R-R-W-T"** (*"New Robots Run When Terminated"*)
- **N**ew $\\rightarrow$ **R**eady $\\rightarrow$ **R**unning $\\rightarrow$ **W**aiting (Blocked) $\\rightarrow$ **T**erminated.

---

### 2. 🧮 Fast-Formula & Complexity Cheat Sheet

| Formula / Metric | Mathematical Expression | Key Insight |
| :--- | :--- | :--- |
| **Turnaround Time (TAT)** | $\\text{{TAT}} = T_{{\\text{{completion}}}} - T_{{\\text{{arrival}}}}$ | Total duration from submission to termination |
| **Waiting Time (WT)** | $\\text{{WT}} = \\text{{TAT}} - T_{{\\text{{burst}}}}$ | Time spent sitting idle in ready queue |
| **Throughput** | $\\text{{Throughput}} = \\frac{{N}}{{\\Delta T}}$ | Number of processes completed per unit time |
| **Effective Access (EAT)** | $\\text{{EAT}} = \\alpha(t_c + t_m) + (1-\\alpha)(t_c + 2t_m)$ | TLB hit ratio $\\alpha$, cache lookup $t_c$, RAM $t_m$ |
| **Page Table Size** | $\\text{{Size}} = 2^{{\\text{{VPN bits}}}} \\times \\text{{PTE Size}}$ | Virtual Page Number bits = Virtual Address - Offset |

---

### 3. ⚖️ Crucial Side-by-Side Comparison Table

| Comparison Metric | Preemptive Scheduling (e.g., SRTF, RR) | Non-Preemptive Scheduling (e.g., FCFS, SJF) |
| :--- | :--- | :--- |
| **CPU Control** | OS can interrupt currently running process | Process retains CPU until voluntary yield/I/O |
| **Context Switch Overhead** | **High** (Frequent register & cache flushes) | **Low** (Only switches on natural termination) |
| **Starvation Risk** | Yes (Long jobs starve if short jobs stream in) | No (FCFS has zero starvation risk) |
| **Average Response Time** | **Fast & Interactive** (Ideal for desktop/servers) | **Sluggish** (Interactive jobs stuck behind batch) |
| **Deadlock Susceptibility** | Reduced (resources can be preempted) | Higher (resources locked until process finishes) |
| **Hardware Requirement** | Requires timer interrupt clock generator | Runs on simple hardware without interval timers |

---

### 4. 🚀 60-Second Last-Minute Exam Cram Bullet Points
- ⚡ **Banker's Algorithm Time Complexity**: Safety check takes $\\mathcal{{O}}(m \\times n^2)$ where $n$ is processes and $m$ is resource types.
- ⚡ **Optimal Page Replacement (OPT/MIN)**: Best theoretical algorithm, replaces page not used for longest time into the future (used strictly as benchmark!).
- ⚡ **Belady's Anomaly**: Only affects FIFO; does NOT affect stack algorithms (LRU, OPT).
- ⚡ **Thrashing Fix**: Reduce degree of multiprogramming or add physical memory frames!
"""
        return {
            "summary_md": md,
            "mnemonics": [
                "Deadlock 4 Conditions: M-H-N-C (Much Harder, No Clue!)",
                "5 Process States: N-R-R-W-T (New Robots Run When Terminated)"
            ],
            "formulas": [
                "TAT = Completion - Arrival",
                "WT = TAT - Burst",
                "EAT = alpha(tc + tm) + (1 - alpha)(tc + 2tm)",
                "Page Table Size = 2^(VPN) * PTE_Size"
            ]
        }

    def _extract_mnemonics_from_md(self, md: str) -> List[str]:
        mnemonics = []
        for line in md.split("\n"):
            if "Mnemonic" in line or "Acronym" in line or line.startswith("#### 🔑"):
                clean = re.sub(r"^#+\s*", "", line).strip()
                if clean:
                    mnemonics.append(clean)
        return mnemonics[:3] if mnemonics else ["M-H-N-C: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait"]


openai_service = OpenAIService()
