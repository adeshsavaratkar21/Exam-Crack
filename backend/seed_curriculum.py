import datetime
import json
import os
import shutil
from app.db.database import SessionLocal, Base, engine
from app.db import models
from app.services.analytics_service import analytics_service
from app.services.gemini_service import gemini_service
from app.services.openai_service import openai_service
from app.core.config import settings

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Remove old subjects or clear cleanly
    db.query(models.QuizQuestion).delete()
    db.query(models.Quiz).delete()
    db.query(models.ChapterSummary).delete()
    db.query(models.ReadinessMetric).delete()
    db.query(models.Question).delete()
    db.query(models.PYQDocument).delete()
    db.query(models.Chapter).delete()
    db.query(models.Subject).delete()
    db.commit()

    subjects_data = [
        {
            "code": "DC",
            "name": "Distributed Computing",
            "course_code": "CS301 / CE301",
            "credits": 4,
            "target_exam": "Semester 5 University Endsem (CS301/CE301)",
            "total_marks": 100.0,
            "exam_scheme": {
                "theory_total": 75,
                "lab_total": 25,
                "grand_total": 100,
                "components": [
                    {"name": "In-Semester Evaluation (ISE)", "marks": 15, "type": "Theory (Continuous Quizzes/Assignments)"},
                    {"name": "Mid-Semester Examination (MSE)", "marks": 15, "type": "Theory (Written Exam)"},
                    {"name": "End-Semester Examination (ESE)", "marks": 45, "type": "Theory (University Paper)"},
                    {"name": "Laboratory Evaluation", "marks": 25, "type": "Lab (15 Continuous + 10 ESE Practical/Oral)"}
                ],
                "teaching_scheme_hours": "3L + 0T + 2P = 5 Hrs/Week",
                "passing_rule": "Minimum 40% aggregate in Theory & Lab components"
            },
            "chapters": [
                {
                    "unit_number": 1,
                    "name": "Introduction to Distributed Systems",
                    "teaching_hours": 8,
                    "weightage_percent": 19.0,
                    "estimated_ese_marks": 9.0,
                    "comp": True,
                    "topics": [
                        "1.1 Definition, Goals, Types of Distributed Computing Models, Issues in Distributed Systems",
                        "1.2 Hardware Concepts, Software Concepts, The Client-Server Model",
                        "1.3 Positioning Middleware, Models of Middleware, Services offered by Middleware"
                    ]
                },
                {
                    "unit_number": 2,
                    "name": "Communication in Distributed Systems",
                    "teaching_hours": 10,
                    "weightage_percent": 23.8,
                    "estimated_ese_marks": 11.0,
                    "comp": True,
                    "topics": [
                        "2.1 Interprocess Communication (IPC): Message passing, RPC, RMI",
                        "2.2 Message-Oriented Communication: Persistence and synchronicity, Transient/Persistent communication sockets",
                        "2.3 Desirable features of message passing, message structure, synchronization & buffering",
                        "2.4 Multi-datagram messages, failure handling, group communication, and multicast"
                    ]
                },
                {
                    "unit_number": 3,
                    "name": "Process and Clock Synchronization and Coordination",
                    "teaching_hours": 10,
                    "weightage_percent": 23.8,
                    "estimated_ese_marks": 11.0,
                    "comp": False,
                    "topics": [
                        "3.1 Threads in Distributed Systems, Clients, Servers, Code Migration approaches & models",
                        "3.2 Clock Synchronization: Cristian's and Berkeley algorithms",
                        "3.3 Logical Clocks: Lamport's Timestamps, Vector Clocks",
                        "3.4 Mutual Exclusion: Token-based, Non-token-based, Quorum-based",
                        "3.5 Election Algorithms: Bully Algorithm, Ring Algorithm"
                    ]
                },
                {
                    "unit_number": 4,
                    "name": "Consistency and Replication",
                    "teaching_hours": 6,
                    "weightage_percent": 14.3,
                    "estimated_ese_marks": 6.0,
                    "comp": False,
                    "topics": [
                        "4.1 Data-centric and Client-centric consistency models",
                        "4.2 Replication strategies, quorum consensus, and consistency protocols",
                        "4.3 Types of Failures, Replication Techniques, and Fault Tolerance"
                    ]
                },
                {
                    "unit_number": 5,
                    "name": "Distributed File Systems & Case Studies",
                    "teaching_hours": 8,
                    "weightage_percent": 19.0,
                    "estimated_ese_marks": 9.0,
                    "comp": False,
                    "topics": [
                        "5.1 Design & Implementation of DFS: NFS, AFS, HDFS, Google File System (GFS), Hadoop, Apache Kafka",
                        "5.2 Emerging Trends: Blockchain architectures, Bitcoin, HPC, Microservices, Distributed AI & Machine Learning"
                    ]
                },
                {
                    "unit_number": 6,
                    "name": "Self Study & Advanced Architectures",
                    "teaching_hours": 6,
                    "weightage_percent": 0.0,
                    "estimated_ese_marks": 0.0,
                    "comp": False,
                    "topics": [
                        "Cloud Computing, Edge Computing, and Fog Computing",
                        "Need for Edge/Fog in IoT, Architectures & Real-world Applications, Open MPI"
                    ]
                }
            ],
            "pyqs": [
                ("Unit 2: Communication in Distributed Systems", "Explain the desirable features of a good message-passing system. Differentiate between transient and persistent communication with socket examples.", "Long", 10.0, "Medium"),
                ("Unit 3: Process and Clock Synchronization and Coordination", "Explain Lamport's Logical Clock conditions. Trace the vector timestamp sequence for 3 processes communicating with 5 message events.", "Numerical", 10.0, "Hard"),
                ("Unit 3: Process and Clock Synchronization and Coordination", "Explain the Bully Election Algorithm and Ring Algorithm. Compare their message complexities in best and worst cases.", "Long", 10.0, "Medium"),
                ("Unit 1: Introduction to Distributed Systems", "Differentiate between RMI (Remote Method Invocation) and RPC (Remote Procedure Call) with architectural diagrams.", "Short", 5.0, "Easy"),
                ("Unit 4: Consistency and Replication", "Differentiate between Data-centric consistency (Strict, Sequential, Causal) and Client-centric consistency (Monotonic Read/Write).", "Short", 5.0, "Medium"),
                ("Unit 5: Distributed File Systems & Case Studies", "Discuss the architectural difference between HDFS (Hadoop) and Google File System (GFS) for master-chunkserver fault tolerance.", "Long", 10.0, "Hard")
            ]
        },
        {
    "code": "SE",
    "name": "Software Engineering",
    "course_code": "CE-302",
    "credits": 4,
    "exam_scheme": {
        "theory_total": 75,
        "lab_total": 25,
        "grand_total": 100,
        "components": [
            {"name": "In-Semester Evaluation (ISE)", "marks": 15, "type": "Theory"},
            {"name": "Mid-Semester Examination (MSE)", "marks": 15, "type": "Theory"},
            {"name": "End-Semester Examination (ESE)", "marks": 45, "type": "Theory"},
            {"name": "Laboratory Evaluation", "marks": 25, "type": "Lab (15 Continuous + 10 ESE)"}
        ],
        "teaching_scheme_hours": "3L + 0T + 2P = 5 Hrs/Week (10 Total Credits/Workload)",
        "passing_rule": "Minimum 40% aggregate in Theory & Lab components"
    },
    "chapters": [
        {
            "unit_number": 1,
            "name": "Introduction to Software Engineering & Process Models",
            "teaching_hours": 6,
            "weightage_percent": 14.3,
            "estimated_ese_marks": 6,
            "topics": [
                "1.1 Nature of Software, The Software Process, Software Engineering Practice",
                "1.2 Traditional Life Cycle Models: Waterfall, Incremental, Iterative, Spiral, V-Model",
                "1.3 Agile Software Engineering Process Models: SCRUM, Extreme Programming (XP)"
            ]
        },
        {
            "unit_number": 2,
            "name": "Requirements Management and Project Management",
            "teaching_hours": 10,
            "weightage_percent": 23.8,
            "estimated_ese_marks": 11,
            "topics": [
                "2.1 Requirement Gathering & Analysis, SRS (IEEE format), Functional Specifications with Use Cases",
                "2.2 Validating Requirements, Traceability Matrix, Managing Changing Requirements, Agile Requirements Engineering",
                "2.3 Project Scheduling: Work Breakdown Structure (WBS), Gantt Charts, PERT Charts, Critical Path Method (CPM)",
                "2.4 Cost Estimation: Decomposition techniques, Empirical estimation models (COCOMO)",
                "2.5 Software Risk Management: Risk Identification, Projection, Refinement, RMMM Plan"
            ]
        },
        {
            "unit_number": 3,
            "name": "Software Analysis and Design",
            "teaching_hours": 10,
            "weightage_percent": 23.8,
            "estimated_ese_marks": 11,
            "topics": [
                "3.1 Difference between Structured and Object-Oriented Analysis",
                "3.2 Structured Analysis & Design: Data Flow Diagrams (DFD Level 0 & 1), Structure Charts",
                "3.3 Architectural Design: Coupling and Cohesion, Architecture views, Styles (Pipe & Filter, Shared-Data, Client-Server)",
                "3.4 OOAD Diagrams: Use Case, Class, Interaction (Sequence/Collaboration), Activity, State Chart, Component, and Deployment diagrams"
            ]
        },
        {
            "unit_number": 4,
            "name": "Object Oriented Software Development & Design Patterns",
            "teaching_hours": 6,
            "weightage_percent": 14.3,
            "estimated_ese_marks": 6,
            "topics": [
                "4.1 Design Patterns Overview, Architectural Patterns: MVC (Model-View-Controller)",
                "4.2 GoF (Gang of Four) Design Patterns: Singleton Pattern, Observer Pattern",
                "4.3 GRASP Patterns: Low Coupling, High Cohesion, Controller, Law of Demeter, Information Expert, Creator"
            ]
        },
        {
            "unit_number": 5,
            "name": "Software Testing and Quality Assurance",
            "teaching_hours": 10,
            "weightage_percent": 23.8,
            "estimated_ese_marks": 11,
            "topics": [
                "5.1 Testing Levels: Unit Testing, Integration Testing, System Testing",
                "5.2 Black-Box Testing: Equivalence Class Partitioning (ECP), Boundary Value Analysis (BVA)",
                "5.3 White-Box Testing: Statement, Branch, Condition, Condition/Decision, MC/DC, Path Coverage",
                "5.4 McCabe’s Cyclomatic Complexity Metric, Data Flow-based Testing, Mutation Testing",
                "5.5 Software Metrics: Product Metrics (McCall's Quality Factors), Process, Project, and Source Code Metrics",
                "5.6 Software Quality Concepts, SQA vs SQC, Formal Technical Reviews (FTR)"
            ]
        },
        {
            "unit_number": 6,
            "name": "Self Study: Software Engineering with Open Source and GenAI",
            "teaching_hours": 5,
            "weightage_percent": 0.0,
            "estimated_ese_marks": 0,
            "topics": [
                "Open Source Development Workflows and Tooling",
                "Generative AI in Software Engineering (Prompt-driven code generation, Automated Testing, Code Reviews)"
            ]
        }
    ],
    "pyqs": [
        ("Unit 5: Software Testing and Quality Assurance", "Draw the Control Flow Graph (CFG) for a binary search function. Calculate Cyclomatic Complexity using 3 methods: V(G) = E - N + 2P.", "Numerical", 10.0, "Hard"),
        ("Unit 1: Introduction to Software Engineering & Process Models", "Compare the Scrum Agile framework with the Spiral Risk-Driven Model on 5 software lifecycle metrics.", "Short", 5.0, "Medium"),
        ("Unit 2: Requirements Management and Project Management", "Explain the structure of an IEEE 830 format Software Requirements Specification (SRS) document with examples.", "Long", 8.0, "Medium")
    ]
},
        {
    "code": "AISC",
    "name": "Artificial Intelligence and Soft Computing",
    "course_code": "CE303",
    "credits": 4,
    "exam_scheme": {
        "theory_total": 67,
        "lab_total": 33,
        "grand_total": 100,
        "components": [
            {"name": "In-Semester Evaluation (ISE)", "marks": 13, "type": "Theory"},
            {"name": "Mid-Semester Examination (MSE)", "marks": 14, "type": "Theory"},
            {"name": "End-Semester Examination (ESE)", "marks": 40, "type": "Theory"},
            {"name": "Laboratory Evaluation", "marks": 33, "type": "Lab (26 Continuous + 7 ESE)"}
        ],
        "teaching_scheme_hours": "3L + 0T + 2P = 5 Hrs/Week (10 Workload/Total)",
        "passing_rule": "Minimum 40% aggregate in Theory & Lab components"
    },
    "chapters": [
        {
            "unit_number": 1,
            "name": "Introduction to AI and Soft Computing Techniques",
            "teaching_hours": 6,
            "weightage_percent": 14.3,
            "estimated_ese_marks": 6,
            "topics": [
                "1.1 Definition, History and Future of AI, Intelligent Agents, Agents and Environments, Rationality",
                "1.2 Nature of Environment, Structure of Agent, Problem Solving Approach, Introduction to Expert System Design",
                "1.3 Soft Computing Constituents, Difference between Hard Computing and Soft Computing"
            ]
        },
        {
            "unit_number": 2,
            "name": "Neural Networks",
            "teaching_hours": 12,
            "weightage_percent": 28.6,
            "estimated_ese_marks": 11,
            "topics": [
                "2.1 Biological Neural Networks, Models of ANN, Terminologies, Activation Functions, McCulloch-Pitts Model, Linear Separability, Hebb Network",
                "2.2 Supervised Learning: Perceptron (Single Layer, Multi Layer), Adaline, Delta Learning Rule, Backpropagation Algorithm",
                "2.3 Unsupervised Learning: Hebbian Learning, Winner Take All, Self-Organizing Maps (KSOM), Learning Vector Quantization (LVQ)"
            ]
        },
        {
            "unit_number": 3,
            "name": "Associative Memory Networks",
            "teaching_hours": 4,
            "weightage_percent": 9.5,
            "estimated_ese_marks": 4,
            "topics": [
                "3.1 Autoassociative and Heteroassociative Memory Networks",
                "3.2 Bidirectional Associative Memory (BAM)",
                "3.3 Hopfield Network"
            ]
        },
        {
            "unit_number": 4,
            "name": "Fuzzy Logic, Classical Sets and Fuzzy Relations",
            "teaching_hours": 12,
            "weightage_percent": 28.6,
            "estimated_ese_marks": 11,
            "topics": [
                "4.1 Introduction to Fuzzy Logic, Classical Sets vs Fuzzy Sets, Membership Functions, Set Operations and Properties",
                "4.2 Classical and Fuzzy Relations: Cartesian Product of Relations, Fuzzy Max-Min and Max-Product Composition, Fuzzy Extension Principle"
            ]
        },
        {
            "unit_number": 5,
            "name": "Fuzzy Control System Design and Hybrid Models",
            "teaching_hours": 8,
            "weightage_percent": 19.0,
            "estimated_ese_marks": 8,
            "topics": [
                "5.1 Fuzzy Inference System (FIS), Types of FIS, Fuzzification, Defuzzification Methods, Design of Fuzzy Controllers",
                "5.2 Introduction to Neuro-Fuzzy Systems, Architecture of Neuro-Fuzzy Networks (ANFIS)"
            ]
        },
        {
            "unit_number": 6,
            "name": "Self Study: Advanced Neural & Optimization Architectures",
            "teaching_hours": 5,
            "weightage_percent": 0.0,
            "estimated_ese_marks": 0,
            "topics": [
                "Adaptive Resonance Theory (ART)",
                "Genetic Algorithms (GA)",
                "Convolutional Neural Networks (CNN)",
                "Transfer Learning"
            ]
        }
    ],
    "pyqs": [
        ("Unit 2: Neural Networks", "Derive the gradient weight update equations for a Multi-Layer Perceptron using the Backpropagation algorithm with Sigmoid activation.", "Long", 10.0, "Hard"),
        ("Unit 4: Fuzzy Logic, Classical Sets and Fuzzy Relations", "Given fuzzy sets A and B with triangular membership functions, compute Max-Min and Max-Product composition R o S.", "Numerical", 8.0, "Hard"),
        ("Unit 1: Introduction to AI and Soft Computing Techniques", "Differentiate between hard computing and soft computing techniques on 5 dimensions with engineering examples.", "Short", 5.0, "Easy")
    ]
},
        {
    "code": "TOC",
    "name": "Theory of Computation",
    "course_code": "CE304",
    "credits": 3,
    "exam_scheme": {
        "theory_total": 100,
        "lab_total": 0,
        "grand_total": 100,
        "components": [
            {"name": "In-Semester Evaluation (ISE)", "marks": 20, "type": "Theory"},
            {"name": "Mid-Semester Examination (MSE)", "marks": 20, "type": "Theory"},
            {"name": "End-Semester Examination (ESE)", "marks": 60, "type": "Theory"}
        ],
        "teaching_scheme_hours": "3L + 0T + 0P = 3 Hrs/Week (8 Workload/Total)",
        "passing_rule": "Minimum 40% aggregate in Theory component"
    },
    "chapters": [
        {
            "unit_number": 1,
            "name": "Sets, Relations and Languages",
            "teaching_hours": 3,
            "weightage_percent": 7.1,
            "estimated_ese_marks": 4,
            "topics": [
                "1.1 Relations and Functions",
                "1.2 Alphabets, Strings, and Languages",
                "1.3 Types of Mathematical Proofs (Induction, Contradiction)"
            ]
        },
        {
            "unit_number": 2,
            "name": "Finite Automata",
            "teaching_hours": 7,
            "weightage_percent": 16.7,
            "estimated_ese_marks": 10,
            "topics": [
                "2.1 Regular Languages and Regular Expressions",
                "2.2 Deterministic Finite Automata (DFA), Nondeterministic Finite Automata (NFA), NFA with epsilon-transitions",
                "2.3 Kleene's Theorem",
                "2.4 NFA to DFA Conversion (Subset Construction)",
                "2.5 Finite Automata with Output: Moore and Mealy Machines"
            ]
        },
        {
            "unit_number": 3,
            "name": "Regular Languages & Properties",
            "teaching_hours": 6,
            "weightage_percent": 14.3,
            "estimated_ese_marks": 9,
            "topics": [
                "3.1 Pumping Lemma for Regular Languages and its Applications",
                "3.2 Closure Properties of Regular Languages",
                "3.3 Equivalence and State Minimization of Automata (Table Filling Method)",
                "3.4 Myhill-Nerode Theorem"
            ]
        },
        {
            "unit_number": 4,
            "name": "Context-Free Grammars and Languages",
            "teaching_hours": 5,
            "weightage_percent": 11.9,
            "estimated_ese_marks": 7,
            "topics": [
                "4.1 Definition of CFG, Derivations, Language of a Grammar, Sentential Forms",
                "4.2 Parse Trees: Inferences to Trees, Trees to Derivations, Recursive Inferences",
                "4.3 Ambiguity in Grammars and Languages, Methods for Removing Ambiguity"
            ]
        },
        {
            "unit_number": 5,
            "name": "Pushdown Automata (PDA)",
            "teaching_hours": 6,
            "weightage_percent": 14.3,
            "estimated_ese_marks": 9,
            "topics": [
                "5.1 Formal Definition of PDA, Graphical Notation, Instantaneous Descriptions (IDs)",
                "5.2 Acceptance Criteria: Acceptance by Final State vs Acceptance by Empty Stack",
                "5.3 Equivalence of PDAs and CFGs (Grammar to PDA, PDA to Grammar)",
                "5.4 Deterministic Pushdown Automata (DPDA), Regular Languages and DPDAs"
            ]
        },
        {
            "unit_number": 6,
            "name": "Properties of Context-Free Languages",
            "teaching_hours": 5,
            "weightage_percent": 11.9,
            "estimated_ese_marks": 7,
            "topics": [
                "6.1 Grammar Simplification: Eliminating Useless Symbols, Null Productions, Unit Productions",
                "6.2 Normal Forms: Chomsky Normal Form (CNF) and Greibach Normal Form (GNF)",
                "6.3 Pumping Lemma for Context-Free Languages and Applications"
            ]
        },
        {
            "unit_number": 7,
            "name": "Introduction to Turing Machines",
            "teaching_hours": 6,
            "weightage_percent": 14.3,
            "estimated_ese_marks": 9,
            "topics": [
                "7.1 Formal Definition of Turing Machines and Examples",
                "7.2 Halting Problem and Post Correspondence Problem (PCP)",
                "7.3 Variants of Turing Machines (Multitape Turing Machines)",
                "7.4 Church-Turing Hypothesis"
            ]
        },
        {
            "unit_number": 8,
            "name": "Recursively Enumerable Languages & Chomsky Hierarchy",
            "teaching_hours": 4,
            "weightage_percent": 9.5,
            "estimated_ese_marks": 6,
            "topics": [
                "8.1 Recursive vs Recursively Enumerable Languages",
                "8.2 Enumerating a Language",
                "8.3 Context-Sensitive Languages and the Chomsky Hierarchy"
            ]
        },
        {
            "unit_number": 9,
            "name": "Self Study: Complexity Theory",
            "teaching_hours": 5,
            "weightage_percent": 0.0,
            "estimated_ese_marks": 0,
            "topics": [
                "Tractable and Intractable Problems (P and NP)",
                "Polynomial-Time Reductions and NP-Completeness",
                "Cook's Theorem"
            ]
        }
    ],
    "pyqs": [
        ("Unit 2: Finite Automata", "Construct a minimal DFA that accepts all binary strings containing the substring '101' over alphabet {0, 1}.", "Numerical", 7.0, "Medium"),
        ("Unit 3: Regular Languages & Properties", "Using the Pumping Lemma for Regular Languages, prove that L = {0^n 1^n | n >= 0} is not regular.", "Long", 8.0, "Hard"),
        ("Unit 5: Pushdown Automata (PDA)", "Design a Pushdown Automaton (PDA) for language L = {w c w^R | w in {0, 1}*} accepting by empty stack.", "Long", 10.0, "Hard")
    ]
},
        {
    "code": "CNS",
    "name": "Cryptography and Network Security",
    "course_code": "CE305",
    "credits": 4,
    "exam_scheme": {
        "theory_total": 75,
        "lab_total": 25,
        "grand_total": 100,
        "components": [
            {"name": "In-Semester Evaluation (ISE)", "marks": 15, "type": "Theory"},
            {"name": "Mid-Semester Examination (MSE)", "marks": 15, "type": "Theory"},
            {"name": "End-Semester Examination (ESE)", "marks": 45, "type": "Theory"},
            {"name": "Laboratory Evaluation", "marks": 25, "type": "Lab (15 Continuous + 10 ESE)"}
        ],
        "teaching_scheme_hours": "3L + 0T + 2P = 5 Hrs/Week (10 Workload/Total)",
        "passing_rule": "Minimum 40% aggregate in Theory & Lab components"
    },
    "chapters": [
        {
            "unit_number": 1,
            "name": "Fundamentals of Security and Cryptography",
            "teaching_hours": 9,
            "weightage_percent": 21.4,
            "estimated_ese_marks": 10,
            "topics": [
                "1.1 OSI Security Architecture, Attacks, Malware, Security Services, Mechanisms, Network Security Model",
                "1.2 Number Theory: Divisibility, Euclidean Algorithm, Fermat's & Euler's Theorems, Primality Testing, Chinese Remainder Theorem (CRT)",
                "1.3 Finite Fields: Groups, Rings, Fields, Finite Fields GF(p), Polynomial Arithmetic, GF(2^n)"
            ]
        },
        {
            "unit_number": 2,
            "name": "Symmetric and Asymmetric Ciphers",
            "teaching_hours": 9,
            "weightage_percent": 21.4,
            "estimated_ese_marks": 10,
            "topics": [
                "2.1 Classical Encryption: Substitution & Transposition Techniques, Rotor Machines, Steganography",
                "2.2 Block Ciphers: DES (Structure & Strength), AES (Structure, Transformations, Key Expansion), Block Modes: ECB, CBC, CFB, OFB, CTR, Triple DES",
                "2.3 Asymmetric Ciphers: RSA Algorithm, Diffie-Hellman Key Exchange, ElGamal Cryptosystem, Elliptic Curve Cryptography (ECC)"
            ]
        },
        {
            "unit_number": 3,
            "name": "Cryptographic Data Integrity & Signatures",
            "teaching_hours": 8,
            "weightage_percent": 19.0,
            "estimated_ese_marks": 9,
            "topics": [
                "3.1 Cryptographic Hash Functions: Requirements, Security, CBC Hash, Secure Hash Algorithm (SHA-512)",
                "3.2 Message Authentication Codes (MACs): HMAC, CMAC, DAA, Authenticated Encryption (CCM, GCM), PRNG using Hash & MAC",
                "3.3 Digital Signatures: ElGamal Signature Scheme, Schnorr Signature, NIST DSA, ECDSA, RSA-PSS"
            ]
        },
        {
            "unit_number": 4,
            "name": "Key Management and System Security",
            "teaching_hours": 8,
            "weightage_percent": 19.0,
            "estimated_ese_marks": 9,
            "topics": [
                "4.1 Key Distribution: Symmetric & Asymmetric Key Distribution, Public Key Distribution, X.509 Certificates, PKI",
                "4.2 User Authentication: Remote Authentication, Federated Identity Management, Kerberos Protocol",
                "4.3 IDS & Firewalls: Intrusion Detection Systems (Types & Working), Firewall Characteristics, Packet Filtering & Application Gateways"
            ]
        },
        {
            "unit_number": 5,
            "name": "Network and Internet Security Protocols",
            "teaching_hours": 8,
            "weightage_percent": 19.0,
            "estimated_ese_marks": 9,
            "topics": [
                "5.1 Application Layer Security: Email Architecture, PGP (Key Rings, Certificates, Revocation, Packets), S/MIME, Web Security",
                "5.2 Transport Layer Security: SSL Architecture, SSL Handshake & Record Protocols, TLS Cipher Suites",
                "5.3 Network Layer Security: IPSec Architecture, AH and ESP Protocols, Security Associations (SA), IKE, ISAKMP"
            ]
        },
        {
            "unit_number": 6,
            "name": "Self Study: Access Control Models",
            "teaching_hours": 5,
            "weightage_percent": 0.0,
            "estimated_ese_marks": 0,
            "topics": [
                "Access Control Mechanisms: MAC, DAC, RBAC",
                "Security Models: Take-Grant Protection Model (TGP), Harrison-Ruzzo-Ullman (HRU), Bell-LaPadula (BLP), Biba Integrity Model",
                "Constraint and State-based Models"
            ]
        }
    ],
    "pyqs": [
        ("Unit 2: Symmetric and Asymmetric Ciphers", "In an RSA cryptosystem, given primes p=7, q=11, and encryption key e=13: (a) Find private key d, (b) Encrypt message M=9, (c) Decrypt ciphertext.", "Numerical", 10.0, "Hard"),
        ("Unit 4: Key Management and System Security", "Explain the Diffie-Hellman Key Exchange protocol. How is the Man-in-the-Middle attack executed against it?", "Long", 8.0, "Medium"),
        ("Unit 2: Symmetric and Asymmetric Ciphers", "Explain AES round transformations: SubBytes, ShiftRows, MixColumns, AddRoundKey with block diagrams.", "Long", 10.0, "Hard")
    ]
},
        {
            "code": "MDM",
            "name": "Multidisciplinary Minor",
            "course_code": "MDM301",
            "credits": 3,
            "target_exam": "Semester 5 University Endsem (MDM301)",
            "total_marks": 100.0,
            "exam_scheme": {
                "theory_total": 75,
                "lab_total": 25,
                "grand_total": 100,
                "components": [
                    {"name": "Continuous Internal Assessment (CIA)", "marks": 25, "type": "Theory & Project Work"},
                    {"name": "Mid-Semester Examination (MSE)", "marks": 15, "type": "Theory"},
                    {"name": "End-Semester Examination (ESE)", "marks": 60, "type": "Theory (University Paper)"}
                ],
                "teaching_scheme_hours": "3L + 0T + 0P = 3 Hrs/Week",
                "passing_rule": "Minimum 40% aggregate in Theory Assessment"
            },
            "chapters": [
                {
                    "unit_number": 1,
                    "name": "Relational Data Modeling & Normalization",
                    "teaching_hours": 8,
                    "weightage_percent": 25.0,
                    "estimated_ese_marks": 15.0,
                    "comp": True,
                    "topics": [
                        "1.1 Entity-Relationship (ER) Modeling, Extended ER (EER) Concepts, Relational Algebra",
                        "1.2 Functional Dependencies, Closure of Attribute Sets, Canonical Cover",
                        "1.3 Schema Decomposition & Normal Forms: 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF)"
                    ]
                },
                {
                    "unit_number": 2,
                    "name": "Transactions & Concurrency Control Protocols",
                    "teaching_hours": 8,
                    "weightage_percent": 25.0,
                    "estimated_ese_marks": 15.0,
                    "comp": True,
                    "topics": [
                        "2.1 ACID Properties of Transactions, Serializability (Conflict & View Serializability)",
                        "2.2 Lock-Based Protocols: Two-Phase Locking (2PL), Strict 2PL, Rigorous 2PL, Deadlock Handling",
                        "2.3 Timestamp-Based Concurrency Control & Write-Ahead Logging (WAL / ARIES Recovery)"
                    ]
                },
                {
                    "unit_number": 3,
                    "name": "Modern NoSQL & Distributed Data Architectures",
                    "teaching_hours": 8,
                    "weightage_percent": 20.0,
                    "estimated_ese_marks": 12.0,
                    "comp": False,
                    "topics": [
                        "3.1 Limitations of RDBMS, NoSQL Categories: Key-Value (Redis), Document (MongoDB), Column-Family, Graph (Neo4j)",
                        "3.2 CAP Theorem (Consistency, Availability, Partition Tolerance) & BASE Properties",
                        "3.3 Sharding, Consistent Hashing & Horizontal Scaling Patterns"
                    ]
                },
                {
                    "unit_number": 4,
                    "name": "Distributed Databases & Consensus",
                    "teaching_hours": 6,
                    "weightage_percent": 15.0,
                    "estimated_ese_marks": 9.0,
                    "comp": False,
                    "topics": [
                        "4.1 Distributed Database Architectures, Homogeneous vs Heterogeneous Systems",
                        "4.2 Distributed Query Processing & Distributed Commit Protocols (Two-Phase Commit / 2PC, 3PC)",
                        "4.3 Paxos and Raft Consensus Protocols in Cloud Data Systems"
                    ]
                },
                {
                    "unit_number": 5,
                    "name": "Indexing, B+ Trees & Query Optimization",
                    "teaching_hours": 6,
                    "weightage_percent": 15.0,
                    "estimated_ese_marks": 9.0,
                    "comp": False,
                    "topics": [
                        "5.1 File Organization, Dense vs Sparse Indexing, Clustered vs Non-Clustered Indexes",
                        "5.2 B+ Tree Structure: Search, Insertion, Deletion & Node Splitting algorithms",
                        "5.3 Query Cost Estimation, Relational Algebra Equivalence Rules & Cost-Based Optimizer"
                    ]
                }
            ],
            "pyqs": [
                ("Unit 1: Relational Data Modeling & Normalization", "Given relation R(A, B, C, D, E) with Functional Dependencies F={A->BC, CD->E, B->D, E->A}. Find Candidate Keys and determine highest Normal Form.", "Numerical", 10.0, "Hard"),
                ("Unit 2: Transactions & Concurrency Control Protocols", "Explain Strict Two-Phase Locking (Strict 2PL) protocol. Prove how it prevents cascading rollbacks and guarantees serializability.", "Long", 10.0, "Hard")
            ]
        }
    ]

    for s_info in subjects_data:
        target_exam = s_info.get("target_exam") or "Semester 5 University Endsem"
        total_marks = float(s_info.get("total_marks") or s_info.get("exam_scheme", {}).get("grand_total", 100.0))

        sub = models.Subject(
            name=s_info["name"],
            code=s_info["code"],
            course_code=s_info.get("course_code"),
            credits=s_info.get("credits", 4),
            target_exam=target_exam,
            total_marks=total_marks,
            exam_scheme=json.dumps(s_info["exam_scheme"]) if "exam_scheme" in s_info else None,
            created_at=datetime.datetime.utcnow()
        )
        db.add(sub)
        db.flush()

        # Seed PYQDocument for this subject if sample exists
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        sample_src = os.path.join(BASE_DIR, "sample_docs", sub.code, f"{sub.code}_Endsem_2023.pdf")
        upload_dest_dir = os.path.join(BASE_DIR, "uploads", sub.code)
        os.makedirs(upload_dest_dir, exist_ok=True)
        doc_filename = f"{sub.code}_Semester_5_PYQ_2023.pdf"
        dest_path = os.path.join(upload_dest_dir, doc_filename)

        if os.path.exists(sample_src):
            shutil.copyfile(sample_src, dest_path)
        else:
            with open(dest_path, "wb") as f:
                f.write(b"%PDF-1.4\n%PYQ Document\n%%EOF")

        pyq_doc = models.PYQDocument(
            subject_id=sub.id,
            filename=doc_filename,
            file_path=dest_path,
            exam_year="2023",
            exam_session="End-Semester Examination",
            total_questions_extracted=len(s_info.get("pyqs", [])),
            uploaded_at=datetime.datetime.utcnow()
        )
        db.add(pyq_doc)
        db.flush()

        ch_map = {}
        created_chs = []
        for idx, c_info in enumerate(s_info["chapters"]):
            unit_num = c_info.get("unit_number")
            raw_name = c_info["name"]
            if unit_num is not None:
                ch_name = f"Unit {unit_num}: {raw_name}"
            else:
                ch_name = raw_name

            marks = float(c_info.get("estimated_ese_marks", c_info.get("marks", 15.0)))
            pct = float(c_info.get("weightage_percent", c_info.get("pct", 15.0)))
            is_comp = bool(c_info.get("comp", idx < 2))

            ch = models.Chapter(
                subject_id=sub.id,
                name=ch_name,
                unit_number=unit_num if unit_num is not None else idx + 1,
                order=unit_num if unit_num is not None else idx + 1,
                teaching_hours=int(c_info.get("teaching_hours", 8)),
                weightage_marks=marks,
                estimated_ese_marks=float(c_info.get("estimated_ese_marks", marks)),
                weightage_percent=pct,
                topics=json.dumps(c_info.get("topics", [])) if "topics" in c_info else json.dumps([c_info["name"]]),
                is_completed=is_comp,
                completed_at=datetime.datetime.utcnow() if is_comp else None
            )
            db.add(ch)
            db.flush()
            ch_map[ch_name] = ch.id
            ch_map[raw_name] = ch.id
            created_chs.append(ch)

        # Add PYQs
        for ch_name, q_text, q_type, marks, diff in s_info.get("pyqs", []):
            target_ch_id = ch_map.get(ch_name, created_chs[0].id)
            q = models.Question(
                subject_id=sub.id,
                chapter_id=target_ch_id,
                pyq_doc_id=pyq_doc.id,
                text=q_text,
                question_type=q_type,
                marks=marks,
                difficulty=diff,
                exam_year="2023",
                source_paper=f"{s_info['code']} End-Sem Exam",
                tags=json.dumps([s_info["code"].lower(), q_type.lower()])
            )
            db.add(q)

        # Pre-seed a completed quiz for Chapter 1
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

        # Compute metrics
        for c in created_chs:
            analytics_service.calculate_chapter_metrics(db, c.id)

    db.commit()
    print("Database seeded with DC, SE, AISC, TOC, CNS, MDM and full marking schemes + syllabus successfully!")

finally:
    db.close()
