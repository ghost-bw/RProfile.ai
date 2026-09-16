# ResumePro.ai - Technical Interview Preparation Guide

This document provides a comprehensive overview of **ResumePro.ai**, designed to help you explain the project architecture, features, and technology stack during technical interviews.

---

## 1. Project Vision
**ResumePro.ai** is an end-to-end, AI-powered career readiness platform. Unlike static preparation tools, it uses a **Multi-Agent AI System** to provide a personalized, adaptive, and "brutally honest" feedback loop for candidates aiming for Tier-1 tech companies.

---

## 2. Technical Architecture

### Frontend (The Interactive Layer)
*   **Framework:** React.js (Vite) with Tailwind CSS for high-performance, responsive UI.
*   **State Management:** React Context API (e.g., `FileContext`) for managing global states like uploaded resumes.
*   **Visualizations:** **Recharts** for mastery radar charts and performance trends.
*   **Editor:** **Monaco Editor** (the engine behind VS Code) for a professional coding environment.
*   **Animations:** **Framer Motion** for a premium, "Elite" user experience.
*   **Communication:** Centralized **Axios** instance with interceptors for automatic JWT/Token management.

### Backend (The Intelligence Hub)
*   **Environment:** Node.js with Express.
*   **Database:** MongoDB with Mongoose for flexible, document-based storage of user progress, resumes, and interview sessions.
*   **Authentication:** JWT (JSON Web Tokens) with a custom middleware layer for secure route protection.
*   **File Handling:** **Multer** for secure resume uploads and processing.

---

## 3. Core Components & Working Logic

### A. AI Interview (The Flagship Feature)
*   **Customizable Focus:** Users can provide a prompt (e.g., "Focus on System Design") which is injected into the AI's system instructions.
*   **Multi-Agent Coordination:**
    1.  **Interviewer Agent:** Generates concise, relevant technical questions based on the user's resume and custom focus.
    2.  **Evaluator Agent:** Analyzes answers for logic, technical depth, and accuracy (scoring 1-10).
    3.  **Coach Agent:** Provides constructive feedback and actionable suggestions for improvement.
*   **Adaptive Learning:** The AI tracks "Strong" and "Weak" areas in the database. If a user struggles with "Recursion," the system prioritizes more Recursion questions until mastery is shown.

### B. Coding Round (DSA Simulation)
*   **Variety Engine:** A backend logic that blacklists solved problems to ensure the AI always generates a unique challenge.
*   **Real-time Execution:** Integration with **Judge0** (or an AI simulation fallback) to run code in 4+ languages (JS, Python, C++, Java).
*   **Strict Evaluation:** An AI "Judge" evaluates code not just for correctness, but for **Time/Space Complexity** and optimal approach.

### C. ATS IQ Check
*   **Resume Parsing:** Extracts text from PDFs and compares it against specific Job Descriptions using Semantic Similarity.
*   **Gap Analysis:** Identifies missing keywords and skill sets required for a specific role.

### D. Performance Analytics & Roadmap
*   **Data Aggregation:** Aggregates scores from interviews and coding rounds into a "Topic Mastery" radar chart.
*   **AI Roadmap:** Generates a personalized 7-day study plan in Markdown format, which can be exported as a professional PDF using `html2canvas` and `jsPDF`.

---

## 4. AI Technologies & Models

### LLM Engine: Groq + Llama 3.3 (70B)
We utilize **Groq's LPU (Language Processing Unit)** to power **Llama 3.3 70B**. 
*   **Features:**
    *   **Ultra-Low Latency:** Sub-second response times for a "natural" interview feel.
    *   **JSON Mode:** Ensures all AI outputs are structured data, allowing the frontend to render complex UI components (like MCQs or charts) directly from AI responses.
    *   **Context Window:** Efficiently handles large resumes and long interview histories.

### Key AI Concepts Implemented:
1.  **System Prompt Engineering:** Using strict "Role-Play" prompts to keep the AI focused on being an "Elite Technical Interviewer."
2.  **Deterministic Control:** Using low "temperature" settings (0.2) for Aptitude/Coding evaluation to ensure accuracy, and higher temperature (0.9) for Problem Generation to ensure variety.
3.  **Semantic Memory:** Storing user performance in MongoDB to create a "Persistent AI Memory" that knows your weaknesses across sessions.

---

## 5. Interviewer "Pro-Tips" (What to emphasize)
*   **Scalability:** "The project is designed to handle multiple AI agents simultaneously, mimicking a real panel interview."
*   **Security:** "I implemented secure JWT authentication and protected environment variables for API keys and database URIs."
*   **Problem Solving:** "I solved the 'Repetitive Question' problem by implementing a history-aware prompt injection system that blacklists solved titles."
*   **User Experience:** "The entire platform is mobile-responsive and uses modern design patterns to ensure a high-conversion, professional feel."
