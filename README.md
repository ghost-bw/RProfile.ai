# ResumePro - AI-Powered Resume & Interview Preparation Platform

<div align="center">

![ResumePro Logo](\frontend\src\assets\Gemini_Generated_Image_ga5zozga5zozga5z.png)

**An intelligent platform combining AI-powered resume analysis, ATS optimization, mock interviews, and coding challenges to help professionals land their dream jobs.**

[![GitHub](https://img.shields.io/badge/GitHub-ResumePro-blue?style=flat-square&logo=github)](https://github.com/ghost-bw/RProfile.ai)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19+-blue?style=flat-square&logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-green?style=flat-square&logo=mongodb)](https://mongodb.com)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Core Modules](#core-modules)
- [Usage Guide](#usage-guide)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**ResumePro** is a comprehensive career preparation platform that leverages artificial intelligence and machine learning to help professionals optimize their resumes, prepare for interviews, and master coding challenges. The platform combines modern web technologies with advanced AI models to provide personalized career guidance.

### Mission
To democratize access to interview preparation and resume optimization through intelligent AI-powered tools.

---

## ✨ Key Features

### 📄 Resume Optimization
- **ATS Score Analysis**: Evaluate resume compatibility with Applicant Tracking Systems
- **Smart Resume Enhancement**: AI-powered suggestions for improving resume content
- **PDF Upload & Parsing**: Extract and analyze resume data from PDF files
- **Semantic Similarity**: Find matching skills and experiences using embeddings
- **Performance Metrics**: Track resume improvements over time

### 🎤 Mock Interview Preparation
- **AI-Powered Interview Sessions**: Conduct realistic mock interviews with AI interviewer
- **Real-time Transcription**: Speech-to-text conversion for interview responses
- **Interview Analytics**: Track performance metrics and improvement areas
- **Question Generation**: Dynamic question sets based on job role and experience
- **Session History**: Review past interviews and track progress

### 💻 Coding Challenges
- **Monaco Editor Integration**: Professional code editor with syntax highlighting
- **Multiple Language Support**: Write solutions in various programming languages
- **Real-time Execution**: Test code with immediate feedback
- **Challenge Repository**: Access curated coding problems by difficulty level

### ⭐ Aptitude & Assessment
- **Aptitude Round**: Practice quantitative reasoning, logical reasoning, and verbal ability
- **Performance Tracking**: Monitor scores and identify weak areas
- **Timed Tests**: Experience exam-like conditions

### 📊 Analytics Dashboard
- **Performance Insights**: Visual representation of progress across all modules
- **Skill Assessment**: Identify strengths and areas for improvement
- **Goal Tracking**: Monitor progress toward career objectives
- **Comparative Analytics**: Benchmark performance against standard metrics

### 🔐 Authentication & Security
- **Multi-method Authentication**: Email/password, Google OAuth integration
- **Email Verification**: OTP-based account verification
- **JWT Token Security**: Secure API endpoints with token-based authentication
- **Password Encryption**: Industry-standard bcrypt hashing

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.19.2 | Web framework & REST API |
| **MongoDB** | 7.2.0 | NoSQL database |
| **Mongoose** | 8.4.1 | MongoDB object modeling |
| **LangChain** | 1.3.5 | AI/LLM framework |
| **OpenAI** | 1.4.5 | GPT integration |
| **Transformers.js** | 2.17.2 | ML model execution |
| **PDF-Parse** | 2.4.5 | PDF document parsing |
| **JWT** | 9.0.2 | Token authentication |
| **Bcryptjs** | 2.4.3 | Password hashing |
| **Multer** | 2.1.1 | File upload handling |
| **Nodemailer** | 8.0.7 | Email sending |
| **CORS** | 2.8.6 | Cross-origin resource sharing |
| **Axios** | 1.15.2 | HTTP client |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.5 | UI framework |
| **Vite** | 8.0.10 | Build tool & dev server |
| **React Router** | 7.14.2 | Client-side routing |
| **Tailwind CSS** | 4.2.4 | Utility-first CSS framework |
| **Framer Motion** | 12.38.0 | Animation library |
| **Monaco Editor** | 4.7.0 | Code editor component |
| **Firebase** | 12.12.1 | Backend-as-a-Service |
| **Recharts** | 3.8.1 | Data visualization |
| **React Markdown** | 10.1.0 | Markdown rendering |
| **EmailJS** | 4.4.1 | Client-side email sending |
| **Lucide React** | 1.14.0 | Icon library |
| **jsPDF & html2canvas** | Latest | PDF generation |

### Infrastructure & DevOps
- **MongoDB Atlas**: Cloud database hosting
- **Google Auth**: OAuth authentication
- **Environment Variables**: Dotenv configuration management

---

## 🏗 Architecture

ResumePro follows a **Client-Server Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ UI Components │ Pages │ Context API │ State Mgmt    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕                                   │
│                    Axios HTTP Client                          │
└─────────────────────────────────────────────────────────────┘
                           ↕
                    REST API Endpoints
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express.js)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Auth Middleware │ Route Handlers │ Business Logic   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AI Integration (LangChain, Transformers, OpenAI)    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Database Models & Data Layer                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│              MongoDB Atlas (Cloud Database)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Users │ Resumes │ Sessions │ Progress │ Analytics   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
Resume Upload
    ↓
PDF Parse & Text Extraction
    ↓
Embedding Generation (Transformers.js)
    ↓
MongoDB Storage with Embeddings
    ↓
ATS Analysis & Scoring (OpenAI/LangChain)
    ↓
Improvement Recommendations
    ↓
Frontend Display & Analytics
```

---

## 📁 Project Structure

### Root Directory
```
ResumePro/
├── backend/                          # Express.js server
│   ├── middleware/
│   │   └── auth.js                   # JWT authentication middleware
│   ├── models/
│   │   ├── User.js                   # User schema with OTP support
│   │   ├── Resume.js                 # Resume with embeddings
│   │   ├── Session.js                # Interview session records
│   │   └── UserProgress.js           # User progress tracking
│   ├── routes/
│   │   ├── auth.js                   # Authentication endpoints
│   │   ├── resume.js                 # Resume analysis endpoints
│   │   ├── interview.js              # Mock interview endpoints
│   │   ├── code.js                   # Coding challenge endpoints
│   │   └── analytics.js              # Analytics endpoints
│   ├── utils/
│   │   ├── embeddings.js             # Embedding generation logic
│   │   ├── mailer.js                 # Email & OTP sending
│   │   └── similarity.js             # Semantic similarity calculations
│   ├── uploads/                      # User-uploaded files storage
│   ├── server.js                     # Express app initialization
│   ├── package.json                  # Backend dependencies
│   └── .env                          # Environment variables
│
├── frontend/                         # React + Vite application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx              # Landing page
│   │   │   ├── Login.jsx             # Authentication
│   │   │   ├── Dashboard.jsx         # Main dashboard
│   │   │   ├── ATSCheck.jsx          # Resume ATS analysis
│   │   │   ├── Interview.jsx         # Mock interview interface
│   │   │   ├── CodingRound.jsx       # Coding challenges
│   │   │   ├── AptitudeRound.jsx     # Aptitude tests
│   │   │   └── AnalyticsDashboard.jsx# Performance analytics
│   │   ├── context/
│   │   │   └── FileContext.jsx       # Global state management
│   │   ├── assets/                   # Images and media
│   │   ├── App.jsx                   # Main app component
│   │   ├── App.css                   # App styling
│   │   ├── index.css                 # Global styles
│   │   └── main.jsx                  # React entry point
│   ├── public/
│   │   ├── icons.svg                 # Icon assets
│   │   └── favicon.svg               # Favicon
│   ├── vite.config.js                # Vite configuration
│   ├── postcss.config.js             # PostCSS setup
│   ├── eslint.config.js              # ESLint rules
│   ├── package.json                  # Frontend dependencies
│   └── index.html                    # HTML entry point
│
├── uploads/                          # Shared uploads directory
├── .gitignore                        # Git ignore rules
└── README.md                         # This file
```

### Key Directory Descriptions

| Directory | Purpose |
|-----------|---------|
| `backend/middleware/` | Authentication & authorization logic |
| `backend/models/` | MongoDB schemas & data models |
| `backend/routes/` | API endpoint handlers |
| `backend/utils/` | Utility functions (embeddings, mail, similarity) |
| `backend/uploads/` | Stored user-uploaded files |
| `frontend/pages/` | Main page components |
| `frontend/context/` | React Context for global state |
| `frontend/assets/` | Static images and media |

---

## 🚀 Installation

### Prerequisites
- **Node.js** v18 or higher
- **npm** or **yarn** package manager
- **MongoDB** Atlas account or local MongoDB instance
- **OpenAI API Key** (for AI features)
- **Google OAuth Credentials** (for social login)

### Step 1: Clone Repository
```bash
git clone https://github.com/ghost-bw/RProfile.ai.git
cd ResumePro
```

### Step 2: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env  # If example exists, or create manually

# Start backend server
npm start
# Server will run on http://localhost:5000
```

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Application will run on http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/resumepro?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI API
OPENAI_API_KEY=sk-your_openai_api_key

# Email Configuration (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@resumepro.com

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_FIREBASE_CONFIG={"apiKey":"...","projectId":"..."}
```

---

## 📖 Getting Started

### 1. Start Backend Server
```bash
cd backend
npm start
# Output: Server running on http://localhost:5000
#         MongoDB connected successfully
```

### 2. Start Frontend Development Server
```bash
cd frontend
npm run dev
# Output: Local:   http://localhost:5173/
#         Press q to quit
```

### 3. Access Application
- **Frontend**: http://localhost:5173
- **Backend Health Check**: http://localhost:5000/health
- **API Documentation**: See API Documentation section below

### 4. Test Login Flow
1. Navigate to http://localhost:5173
2. Click "Login" or "Sign Up"
3. Use email/password or Google OAuth
4. Complete email verification
5. Access dashboard

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: { id, token, user }
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: { token, user }
```

#### Get Current User
```
GET /auth/user
Authorization: Bearer <token>

Response: { id, name, email, isVerified, date }
```

#### Google OAuth Login
```
POST /auth/google
Content-Type: application/json

{
  "token": "google_id_token"
}

Response: { token, user }
```

### Resume Endpoints

#### Upload & Analyze Resume
```
POST /resume/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

File: resume.pdf

Response: { resumeId, atsScore, improvementTips, analysis }
```

#### Get Resume Analysis
```
GET /resume/:resumeId
Authorization: Bearer <token>

Response: { originalText, atsScore, improvementTips, chunks }
```

#### Get User's Resumes
```
GET /resume/user/all
Authorization: Bearer <token>

Response: [{ id, atsScore, createdAt }, ...]
```

### Interview Endpoints

#### Start Interview Session
```
POST /interview/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobRole": "Software Engineer",
  "experience": "3 years"
}

Response: { sessionId, firstQuestion, sessionData }
```

#### Submit Interview Response
```
POST /interview/:sessionId/response
Authorization: Bearer <token>
Content-Type: application/json

{
  "response": "User's answer to the question",
  "questionId": "question_1"
}

Response: { feedback, nextQuestion, score }
```

#### End Interview Session
```
POST /interview/:sessionId/end
Authorization: Bearer <token>

Response: { finalScore, analysis, recommendations }
```

### Code Challenge Endpoints

#### Get Coding Challenges
```
GET /code/challenges?difficulty=medium
Authorization: Bearer <token>

Response: [{ id, title, description, difficulty, examples }, ...]
```

#### Submit Code Solution
```
POST /code/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "challengeId": "challenge_id",
  "code": "solution code",
  "language": "javascript"
}

Response: { passed, testsPassed, testsFailed, executionTime }
```

### Analytics Endpoints

#### Get User Analytics
```
GET /analytics/summary
Authorization: Bearer <token>

Response: {
  totalResumesAnalyzed,
  averageAtsScore,
  interviewAttempts,
  codingScore,
  aptitudeScore
}
```

#### Get Progress Data
```
GET /analytics/progress?period=month
Authorization: Bearer <token>

Response: [{ date, resumeScore, interviewScore, codingScore }, ...]
```

---

## 🧠 Core Modules

### 1. **Authentication Module** (`routes/auth.js`)
- Email/password registration and login
- Google OAuth 2.0 integration
- OTP email verification
- JWT token generation and validation
- Password encryption with bcrypt

**Key Functions:**
- User registration with email verification
- Secure login with token generation
- OAuth integration for seamless signup
- Token refresh mechanism

### 2. **Resume Analysis Module** (`routes/resume.js`)
- PDF file upload and parsing with `pdf-parse`
- Text extraction and chunking
- Embedding generation using `@xenova/transformers`
- ATS score calculation using OpenAI
- Semantic similarity matching

**Workflow:**
```
PDF Upload → Parse → Chunk Text → Generate Embeddings → 
Store in MongoDB → Calculate ATS Score → Return Analysis
```

### 3. **Interview Module** (`routes/interview.js`)
- AI-powered question generation using LangChain
- Session management and history tracking
- Real-time feedback using OpenAI GPT
- Performance scoring and analysis
- Interview analytics

**Features:**
- Dynamic questions based on job role
- Real-time response evaluation
- Session persistence
- Interview playback capability

### 4. **Coding Challenge Module** (`routes/code.js`)
- Monaco Editor integration for code writing
- Multi-language support
- Test case execution
- Performance metrics tracking
- Difficulty-based challenge sorting

**Supported Languages:**
- JavaScript
- Python
- Java
- C++
- TypeScript

### 5. **Analytics Module** (`routes/analytics.js`)
- User performance tracking
- Resume improvement trends
- Interview performance metrics
- Skill assessment analytics
- Progress visualization

**Metrics Tracked:**
- ATS score progression
- Interview success rate
- Coding problem resolution rate
- Overall skill improvement

### 6. **Email & OTP Module** (`utils/mailer.js`)
- Nodemailer SMTP integration
- OTP generation and verification
- Email templates
- Retry logic for failed deliveries

### 7. **Embeddings Module** (`utils/embeddings.js`)
- Transformer-based text embeddings
- Semantic similarity calculations
- Vector storage in MongoDB
- Efficient search across stored embeddings

### 8. **Similarity Module** (`utils/similarity.js`)
- Cosine similarity calculations
- Job description matching
- Skill relevance scoring
- Resume-to-JD alignment analysis

---

## 💡 Usage Guide

### For Job Seekers

#### 1. Profile Setup
- Sign up via email or Google
- Complete email verification
- Update profile information

#### 2. Resume Optimization
- Upload your resume (PDF format)
- Get ATS score and improvement tips
- Apply suggestions to improve score
- Re-upload improved resume
- Track score improvements

#### 3. Interview Preparation
- Select your target job role
- Start mock interview session
- Answer AI-generated questions
- Receive real-time feedback
- Review past interviews in analytics

#### 4. Coding Practice
- Browse coding challenges by difficulty
- Use Monaco Editor to write solutions
- Submit and get instant feedback
- Track your problem-solving progress

#### 5. Aptitude Practice
- Complete timed aptitude tests
- Practice quantitative & logical reasoning
- Improve verbal ability
- Review detailed performance metrics

#### 6. Monitor Progress
- View analytics dashboard
- Track improvement trends
- Identify weak areas
- Set improvement goals

---

## 🔧 Development

### Code Style & Conventions

#### Backend
```javascript
// Use ES5 syntax (CommonJS)
const express = require('express');

// Error handling
router.post('/endpoint', async (req, res) => {
  try {
    // Business logic
    res.json({ success: true, data });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error message' });
  }
});
```

#### Frontend
```jsx
// Use functional components and hooks
import React, { useState, useEffect } from 'react';

export default function Component() {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Side effects
  }, []);
  
  return <div>{/* JSX */}</div>;
}
```

### Building for Production

#### Backend
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

#### Frontend
```bash
cd frontend
npm run build
# Output: dist/ folder with optimized build
npm run preview  # Preview production build locally
```

### Running Tests
```bash
# Frontend linting
cd frontend
npm run lint

# Backend (if tests exist)
cd backend
npm test
```

---

## 📊 Database Schema Overview

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  otp: String,
  otpExpires: Date,
  isVerified: Boolean,
  googleId: String,
  date: Date,
  subscription: { tier, expiryDate }
}
```

### Resumes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  originalText: String,
  chunks: [{
    text: String,
    embedding: [Number]
  }],
  atsScore: Number,
  improvementTips: [String],
  createdAt: Date,
  analyzedAt: Date
}
```

### Sessions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  jobRole: String,
  experience: String,
  questions: [ObjectId],
  responses: [String],
  score: Number,
  startedAt: Date,
  endedAt: Date,
  feedback: String
}
```

### UserProgress Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  resumeAnalyses: Number,
  averageAtsScore: Number,
  interviewAttempts: Number,
  codingSolved: Number,
  aptitudeScore: Number,
  lastUpdated: Date,
  milestones: [String]
}
```

---

## 🚨 Troubleshooting

### Backend Issues

**MongoDB Connection Error**
```
Error: MongoDB connection error
Solution: 
1. Check MONGO_URI in .env
2. Verify MongoDB Atlas IP whitelist
3. Ensure network connectivity
```

**OpenAI API Error**
```
Error: Invalid API key
Solution:
1. Verify OPENAI_API_KEY in .env
2. Check API key is active in OpenAI dashboard
3. Ensure sufficient credits
```

**Port Already in Use**
```
Error: listen EADDRINUSE :::5000
Solution: 
1. Change PORT in .env
2. Kill process: lsof -ti:5000 | xargs kill -9
```

### Frontend Issues

**Module Not Found**
```
Solution:
1. Clear node_modules: rm -rf node_modules
2. Clear cache: npm cache clean --force
3. Reinstall: npm install
```

**API Connection Error**
```
Solution:
1. Verify backend is running
2. Check VITE_API_URL in .env
3. Check CORS configuration
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
```bash
git clone https://github.com/YOUR_USERNAME/RProfile.ai.git
```

2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes**
```bash
git add .
git commit -m "Add amazing feature"
```

4. **Push to branch**
```bash
git push origin feature/amazing-feature
```

5. **Open a Pull Request**

### Contribution Guidelines
- Follow existing code style
- Add comments for complex logic
- Update README if needed
- Test thoroughly before submitting
- Keep commits atomic and well-messages

---

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 📞 Support

For support, email support@resumepro.com or open an issue on GitHub.

---

## 🔗 Links

- **GitHub Repository**: [ghost-bw/RProfile.ai](https://github.com/ghost-bw/RProfile.ai)
- **Documentation**: [Full Documentation](./DOCUMENTATION.md)
- **Bug Reports**: [GitHub Issues](https://github.com/ghost-bw/RProfile.ai/issues)

---

<div align="center">

**Made with ❤️ by the ResumePro Team**

*Empowering professionals to achieve their career goals through AI-driven preparation*

</div>
