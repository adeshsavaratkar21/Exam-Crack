"""
curriculum_knowledge.py
Provides in-depth, textbook-grade conceptual mastery theory, mathematical derivations,
worked examples, and syllabus-aligned exam quizzes for Mumbai University / SPIT engineering curricula.
Based on standard prescribed references:
- DC: George Coulouris et al.; Andrew S. Tanenbaum & Maarten van Steen (Distributed Systems)
- SE: Roger S. Pressman; Ian Sommerville (Software Engineering)
- AISC: S. N. Sivanandam & S. N. Deepa; Stuart Russell & Peter Norvig
- TOC: Hopcroft, Motwani & Ullman; Michael Sipser
- CNS: William Stallings; Behrouz A. Forouzan (Cryptography and Network Security)
- MDM: Abraham Silberschatz, Henry F. Korth; Raghu Ramakrishnan (Database System Concepts)
"""

from typing import Dict, Any, List

DC_RAW_MD = r"""# 📚 __CHAPTER_NAME__ — In-Depth Theoretical Mastery
*Reference Syllabus: Distributed Computing | Textbooks: Andrew S. Tanenbaum & Maarten van Steen • George Coulouris et al.*

---

### 1. 🎯 Concept Overview & Core Definitions

- **Formal Definition of a Distributed System**:
  According to Tanenbaum, a distributed system is *a collection of autonomous computing entities (nodes) that communicates over a network and appears to its users as a single coherent system*.
  Key architectural characteristics:
  1. **No Shared Physical Memory**: Every node possesses its own private address space and local clock.
  2. **Message Passing**: Nodes coordinate actions strictly via message exchanges over interconnected channels.
  3. **Concurrency of Components**: Multiple autonomous execution threads execute simultaneously.
  4. **Lack of a Global Clock**: Physical time cannot be known accurately across arbitrary geographical separations due to network jitter and clock drift.
  5. **Independent Failures**: Individual nodes or network partitions can fail while the remainder of the cluster continues operational execution.

- **Fundamental Architectural Models**:
  - **Client-Server Architecture**: Dedicated servers provide services (idempotent or stateful) to passive client requestors. Prone to bottlenecking at scale.
  - **Peer-to-Peer (P2P)**: Structured (e.g., Chord DHT using consistent hashing) and unstructured (e.g., Gnutella) where every node acts simultaneously as client and server (servent).
  - **Multi-tier Layering**: Division of concerns across Presentation Layer, Business Logic Middleware, and Persistent Data Store.

- **Forms of Transparency in Distributed Systems (ISO/OSI Reference)**:
  - **Access Transparency**: Hides differences in data representation and invocation mechanisms (e.g., Little-endian vs Big-endian byte orders via XDR).
  - **Location Transparency**: Users access resources without awareness of physical node placement (e.g., Uniform Resource Identifiers).
  - **Migration & Relocation Transparency**: Resources relocate dynamically without breaking existing open connections.
  - **Replication Transparency**: Hides that multiple identical copies of a resource exist across redundant server racks.
  - **Concurrency Transparency**: Hides that concurrent processes compete for shared distributed resources simultaneously without race conditions.
  - **Failure Transparency**: Masks node crashes or network partitions by falling back to replicated replicas or Paxos consensus.

- **The 8 Fallacies of Distributed Computing (Peter Deutsch / James Gosling)**:
  1. The network is reliable.
  2. Latency is zero.
  3. Bandwidth is infinite.
  4. The network is secure.
  5. Topology doesn't change.
  6. There is one administrator.
  7. Transport cost is zero.
  8. The network is homogeneous.

---

### 2. 📐 Derivations & Mathematical Foundations

1. **Amdahl's Law vs Gustafson's Law in Distributed Scaling**:
   - **Amdahl's Law** (Fixed Workload Speedup):
     If a fraction $P$ of an algorithm can be parallelized over $N$ distributed nodes, and $(1 - P)$ is inherently sequential:
     $$\text{Speedup}_{\text{Amdahl}} = \frac{1}{(1 - P) + \frac{P}{N}}$$
     As $N \to \infty$, the theoretical maximum speedup asymptotes strictly to $\frac{1}{1 - P}$.
   - **Gustafson-Barsis's Law** (Scaled Workload Speedup):
     When the problem size scales proportionally with cluster processing capacity:
     $$\text{Speedup}_{\text{Gustafson}} = N - (1 - P)(N - 1)$$

2. **Lamport's Logical Clocks & Happens-Before Relation ($\to$)**:
   Leslie Lamport defined the partial ordering of events in a distributed system:
   - If events $a$ and $b$ belong to the same local process and $a$ occurs before $b$, then $a \to b$.
   - If event $a$ is the sending of a message $m$ by process $P_i$, and $b$ is the receipt of $m$ by process $P_j$, then $a \to b$.
   - If $a \to b$ and $b \to c$, then $a \to c$ (Transitivity).
   - If neither $a \to b$ nor $b \to a$, then events $a$ and $b$ are concurrent ($a \parallel b$).

   **Lamport's Clock Tick Algorithm**:
   Each process $P_i$ maintains a monotonically increasing counter $L_i$:
   - Before executing an internal event:
     $$L_i = L_i + 1$$
   - When sending message $m$, attach timestamp $T_m = L_i$.
   - Upon receiving message $(m, T_m)$, process $P_j$ updates:
     $$L_j = \max(L_j, T_m) + 1$$

3. **Ricart-Agrawala Distributed Mutual Exclusion Algorithm**:
   An optimization over Lamport's algorithm using broadcast message timestamps:
   - To enter the Critical Section (CS), process $P_i$ multicasts a `REQUEST(T_i, i)` to all $N-1$ processes.
   - A receiver $P_j$ replies immediately with `OK` if:
     1. $P_j$ is not currently in the CS, AND
     2. $P_j$ has no desire to enter the CS, OR its own request has a timestamp $T_j > T_i$ (or $T_j = T_i$ with $j > i$).
   - Otherwise, $P_j$ defers its reply until it exits the CS.
   - **Message Overhead Derivation**:
     - Request broadcast: $N - 1$ messages.
     - Grant replies: $N - 1$ messages.
     - Total messages per Critical Section invocation:
       $$M = 2(N - 1) \text{ messages}$$

---

### 3. 💡 Worked Examples & Step-by-Step Solutions

#### Worked Problem 1: Lamport Logical Timestamp Trace
- **Scenario**:
  - Process $P_1$ begins with $L_1 = 0$, executes local event $e_{1,1}$, then sends message $m_1$ at event $e_{1,2}$.
  - Process $P_2$ begins with $L_2 = 0$, executes local event $e_{2,1}$, then receives message $m_1$ at event $e_{2,2}$.
  - Process $P_2$ then sends message $m_2$ to $P_1$ at event $e_{2,3}$.
  - Process $P_1$ executes local event $e_{1,3}$, then receives message $m_2$ at event $e_{1,4}$.

- **Step-by-Step Timestamp Computation**:
  1. $e_{1,1}$ (internal): $L_1 = 0 + 1 = 1$.
  2. $e_{1,2}$ (send $m_1$): $L_1 = 1 + 1 = 2$. Message $m_1$ carries $T_{m_1} = 2$.
  3. $e_{2,1}$ (internal): $L_2 = 0 + 1 = 1$.
  4. $e_{2,2}$ (receive $m_1$): $L_2 = \max(L_2, T_{m_1}) + 1 = \max(1, 2) + 1 = 3$.
  5. $e_{2,3}$ (send $m_2$): $L_2 = 3 + 1 = 4$. Message $m_2$ carries $T_{m_2} = 4$.
  6. $e_{1,3}$ (internal): $L_1 = 2 + 1 = 3$.
  7. $e_{1,4}$ (receive $m_2$): $L_1 = \max(L_1, T_{m_2}) + 1 = \max(3, 4) + 1 = 5$.

---

### 4. 🏆 Exam Q&As — High-Probability Questions

- **Q: Explain Two-Phase Commit (2PC) Protocol and analyze its coordinator failure vulnerability.**
  **Model Answer**:
  - **Phase 1 (Prepare / Voting Phase)**: The Coordinator sends `PREPARE` to all Cohorts. Each cohort logs state changes to write-ahead logs (WAL) and votes `VOTE_COMMIT` or `VOTE_ABORT`.
  - **Phase 2 (Commit / Execution Phase)**: If all cohorts vote `VOTE_COMMIT`, the coordinator writes `COMMIT` to log and broadcasts `GLOBAL_COMMIT`. If any cohort votes `VOTE_ABORT`, it broadcasts `GLOBAL_ABORT`.
  - **Coordinator Crash Vulnerability**: 2PC is a *blocking protocol*. If the coordinator crashes after cohorts have voted `VOTE_COMMIT` but before broadcasting the decision, cohorts must block indefinitely because they cannot determine whether other nodes committed or aborted.

- **Q: Differentiate between Cristian's Algorithm and the Berkeley Algorithm for physical clock synchronization.**
  **Model Answer**:
  - **Cristian's Algorithm**: Client-server (passive) approach. The client requests time from an authoritative time server $S$. The client sets its clock to $T_{\text{new}} = T_{\text{server}} + \frac{T_1 - T_0 - I}{2}$, where $T_1 - T_0$ is Round Trip Time (RTT) and $I$ is server interrupt handling time. Single point of failure.
  - **Berkeley Algorithm**: Active master approach. The master server actively polls all nodes for their clock times, estimates round-trip delays, computes a fault-tolerant average (discarding outliers), and sends individual offset deltas $\Delta t_i$ to each node so nodes slow down or speed up gradually without stepping backward.

---

### 5. 🔑 Key Takeaways & Memory Hooks

- 🧠 **CAP Theorem (Brewer's Theorem)**:
  Any distributed data store can simultaneously guarantee at most **two** out of three properties:
  - **Consistency (C)**: Every read receives the most recent write or an error.
  - **Availability (A)**: Every non-failing node returns a non-error response without guarantee of latest write.
  - **Partition Tolerance (P)**: System continues operating despite arbitrary packet loss or network splits.
  *(In real networks, network partitions are inevitable, forcing a choice between CP and AP!)*
- ⚠️ **Exam Trap**: Never say logical clocks synchronize physical wall-clock time! Lamport clocks establish a causal ordering ($a \to b$), but $L(a) < L(b)$ does **not** imply $a \to b$.
"""
SE_RAW_MD = r"""# 📚 __CHAPTER_NAME__ — In-Depth Theoretical Mastery
*Reference Syllabus: Software Engineering | Textbooks: Roger S. Pressman • Ian Sommerville*

---

### 1. 🎯 Concept Overview & Core Definitions

- **The Software Crisis & Engineering Discipline**:
  Software Engineering is *the systematic, disciplined, quantifiable approach to the development, operation, and maintenance of software* (IEEE 610.12).
  It emerged in response to the late 1960s "Software Crisis" characterized by projects exceeding budgets, missing deadlines, low quality, and high maintenance costs.

- **Classical Software Life Cycle Models**:
  1. **Classical Waterfall Model**:
     Linear-sequential phases: Requirements $\to$ Design $\to$ Coding $\to$ Testing $\to$ Deployment $\to$ Maintenance. High rigidity, assumes frozen requirements upfront, delays defect discovery to testing.
  2. **Prototyping Model**:
     Quick build of a working mock-up to elicit ambiguous user requirements early.
  3. **Boehm's Spiral Model (Risk-Driven)**:
     Iterative cycles traversing four quadrants:
     - Quadrant 1: Objective Determination & Constraints
     - Quadrant 2: Risk Analysis & Prototyping
     - Quadrant 3: Engineering, Coding & Verification
     - Quadrant 4: Customer Review & Next Phase Planning
  4. **Agile Methodology & Scrum Framework**:
     Values individuals & interactions over processes/tools, working software over comprehensive docs, customer collaboration over contract negotiation, and responding to change over following a plan.
     - **Roles**: Product Owner (manages Product Backlog), Scrum Master (facilitates & clears impediments), Development Team (cross-functional).
     - **Ceremonies**: Sprint Planning (defining Sprint Backlog), Daily Scrum (15-min standup), Sprint Review (demo), Sprint Retrospective (process improvement).
     - **Artifacts**: Product Backlog, Sprint Backlog, Increment, Burn-down Chart (effort remaining vs time).

- **Requirements Engineering & IEEE 830 SRS Standard**:
  - **Functional Requirements (FR)**: Statements of services the system must provide, reactions to inputs, and behavioral modes.
  - **Non-Functional Requirements (NFR)**: Constraints on system services (Performance, Reliability, Security, Scalability, Portability).
  - **IEEE 830 SRS Characteristics**: Correct, Unambiguous, Complete, Consistent, Ranked for importance/stability, Verifiable, Modifiable, Traceable.

---

### 2. 📐 Derivations & Mathematical Foundations

1. **McCabe's Cyclomatic Complexity Derivation ($V(G)$)**:
   Cyclomatic complexity measures the quantitative structural complexity of a program's Control Flow Graph (CFG) $G$:
   $$V(G) = E - N + 2P$$
   where:
   - $E$ is the number of edges in the CFG.
   - $N$ is the number of nodes (basic blocks).
   - $P$ is the number of connected components (typically $P = 1$ for a single program module).
   - Alternatively, for a planar graph with $P = 1$:
     $$V(G) = \text{Predicate Nodes (Decisions)} + 1 = \text{Number of Enclosed Regions}$$
   $V(G)$ defines the minimum number of independent execution paths required to achieve $100\%$ branch coverage during Basis Path Testing.

2. **Function Point Analysis (Albrecht's FPA Formulation)**:
   Measures software functional size independent of programming language:
   $$\text{Unadjusted Function Points (UFP)} = \sum_{i=1}^{5} \sum_{j=1}^{3} W_{ij} \times \text{Count}_{ij}$$
   Across five functional components: Internal Logical Files (ILF), External Interface Files (EIF), External Inputs (EI), External Outputs (EO), and External Inquiries (EQ).
   Adjusted Function Points (AFP):
   $$\text{FP} = \text{UFP} \times \left( 0.65 + 0.01 \times \sum_{k=1}^{14} c_k \right)$$
   where $c_k \in [0, 5]$ are the 14 Technical Complexity Factors.

3. **COCOMO-II Estimation Formula**:
   $$\text{Effort} = A \times (\text{KLOC})^E \times \prod_{i=1}^{17} \text{EM}_i \quad [\text{Person-Months}]$$

---

### 3. 💡 Worked Examples & Step-by-Step Solutions

#### Worked Problem 1: Compute Cyclomatic Complexity and Independent Basis Paths
- **Given Source Code Snippet**:
  ```python
  def process_grade(marks, attendance):
      if marks >= 40:                  # Decision 1
          if attendance >= 75:          # Decision 2
              result = "Pass"
          else:
              result = "Debarred"
      else:
          result = "Fail"
      return result
  ```
- **Step-by-step Calculation**:
  - Number of predicate nodes $D = 2$ (`marks >= 40`, `attendance >= 75`).
  - Using Predicate Formula:
    $$V(G) = D + 1 = 2 + 1 = 3$$
  - **Independent Test Cases to achieve 100% Branch Coverage**:
    - Path 1: `marks = 30` $\to$ Fail (False branch of Decision 1)
    - Path 2: `marks = 70, attendance = 60` $\to$ Debarred (True branch 1, False branch 2)
    - Path 3: `marks = 85, attendance = 90` $\to$ Pass (True branch 1, True branch 2)

---

### 4. 🏆 Exam Q&As — High-Probability Questions

- **Q: Explain Cohesion and Coupling with their types from highest to lowest desirability.**
  **Model Answer**:
  - **Cohesion** (Internal strength within a module): Aim for HIGH cohesion.
    - Types: *Functional (Best)* $\to$ Sequential $\to$ Communicational $\to$ Procedural $\to$ Temporal $\to$ Logical $\to$ *Coincidental (Worst)*.
  - **Coupling** (Interdependence between modules): Aim for LOW coupling.
    - Types: *Data Coupling (Best)* $\to$ Stamp Coupling $\to$ Control Coupling $\to$ External Coupling $\to$ Common Coupling $\to$ *Content Coupling (Worst)*.

---

### 5. 🔑 Key Takeaways & Memory Hooks

- 🧠 **SOLID Principles**:
  Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- ⚠️ **Exam Trap**: In Boundary Value Analysis, for interval $[a, b]$, test $a-1, a, a+1, b-1, b, b+1$!
"""
CNS_RAW_MD = r"""# 📚 __CHAPTER_NAME__ — In-Depth Theoretical Mastery
*Reference Syllabus: Cryptography & Network Security | Textbooks: William Stallings • Behrouz A. Forouzan*

---

### 1. 🎯 Concept Overview & Core Definitions

- **The CIA Triad & Security Architecture (OSI X.800)**:
  - **Confidentiality**: Preserves authorized restrictions on information access and disclosure. Enforced via encryption algorithms (AES, RSA).
  - **Integrity**: Guards against improper information modification or destruction. Enforced via cryptographic hash functions (SHA-256) and MACs.
  - **Availability**: Ensures timely and reliable access to information resources. Mitigates DoS and DDoS attacks.
  - **Authentication**: Confirms the identity of communicating entities.
  - **Non-Repudiation**: Prevents either sender or receiver from denying a transmitted message, achieved using Digital Signatures.

- **Symmetric vs Asymmetric Cryptosystems**:
  - **Symmetric (Private-Key)**: Same secret key shared between sender and receiver. High throughput, ideal for bulk data transfer. Examples: AES, DES. Requires $O(n^2)$ shared keys for $n$ participants.
  - **Asymmetric (Public-Key)**: Employs a mathematically linked key pair: Public Key (encryption/verification) and Private Key (decryption/signing). Solves key exchange; requires only $2n$ keys. Examples: RSA, ECC, Diffie-Hellman.

---

### 2. 📐 Derivations & Mathematical Foundations

1. **RSA Cryptosystem Derivation (Euler's Totient Theorem)**:
   - **Key Generation Steps**:
     1. Select two large distinct primes $p$ and $q$.
     2. Modulus: $n = p \times q$.
     3. Totient: $\phi(n) = (p - 1)(q - 1)$.
     4. Public exponent $e$ such that $\gcd(e, \phi(n)) = 1$ and $1 < e < \phi(n)$.
     5. Private exponent $d$: $e \cdot d \equiv 1 \pmod{\phi(n)} \implies d \equiv e^{-1} \pmod{\phi(n)}$.
   - **Encryption & Decryption**:
     $$\text{Ciphertext } C = M^e \pmod n$$
     $$\text{Decrypted Message } M = C^d \pmod n$$

2. **Diffie-Hellman Key Exchange Protocol**:
   - Public parameters: Prime $q$ and primitive root $\alpha \pmod q$.
   - **Alice**: Private key $X_A < q$, Public value $Y_A = \alpha^{X_A} \pmod q$.
   - **Bob**: Private key $X_B < q$, Public value $Y_B = \alpha^{X_B} \pmod q$.
   - **Shared Secret Key**:
     $$K = (Y_B)^{X_A} \pmod q = (Y_A)^{X_B} \pmod q = \alpha^{X_A X_B} \pmod q$$

---

### 3. 💡 Worked Examples & Step-by-Step Solutions

#### Worked Problem 1: RSA Key Generation & Encryption
- **Given Parameters**: Primes $p = 7, q = 11$, message $M = 9$, and public exponent $e = 13$.
- **Step-by-Step Execution**:
  1. $n = p \times q = 7 \times 11 = 77$.
  2. $\phi(n) = (7 - 1)(11 - 1) = 6 \times 10 = 60$.
  3. $\gcd(13, 60) = 1$.
  4. Find $d$: $13d \equiv 1 \pmod{60} \implies 13d = 481 \implies d = 37$.
  5. Encrypt $M = 9$: $C = 9^{13} \pmod{77} = 58$.
  **Ciphertext Result**: $\mathbf{C = 58}$.

---

### 4. 🏆 Exam Q&As — High-Probability Questions

- **Q: Explain the internal round transformations of AES.**
  **Model Answer**: SubBytes (non-linear S-box substitution for confusion), ShiftRows (cyclic byte transposition for diffusion), MixColumns (matrix multiplication in $GF(2^8)$ for diffusion), AddRoundKey (XOR with round subkey).

---

### 5. 🔑 Key Takeaways & Memory Hooks

- 🧠 **Confusion vs Diffusion**: Confusion obscures relationship between key and ciphertext (S-boxes); Diffusion spreads plaintext statistics across ciphertext (ShiftRows/MixColumns).
"""
MDM_RAW_MD = r"""# 📚 __CHAPTER_NAME__ — In-Depth Theoretical Mastery
*Reference Syllabus: Database Management Systems & Relational Modeling | Textbooks: Silberschatz, Korth & Sudarshan • Raghu Ramakrishnan*

---

### 1. 🎯 Concept Overview & Core Definitions

- **Relational Data Model & Integrity Constraints**:
  - **Relation**: A mathematical table with named columns (attributes) and unordered rows (tuples). $R \subseteq D_1 \times D_2 \times \dots \times D_n$.
  - **Key Constraints**:
    - **Super Key**: An attribute set that uniquely identifies a tuple.
    - **Candidate Key**: A minimal super key.
    - **Primary Key**: The designated candidate key.
    - **Foreign Key**: References primary key of another relation, enforcing Referential Integrity.

- **Functional Dependencies & Normal Forms**:
  - **1NF**: Atomic values only; no composite or multi-valued attributes.
  - **2NF**: In 1NF and no partial dependencies (every non-prime attribute fully functionally dependent on candidate key).
  - **3NF**: In 2NF and no transitive dependencies. For every $X \to Y$, either $X$ is a super key or $Y$ is prime.
  - **BCNF**: For every non-trivial $X \to Y$, $X$ MUST strictly be a Super Key.

---

### 2. 📐 Derivations & Mathematical Foundations

1. **Armstrong's Axioms**:
   - Reflexivity: If $Y \subseteq X$, then $X \to Y$.
   - Augmentation: If $X \to Y$, then $XZ \to YZ$.
   - Transitivity: If $X \to Y$ and $Y \to Z$, then $X \to Z$.

2. **Lossless-Join Decomposition Condition**:
   Decomposition of $R$ into $R_1, R_2$ is lossless if:
   $$(R_1 \cap R_2) \to (R_1 - R_2) \in F^+ \quad \text{OR} \quad (R_1 \cap R_2) \to (R_2 - R_1) \in F^+$$

---

### 3. 💡 Worked Examples & Step-by-Step Solutions

#### Worked Problem: Candidate Keys & Normal Form Verification
Given $R(A, B, C, D, E)$ with $F = \{ A \to B, BC \to D, E \to C, D \to A \}$:
- Candidate Keys: $AE, DE, BCE$.
- All attributes $\{A, B, C, D, E\}$ are prime.
- Since all right-hand sides are prime, $R$ is in **3NF**.
- But because $A$ in $A \to B$ is not a super key, $R$ is **NOT in BCNF**.

---

### 4. 🏆 Exam Q&As — High-Probability Questions

- **Q: Explain Two-Phase Locking (2PL) and Strict 2PL.**
  **Model Answer**: Growing phase acquires locks without releasing; Shrinking phase releases locks without acquiring. Strict 2PL holds exclusive locks until commit/abort to eliminate cascading rollbacks.
"""
TOC_RAW_MD = r"""# 📚 __CHAPTER_NAME__ — In-Depth Theoretical Mastery
*Reference Syllabus: Theory of Computation | Textbooks: Hopcroft, Motwani & Ullman • Michael Sipser*

---

### 1. 🎯 Concept Overview & Core Definitions

- **Finite Automata Foundations (DFA vs NFA)**:
  - **Deterministic Finite Automaton (DFA)**: Formally defined as a 5-tuple:
    $$M = (Q, \Sigma, \delta, q_0, F)$$
    where transition function $\delta: Q \times \Sigma \to Q$ produces exactly one unique next state for each state and input symbol.
  - **Nondeterministic Finite Automaton (NFA)**: Transition function maps to the power set: $\delta: Q \times \Sigma \to 2^Q$. Recognized by Subset Construction.
  - **Pumping Lemma for Regular Languages**: For any regular $L$, there exists $p \ge 1$ such that any $s \in L$ with $|s| \ge p$ can be written $s = xyz$ where $|xy| \le p$, $|y| > 0$, and $\forall i \ge 0, xy^iz \in L$.

- **Turing Machines & Computability**:
  - DTM 7-tuple: $M = (Q, \Sigma, \Gamma, \delta, q_0, B, F)$.
  - The Halting Problem $H_{TM}$ is undecidable via Cantor's Diagonalization.

---

### 2. 📐 Derivations & Mathematical Foundations

1. **Pumping Lemma Contradiction for $L = \{ 0^n 1^n \mid n \ge 0 \}$**:
   - Choose $s = 0^p 1^p$. By condition $|xy| \le p$, $y$ consists solely of zeros: $y = 0^b$ with $b \ge 1$.
   - Pumping $i = 2$: $x y^2 z = 0^{p+b} 1^p \notin L$, proving $L$ is non-regular.

2. **Chomsky Hierarchy**:
   Type 0 (Unrestricted / Turing Machine) $\supset$ Type 1 (Context-Sensitive / LBA) $\supset$ Type 2 (Context-Free / PDA) $\supset$ Type 3 (Regular / DFA).

---

### 3. 🏆 Exam Q&As — High-Probability Questions

- **Q: State and prove Arden's Theorem.**
  **Model Answer**: If $P$ and $Q$ are regular expressions with $\epsilon \notin P$, the equation $R = Q + RP$ has the unique solution $R = QP^*$.
"""
AISC_RAW_MD = r"""# 📚 __CHAPTER_NAME__ — In-Depth Theoretical Mastery
*Reference Syllabus: AI & Soft Computing | Textbooks: S. N. Sivanandam & S. N. Deepa • S. Rajasekaran & G. A. Pai*

---

### 1. 🎯 Concept Overview & Core Definitions

- **Hard Computing vs Soft Computing**:
  - **Hard Computing**: Relies on exact mathematical models, binary logic $\{0, 1\}$, and deterministic algorithms.
  - **Soft Computing**: Exploits tolerance for imprecision, uncertainty, and partial truth: ANN (learning), Fuzzy Logic (approximate reasoning), Genetic Algorithms (global search).

- **Perceptron & Activation Functions**:
  $$y = f\left( \sum_{i=1}^n w_i x_i + b \right) = f(\mathbf{w}^T \mathbf{x} + b)$$
  - Sigmoid: $\sigma(z) = \frac{1}{1 + e^{-z}}$, derivative $\sigma'(z) = \sigma(z)(1 - \sigma(z))$.
  - ReLU: $f(z) = \max(0, z)$.
  - Tanh: $\tanh(z) = \frac{e^z - e^{-z}}{e^z + e^{-z}}$.

---

### 2. 📐 Derivations & Mathematical Foundations

1. **Backpropagation Delta Rule Derivation**:
   For squared error $E = \frac{1}{2}\sum_k (t_k - y_k)^2$:
   $$\delta_k = (t_k - y_k)f'(\text{net}_k) \implies \Delta w_{jk} = \eta \delta_k h_j$$

2. **Centroid (Center of Gravity / COG) Defuzzification**:
   $$\bar{x} = \frac{\sum_{i=1}^n x_i \cdot \mu_C(x_i)}{\sum_{i=1}^n \mu_C(x_i)}$$

---

### 3. 🏆 Exam Q&As — High-Probability Questions

- **Q: Why does a single-layer perceptron fail to solve XOR?**
  **Model Answer**: XOR points $(0,1)$ and $(1,0)$ vs $(0,0)$ and $(1,1)$ are not linearly separable by any single hyper-plane $w_1 x_1 + w_2 x_2 + b = 0$. A Multilayer Perceptron (MLP) with non-linear hidden units is required.
"""

def get_detailed_mastery_content(subject_name: str, chapter_name: str, book_excerpts: str = "") -> Dict[str, Any]:
    sub_lower = (subject_name or "").lower()
    ch_lower = (chapter_name or "").lower()

    if "distributed" in sub_lower or "dc" in sub_lower:
        return {
            "summary_md": DC_RAW_MD.replace("__CHAPTER_NAME__", chapter_name),
            "pitfalls": [
                "Assuming Lamport clocks establish physical wall-clock synchronization rather than causal ordering",
                "Forgetting that Two-Phase Commit (2PC) is a blocking protocol vulnerable to coordinator crash during commit phase",
                "Confusing Access Transparency (data format/endianness) with Location Transparency (physical server placement)"
            ],
            "formulas": [
                "Speedup_Amdahl = 1 / ((1 - P) + P/N)",
                "L_j = max(L_j, T_m) + 1",
                "Messages = 2(N - 1) (Ricart-Agrawala Mutual Exclusion)"
            ]
        }

    if "cryptography" in sub_lower or "security" in sub_lower or "cns" in sub_lower:
        return {
            "summary_md": CNS_RAW_MD.replace("__CHAPTER_NAME__", chapter_name),
            "pitfalls": [
                "Assuming Diffie-Hellman performs direct message encryption rather than secret key agreement",
                "Omitting the requirement that gcd(e, phi(n)) must equal 1 when selecting the RSA public exponent",
                "Confusing HMAC (integrity and authentication) with encryption (confidentiality)"
            ],
            "formulas": [
                "n = p * q, phi(n) = (p-1)(q-1)",
                "C = M^e mod n, M = C^d mod n",
                "K = (Y_B)^X_A mod q = (Y_A)^X_B mod q"
            ]
        }

    if "software" in sub_lower or sub_lower.strip() == "se":
        return {
            "summary_md": SE_RAW_MD.replace("__CHAPTER_NAME__", chapter_name),
            "pitfalls": [
                "Testing only inside valid partitions during Boundary Value Analysis instead of checking boundary limits (min-1, min, max, max+1)",
                "Confusing High Coupling with High Cohesion (aim for high cohesion and low coupling)",
                "Assuming Cyclomatic Complexity V(G) equals the total number of test cases rather than the minimum basis paths"
            ],
            "formulas": [
                "V(G) = E - N + 2P = Predicate_Nodes + 1",
                "FP = UFP * (0.65 + 0.01 * sum(TDI))",
                "Effort = A * (KLOC)^E * prod(EM_i)"
            ]
        }

    if "minor" in sub_lower or "mdm" in sub_lower or "data" in sub_lower or "database" in sub_lower:
        return {
            "summary_md": MDM_RAW_MD.replace("__CHAPTER_NAME__", chapter_name),
            "pitfalls": [
                "Failing to verify lossless join condition when decomposing relations",
                "Assuming a relation with only prime attributes is in BCNF (it is guaranteed to be in 3NF, but not necessarily BCNF)",
                "Releasing a lock and then requesting another lock later in the same transaction (violates 2PL)"
            ],
            "formulas": [
                "X^+: compute closure using Armstrong Axioms",
                "Lossless Join: (R1 ∩ R2) -> (R1 - R2) or (R1 ∩ R2) -> (R2 - R1)",
                "BCNF: for all non-trivial X -> Y, X must be a Super Key"
            ]
        }

    if "automata" in sub_lower or "computation" in sub_lower or "toc" in sub_lower:
        return {
            "summary_md": TOC_RAW_MD.replace("__CHAPTER_NAME__", chapter_name),
            "pitfalls": [
                "Attempting to choose x, y, and z yourself in Pumping Lemma proofs instead of considering all partitions",
                "Forgetting that dead/trap states in a DFA must have self-loops for all symbols in the alphabet",
                "Confusing epsilon-NFA closures with regular NFA transitions without taking transitive epsilon hops"
            ],
            "formulas": [
                "M = (Q, Sigma, delta, q_0, F)",
                "s = xyz, |y| > 0, |xy| <= p, x(y^i)z in L",
                "R = Q + RP ==> R = Q(P*)"
            ]
        }

    if "soft computing" in sub_lower or "aisc" in sub_lower or "neural" in sub_lower or "fuzzy" in sub_lower:
        return {
            "summary_md": AISC_RAW_MD.replace("__CHAPTER_NAME__", chapter_name),
            "pitfalls": [
                "Applying single-layer perceptron to non-linearly separable problems like XOR",
                "Confusing crisp set operations with fuzzy operations (using binary true/false instead of min/max norms)",
                "Using net input z instead of output y in the sigmoid derivative y*(1 - y)"
            ],
            "formulas": [
                "y = f(w^T * x + b)",
                "Delta w_jk = eta * delta_k * h_j",
                "x_bar = sum(x_i * mu(x_i)) / sum(mu(x_i))"
            ]
        }

    # Dynamic fallback for any other subject
    return {
        "summary_md": f"# 📚 {chapter_name} — High-Yield Conceptual Mastery\n*Curriculum: {subject_name}*\n\n### 1. 🎯 Concept Overview\nComprehensive conceptual analysis of {chapter_name} according to university examination guidelines.\n\n### 2. 📐 Mathematical Foundations & Models\nFormal state representations, operational bounds, and analysis of algorithmic efficiency.\n\n### 3. 🏆 Exam Questions & Model Solutions\nFocus on architectural diagrams, definition questions (5 marks), and step-by-step analytical derivations (10 marks).",
        "pitfalls": [f"Overlooking boundary constraints in {chapter_name}"],
        "formulas": ["Standard engineering formulations apply"]
    }

def get_subject_quiz_bank(subject_name: str, chapter_name: str, count: int = 10) -> List[Dict[str, Any]]:
    sub_lower = (subject_name or "").lower()

    if "distributed" in sub_lower or "dc" in sub_lower:
        return [
            {
                "question_text": "In Lamport's Logical Clocks, if process P receives a message with timestamp T_m when its local clock is L, how does P update its clock?",
                "options": [
                    "A) L = L + 1",
                    "B) L = max(L, T_m) + 1",
                    "C) L = min(L, T_m) + 1",
                    "D) L = (L + T_m) / 2"
                ],
                "correct_answer": "B",
                "explanation": "Lamport's clock tick rule upon message reception ensures causality by updating L = max(L, T_m) + 1.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "How many total messages are required per critical section invocation in the Ricart-Agrawala distributed mutual exclusion algorithm?",
                "options": [
                    "A) N - 1",
                    "B) 2(N - 1)",
                    "C) 3(N - 1)",
                    "D) N^2"
                ],
                "correct_answer": "B",
                "explanation": "Ricart-Agrawala requires N-1 request messages and N-1 reply messages, yielding exactly 2(N-1) messages per CS entry.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "Why is the classic Two-Phase Commit (2PC) protocol classified as a blocking protocol?",
                "options": [
                    "A) Network bandwidth is blocked during phase 1",
                    "B) Cohorts block indefinitely if the coordinator crashes during the commit phase after cohorts voted yes",
                    "C) Locks are held for an infinite duration by design",
                    "D) Transactions cannot abort once initiated"
                ],
                "correct_answer": "B",
                "explanation": "If the coordinator crashes after cohorts vote VOTE_COMMIT, cohorts cannot unilaterally decide whether to commit or abort, remaining blocked.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "According to the CAP Theorem, which two properties can be simultaneously guaranteed in the presence of inevitable network partitions?",
                "options": [
                    "A) Consistency and Availability only (CP or AP)",
                    "B) All three (Consistency, Availability, and Partition Tolerance)",
                    "C) Partition Tolerance cannot be preserved in distributed systems",
                    "D) Only Availability can be preserved"
                ],
                "correct_answer": "A",
                "explanation": "Since physical network partitions are unavoidable in distributed systems, architects must choose between Consistency (CP) or Availability (AP).",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "Which form of transparency hides the differences in data representations (such as endianness) between heterogeneous computers?",
                "options": [
                    "A) Location Transparency",
                    "B) Replication Transparency",
                    "C) Access Transparency",
                    "D) Migration Transparency"
                ],
                "correct_answer": "C",
                "explanation": "Access transparency hides differences in data representation and invocation mechanisms (e.g., using XDR/CORBA marshalling).",
                "question_type": "MCQ",
                "marks": 1.0
            }
        ][:count]

    if "software" in sub_lower or sub_lower.strip() == "se":
        return [
            {
                "question_text": "What is McCabe's Cyclomatic Complexity V(G) for a program Control Flow Graph with 14 edges and 10 nodes?",
                "options": [
                    "A) 4",
                    "B) 6",
                    "C) 2",
                    "D) 8"
                ],
                "correct_answer": "B",
                "explanation": "Using McCabe's formula V(G) = E - N + 2P for a single module (P=1): V(G) = 14 - 10 + 2 = 6.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "Which software design principle states that software entities should be open for extension but closed for modification?",
                "options": [
                    "A) Single Responsibility Principle",
                    "B) Open/Closed Principle (OCP)",
                    "C) Liskov Substitution Principle",
                    "D) Dependency Inversion Principle"
                ],
                "correct_answer": "B",
                "explanation": "The Open/Closed Principle (the 'O' in SOLID) dictates that a module should be extendable without modifying its existing source code.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "Which type of coupling is the most desirable (loose coupling) between two software modules?",
                "options": [
                    "A) Content Coupling",
                    "B) Common Coupling",
                    "C) Control Coupling",
                    "D) Data Coupling"
                ],
                "correct_answer": "D",
                "explanation": "Data coupling is the loosest and most desirable form of coupling, occurring when modules communicate solely by passing simple data parameters.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "In Agile Scrum, what is the primary purpose of the Sprint Retrospective meeting?",
                "options": [
                    "A) Demonstrate working software increments to stakeholders",
                    "B) Estimate user story story points for the future backlog",
                    "C) Reflect on team processes, collaboration, and implement continuous improvements",
                    "D) Assign daily tasks to developers"
                ],
                "correct_answer": "C",
                "explanation": "The Sprint Retrospective occurs at the end of each sprint for the Scrum team to inspect itself and plan improvements for the next sprint.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "Which software development life cycle model is fundamentally structured around formal risk assessment and reduction at each cycle?",
                "options": [
                    "A) Classical Waterfall Model",
                    "B) Prototyping Model",
                    "C) Boehm's Spiral Model",
                    "D) RAD Model"
                ],
                "correct_answer": "C",
                "explanation": "Boehm's Spiral Model is a risk-driven process model where risk analysis and mitigation occur in quadrant 2 of every spiral loop.",
                "question_type": "MCQ",
                "marks": 1.0
            }
        ][:count]

    if "cryptography" in sub_lower or "security" in sub_lower or "cns" in sub_lower:
        return [
            {
                "question_text": "In the RSA algorithm with primes p = 3 and q = 11, what is the value of Euler's totient function φ(n)?",
                "options": [
                    "A) 33",
                    "B) 20",
                    "C) 30",
                    "D) 22"
                ],
                "correct_answer": "B",
                "explanation": "φ(n) = (p - 1)(q - 1) = (3 - 1)(11 - 1) = 2 × 10 = 20.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "Which standard symmetric block cipher transformation in AES provides diffusion across bytes of the state matrix?",
                "options": [
                    "A) SubBytes",
                    "B) ShiftRows and MixColumns",
                    "C) AddRoundKey",
                    "D) Key Expansion"
                ],
                "correct_answer": "B",
                "explanation": "ShiftRows and MixColumns provide diffusion by dispersing individual byte patterns across rows and columns of the state matrix.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "What type of attack is the unauthenticated Diffie-Hellman Key Exchange protocol inherently vulnerable to?",
                "options": [
                    "A) Brute-Force Password Attack",
                    "B) Man-in-the-Middle (MitM) Attack",
                    "C) Differential Cryptanalysis",
                    "D) Buffer Overflow Attack"
                ],
                "correct_answer": "B",
                "explanation": "Without digital certificates or digital signatures to authenticate participants, an active adversary can intercept and forge Diffie-Hellman keys.",
                "question_type": "MCQ",
                "marks": 1.0
            }
        ][:count]

    if "minor" in sub_lower or "mdm" in sub_lower or "data" in sub_lower or "database" in sub_lower:
        return [
            {
                "question_text": "For a relation to be in Boyce-Codd Normal Form (BCNF), what condition must hold for every non-trivial functional dependency X -> Y?",
                "options": [
                    "A) Y must be a prime attribute",
                    "B) X must be a Super Key",
                    "C) X and Y must both be single attributes",
                    "D) Relation must only be in 2NF"
                ],
                "correct_answer": "B",
                "explanation": "BCNF strictly requires that for every non-trivial functional dependency X -> Y, X must be a super key of the relation schema.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "In transaction processing, what does the 'I' in the ACID properties guarantee?",
                "options": [
                    "A) Information is encrypted at rest",
                    "B) Concurrent transactions execute without interference as if executed serially",
                    "C) Indexes are automatically recalculated",
                    "D) Immediate write to non-volatile disk"
                ],
                "correct_answer": "B",
                "explanation": "Isolation guarantees that concurrently executing transactions are isolated from each other's intermediate uncommitted states.",
                "question_type": "MCQ",
                "marks": 1.0
            }
        ][:count]

    if "automata" in sub_lower or "computation" in sub_lower or "toc" in sub_lower:
        return [
            {
                "question_text": "In a Deterministic Finite Automaton (DFA), what is the transition function mapping?",
                "options": [
                    "A) Q × Σ → 2^Q",
                    "B) Q × Σ → Q",
                    "C) Q × (Σ ∪ {ε}) → 2^Q",
                    "D) Q × Γ → Q × Γ × {L, R}"
                ],
                "correct_answer": "B",
                "explanation": "In a DFA, the transition function delta is deterministic and total, mapping each (state, symbol) pair to exactly one state: Q × Σ → Q.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "According to the Pumping Lemma for regular languages, if string s = xyz with |s| ≥ p, which condition MUST hold?",
                "options": [
                    "A) |y| = 0",
                    "B) |xy| > p",
                    "C) |xy| ≤ p and |y| > 0",
                    "D) x = z for all iterations"
                ],
                "correct_answer": "C",
                "explanation": "The Pumping Lemma requires that |xy| ≤ p (the cycle occurs within the first p characters) and |y| > 0 (the pumped substring is non-empty).",
                "question_type": "MCQ",
                "marks": 1.0
            }
        ][:count]

    if "soft computing" in sub_lower or "aisc" in sub_lower or "neural" in sub_lower or "fuzzy" in sub_lower:
        return [
            {
                "question_text": "Why does a single-layer perceptron fail to solve the XOR logic problem?",
                "options": [
                    "A) The inputs cannot be normalized",
                    "B) XOR is not linearly separable by a single hyper-plane",
                    "C) Backpropagation cannot calculate gradients for XOR",
                    "D) Learning rate becomes zero"
                ],
                "correct_answer": "B",
                "explanation": "A single-layer perceptron can only form linear decision boundaries. XOR outputs cannot be separated by any single line.",
                "question_type": "MCQ",
                "marks": 1.0
            },
            {
                "question_text": "What is the derivative of the standard logistic sigmoid activation function σ(z) with respect to z?",
                "options": [
                    "A) 1 - σ(z)",
                    "B) σ(z) * (1 - σ(z))",
                    "C) σ(z)^2",
                    "D) 1 / (1 + e^-z)"
                ],
                "correct_answer": "B",
                "explanation": "The derivative of σ(z) = 1/(1+e^-z) is σ'(z) = σ(z)(1 - σ(z)), which makes gradient computation computationally efficient.",
                "question_type": "MCQ",
                "marks": 1.0
            }
        ][:count]

    return []
