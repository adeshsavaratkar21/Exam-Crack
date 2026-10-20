import os
import shutil
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db import models

router = APIRouter(prefix="/books", tags=["Reference Books"])

# Official University & College Prescribed Reference Textbooks by Subject
SYLLABUS_REFERENCE_BOOKS: Dict[str, List[Dict[str, Any]]] = {
    "DC": [
        {
            "id": "dc_book_1",
            "title": "Distributed Systems: Concepts and Design",
            "authors": "George Coulouris, Jean Dollimore, Tim Kindberg, Gordon Blair",
            "edition": "5th Edition",
            "publisher": "Pearson Education",
            "type": "Primary Textbook",
            "syllabus_coverage": "Comprehensive coverage of System Models, Networking, Interprocess Communication, Remote Invocation (RMI), Time & Global States, Coordination & Consensus.",
            "search_keywords": ["coulouris", "concepts and design", "distributed systems concepts"]
        },
        {
            "id": "dc_book_2",
            "title": "Distributed Systems: Principles and Paradigms",
            "authors": "Andrew S. Tanenbaum, Maarten Van Steen",
            "edition": "3rd / 2nd Edition",
            "publisher": "Pearson / Prentice Hall",
            "type": "Primary Textbook",
            "syllabus_coverage": "Architectures, Processes, Communication (RPC/Message-Queuing), Naming (DNS/DHT), Synchronization, Consistency & Replication, Fault Tolerance.",
            "search_keywords": ["tanenbaum", "steen", "principles and paradigms"]
        },
        {
            "id": "dc_book_3",
            "title": "Distributed Operating Systems: Concepts and Design",
            "authors": "Pradeep K. Sinha",
            "edition": "1st Edition",
            "publisher": "PHI Learning",
            "type": "Reference Book",
            "syllabus_coverage": "Theoretical foundations of Distributed Shared Memory (DSM), Process Management, Distributed File Systems (NFS/AFS).",
            "search_keywords": ["sinha", "pradeep", "operating systems concepts"]
        },
        {
            "id": "dc_book_4",
            "title": "Distributed and Cloud Computing: From Parallel Processing to the Internet of Things",
            "authors": "Kai Hwang, Geoffrey C. Fox, Jack J. Dongarra",
            "edition": "1st Edition",
            "publisher": "Morgan Kaufmann",
            "type": "Reference Book",
            "syllabus_coverage": "Modern Distributed Infrastructures, Virtualization, Cloud computing clusters, P2P networks, and IoT paradigms.",
            "search_keywords": ["hwang", "cloud computing", "morgan kaufmann", "dongarra"]
        }
    ],
    "SE": [
        {
            "id": "se_book_1",
            "title": "Software Engineering: A Practitioner's Approach",
            "authors": "Roger S. Pressman, Bruce R. Maxim",
            "edition": "8th / 9th Edition",
            "publisher": "McGraw-Hill Education",
            "type": "Primary Textbook",
            "syllabus_coverage": "Software Process Models (Waterfall, Agile, Scrum, DevOps), Requirement Engineering, UML Architectural Design, Software Testing Strategies.",
            "search_keywords": ["pressman", "practitioner", "maxim"]
        },
        {
            "id": "se_book_2",
            "title": "Software Engineering",
            "authors": "Ian Sommerville",
            "edition": "10th Edition",
            "publisher": "Pearson Education",
            "type": "Primary Textbook",
            "syllabus_coverage": "Socio-technical systems, Dependability and Security, Component-based Software Engineering, Project Management & Estimation (COCOMO).",
            "search_keywords": ["sommerville", "ian"]
        },
        {
            "id": "se_book_3",
            "title": "Fundamentals of Software Engineering",
            "authors": "Rajib Mall",
            "edition": "5th Edition",
            "publisher": "PHI Learning",
            "type": "Reference Book",
            "syllabus_coverage": "Software Life Cycle models, Structured Analysis & Design, Object-Oriented Software Design using UML, Coding & Testing.",
            "search_keywords": ["rajib", "mall"]
        },
        {
            "id": "se_book_4",
            "title": "Agile Software Development: Principles, Patterns, and Practices",
            "authors": "Robert C. Martin (Uncle Bob)",
            "edition": "1st Edition",
            "publisher": "Pearson / Prentice Hall",
            "type": "Reference Book",
            "syllabus_coverage": "SOLID design principles, Agile methodologies, Clean Architecture, Refactoring and Test-Driven Development (TDD).",
            "search_keywords": ["martin", "uncle bob", "clean code", "agile"]
        }
    ],
    "CNS": [
        {
            "id": "cns_book_1",
            "title": "Cryptography and Network Security: Principles and Practice",
            "authors": "William Stallings",
            "edition": "7th / 8th Edition",
            "publisher": "Pearson Education",
            "type": "Primary Textbook",
            "syllabus_coverage": "Classical Ciphers, Block Ciphers (DES/AES), Public Key Cryptography (RSA, ECC, Diffie-Hellman), Hash Functions (SHA-3), Digital Signatures.",
            "search_keywords": ["stallings", "cryptography and network", "william"]
        },
        {
            "id": "cns_book_2",
            "title": "Network Security Essentials: Applications and Standards",
            "authors": "William Stallings",
            "edition": "6th Edition",
            "publisher": "Pearson Education",
            "type": "Primary Textbook",
            "syllabus_coverage": "Network Authentication (Kerberos, X.509), Email Security (PGP/S-MIME), IP Security (IPsec), Transport-Level Security (SSL/TLS), Firewalls and IDS.",
            "search_keywords": ["network security essentials", "stallings essentials"]
        },
        {
            "id": "cns_book_3",
            "title": "Applied Cryptography: Protocols, Algorithms, and Source Code in C",
            "authors": "Bruce Schneier",
            "edition": "2nd Edition",
            "publisher": "John Wiley & Sons",
            "type": "Reference Book",
            "syllabus_coverage": "Cryptographic Protocols, Real-world Implementation details, Key management, Zero-knowledge proofs.",
            "search_keywords": ["schneier", "bruce", "applied cryptography"]
        },
        {
            "id": "cns_book_4",
            "title": "Security in Computing",
            "authors": "Charles P. Pfleeger, Shari Lawrence Pfleeger, Jonathan Margulies",
            "edition": "5th Edition",
            "publisher": "Prentice Hall",
            "type": "Reference Book",
            "syllabus_coverage": "Program Security (Buffer Overflows, Malicious Code), Operating System Security, Database Security, Administering Security.",
            "search_keywords": ["pfleeger", "security in computing"]
        }
    ],
    "TOC": [
        {
            "id": "toc_book_1",
            "title": "Introduction to Automata Theory, Languages, and Computation",
            "authors": "John E. Hopcroft, Rajeev Motwani, Jeffrey D. Ullman",
            "edition": "3rd Edition",
            "publisher": "Pearson Education",
            "type": "Primary Textbook",
            "syllabus_coverage": "Finite Automata (DFA/NFA/E-NFA), Regular Expressions & Pumping Lemma, Context-Free Grammars & Pushdown Automata, Turing Machines, Decidability.",
            "search_keywords": ["hopcroft", "ullman", "motwani", "automata theory"]
        },
        {
            "id": "toc_book_2",
            "title": "Introduction to the Theory of Computation",
            "authors": "Michael Sipser",
            "edition": "3rd Edition",
            "publisher": "Cengage Learning",
            "type": "Primary Textbook",
            "syllabus_coverage": "Formal language theory, Reducibility, Rice's Theorem, Post Correspondence Problem (PCP), Time and Space Complexity classes (P vs NP, NP-Complete).",
            "search_keywords": ["sipser", "theory of computation"]
        },
        {
            "id": "toc_book_3",
            "title": "Elements of the Theory of Computation",
            "authors": "Harry R. Lewis, Christos H. Papadimitriou",
            "edition": "2nd Edition",
            "publisher": "PHI Learning",
            "type": "Reference Book",
            "syllabus_coverage": "Mathematical Preliminaries, Grammars and Automata, Computability, Undecidability proofs.",
            "search_keywords": ["lewis", "papadimitriou"]
        },
        {
            "id": "toc_book_4",
            "title": "Formal Languages and Automata",
            "authors": "Peter Linz",
            "edition": "6th Edition",
            "publisher": "Jones & Bartlett Learning",
            "type": "Reference Book",
            "syllabus_coverage": "Step-by-step automata constructions, JFLAP visualizations, Simplified derivations of normal forms (CNF/GNF).",
            "search_keywords": ["linz", "peter linz"]
        }
    ],
    "AISC": [
        {
            "id": "aisc_book_1",
            "title": "Artificial Intelligence: A Modern Approach",
            "authors": "Stuart Russell, Peter Norvig",
            "edition": "4th Edition",
            "publisher": "Pearson Education",
            "type": "Primary Textbook",
            "syllabus_coverage": "Intelligent Agents, Uninformed & Informed Search (A*, IDA*), Adversarial Search (Minimax, Alpha-Beta), Knowledge Representation, Probabilistic Reasoning.",
            "search_keywords": ["russell", "norvig", "modern approach", "aima"]
        },
        {
            "id": "aisc_book_2",
            "title": "Neural Networks, Fuzzy Logic and Genetic Algorithms: Synthesis and Applications",
            "authors": "S. Rajasekaran, G. A. Vijayalakshmi Pai",
            "edition": "1st / 2nd Edition",
            "publisher": "PHI Learning",
            "type": "Primary Textbook",
            "syllabus_coverage": "Artificial Neural Networks (Perceptron, Backprop, Hopfield), Fuzzy Logic (Membership, Defuzzification), Genetic Algorithms (Crossover, Mutation).",
            "search_keywords": ["rajasekaran", "pai", "soft computing"]
        },
        {
            "id": "aisc_book_3",
            "title": "Principles of Soft Computing",
            "authors": "S. N. Sivanandam, S. N. Deepa",
            "edition": "3rd Edition",
            "publisher": "John Wiley & Sons",
            "type": "Reference Book",
            "syllabus_coverage": "Hybrid Soft Computing Systems (Neuro-Fuzzy, Genetic-Neuro), Optimization algorithms, Fuzzy control systems.",
            "search_keywords": ["sivanandam", "deepa"]
        },
        {
            "id": "aisc_book_4",
            "title": "Fuzzy Logic with Engineering Applications",
            "authors": "Timothy J. Ross",
            "edition": "4th Edition",
            "publisher": "John Wiley & Sons",
            "type": "Reference Book",
            "syllabus_coverage": "Mathematical properties of Fuzzy sets, Classical vs Fuzzy Relations, Fuzzy rule bases, Pattern recognition applications.",
            "search_keywords": ["ross", "fuzzy logic engineering"]
        }
    ],
    "MDM": [
        {
            "id": "mdm_book_1",
            "title": "Python for Data Analysis: Data Wrangling with Pandas, NumPy, and Jupyter",
            "authors": "Wes McKinney",
            "edition": "3rd Edition",
            "publisher": "O'Reilly Media",
            "type": "Primary Textbook",
            "syllabus_coverage": "Data cleaning, manipulation, time series analysis, and visualization using NumPy, Pandas, and Matplotlib.",
            "search_keywords": ["mckinney", "pandas", "data analysis", "python"]
        },
        {
            "id": "mdm_book_2",
            "title": "Management Information Systems: Managing the Digital Firm",
            "authors": "Kenneth C. Laudon, Jane P. Laudon",
            "edition": "16th / 17th Edition",
            "publisher": "Pearson Education",
            "type": "Primary Textbook",
            "syllabus_coverage": "Information Systems in Global Business, Ethical and Social issues, Enterprise Applications (ERP, SCM, CRM), Business Intelligence.",
            "search_keywords": ["laudon", "management information systems", "mis"]
        },
        {
            "id": "mdm_book_3",
            "title": "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
            "authors": "Aurélien Géron",
            "edition": "3rd Edition",
            "publisher": "O'Reilly Media",
            "type": "Reference Book",
            "syllabus_coverage": "End-to-End Machine Learning project pipelines, Classification, Regression, Dimensionality Reduction, Deep Neural Networks.",
            "search_keywords": ["geron", "hands-on", "scikit-learn"]
        }
    ]
}


def _format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def _get_books_directory(subject_code: str) -> str:
    """Returns the absolute folder path where books for this subject are stored."""
    folder = os.path.join(settings.UPLOAD_DIR, subject_code, "books")
    os.makedirs(folder, exist_ok=True)
    return folder


@router.get("/subject/{identifier}")
def get_subject_reference_books(identifier: str, db: Session = Depends(get_db)):
    """
    Returns prescribed syllabus reference books for a subject along with any
    detected PDF textbook files stored in `backend/uploads/<CODE>/books/`.
    """
    subject = None
    if identifier.isdigit():
        subject = db.query(models.Subject).filter(models.Subject.id == int(identifier)).first()
    if not subject:
        subject = db.query(models.Subject).filter(models.Subject.code.ilike(identifier)).first()

    sub_code = (subject.code if subject else identifier).upper()
    sub_name = subject.name if subject else sub_code

    books_dir = _get_books_directory(sub_code)
    normalized_books_dir = os.path.abspath(books_dir).replace("/", "\\")

    SUPPORTED_EXTS = (".pdf", ".ppt", ".pptx")

    # List all PDF and PPT files inside this subject's materials directory
    existing_files: List[Dict[str, Any]] = []
    if os.path.exists(books_dir):
        for fname in os.listdir(books_dir):
            if fname.lower().endswith(SUPPORTED_EXTS):
                full_path = os.path.join(books_dir, fname)
                try:
                    size = os.path.getsize(full_path)
                    mtime = os.path.getmtime(full_path)
                except Exception:
                    size = 0
                    mtime = 0
                is_ppt = fname.lower().endswith((".ppt", ".pptx"))
                existing_files.append({
                    "filename": fname,
                    "file_url": f"/uploads/{sub_code}/books/{fname}",
                    "file_size": _format_size(size),
                    "file_size_bytes": size,
                    "file_type": "PPT" if is_ppt else "PDF",
                    "is_ppt": is_ppt,
                    "modified_at": mtime
                })

    # Match files with prescribed syllabus books
    prescribed = [dict(b) for b in SYLLABUS_REFERENCE_BOOKS.get(sub_code, [])]
    matched_filenames = set()

    for book in prescribed:
        book["pdf_file"] = None
        keywords = book.get("search_keywords", [])
        book_id = book.get("id", "")

        for f in existing_files:
            fname_lower = f["filename"].lower()
            # Direct ID match or keyword match
            if book_id in fname_lower or any(kw.lower() in fname_lower for kw in keywords):
                book["pdf_file"] = f
                matched_filenames.add(f["filename"])
                break

    # Unmatched / additional PDFs and PPTs placed in the folder
    additional_pdfs = [f for f in existing_files if f["filename"] not in matched_filenames]

    total_ppts = sum(1 for f in existing_files if f.get("is_ppt"))
    total_pdfs = sum(1 for f in existing_files if not f.get("is_ppt"))

    return {
        "subject_id": subject.id if subject else None,
        "subject_code": sub_code,
        "subject_name": sub_name,
        "target_exam": subject.target_exam if subject else "Semester Exam",
        "books_folder_path": normalized_books_dir,
        "books_folder_url": f"/uploads/{sub_code}/books/",
        "total_books_prescribed": len(prescribed),
        "total_materials_available": len(existing_files),
        "total_pdfs_available": total_pdfs,
        "total_ppts_available": total_ppts,
        "prescribed_books": prescribed,
        "additional_pdfs": additional_pdfs,
        "all_materials": existing_files
    }


@router.post("/upload")
def upload_reference_book(
    subject_id: int = Form(...),
    file: UploadFile = File(...),
    book_id: Optional[str] = Form(None),
    custom_title: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Uploads a textbook PDF or lecture PPT/PPTX for a subject and saves it into `backend/uploads/<CODE>/books/`.
    """
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    allowed_exts = (".pdf", ".ppt", ".pptx")
    if not file.filename.lower().endswith(allowed_exts):
        raise HTTPException(
            status_code=400,
            detail="Only PDF textbook files and PowerPoint presentations (.ppt, .pptx) are supported"
        )

    sub_code = (subject.code or f"SUB_{subject_id}").upper()
    books_dir = _get_books_directory(sub_code)

    # Sanitize filename
    clean_name = os.path.basename(file.filename).replace(" ", "_")
    if book_id:
        clean_name = f"{book_id}_{clean_name}"
    
    dest_path = os.path.join(books_dir, clean_name)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(dest_path)

    return {
        "success": True,
        "message": f"Textbook '{file.filename}' uploaded successfully for {sub_code}",
        "filename": clean_name,
        "file_url": f"/uploads/{sub_code}/books/{clean_name}",
        "file_size": _format_size(file_size),
        "folder_path": os.path.abspath(books_dir)
    }


@router.delete("/delete")
def delete_reference_book(
    subject_code: str,
    filename: str
):
    """
    Deletes a textbook PDF file from the subject's books directory.
    """
    sub_code = subject_code.upper()
    books_dir = _get_books_directory(sub_code)
    clean_name = os.path.basename(filename)
    target_path = os.path.join(books_dir, clean_name)

    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="Book file not found")

    try:
        os.remove(target_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {e}")

    return {
        "success": True,
        "message": f"Removed '{clean_name}' from {sub_code} reference books."
    }
