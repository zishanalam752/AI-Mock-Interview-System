# 🤖 AI Mock Interviewer

A full-stack **AI-powered Interview Coaching System** designed to help developers, data scientists, and engineers practice technical interviews in a realistic, voice-interactive environment.

---

## 🚀 Motivation: Why build this?

Technical interviews are stressful. Many candidates fail not because of a lack of knowledge, but due to **anxiety, poor articulation, or lack of practice**.

Traditional mock interviews are:
1.  **Expensive** (costing $100+ per session).
2.  **Hard to schedule** (relying on another person).
3.  **Subjective** (feedback varies by interviewer).

**The AI Mock Interviewer solves this by providing:**
*   **24/7 Availability:** Practice whenever you want.
*   **Zero Judgment:** A safe space to stutter, pause, and improve.
*   **Instant Feedback:** AI analyzes your answer against ideal responses using vector embeddings.
*   **Real-time Voice Interaction:** Simulates a real Zoom/Google Meet interview experience.

---

## ✨ Key Features

*   **🎙️ Voice-First Interface:** Uses the Web Speech API for real-time Speech-to-Text (STT) and Text-to-Speech (TTS).
*   **🧠 Smart Question Generation:** Generates unique, context-aware questions using **Hugging Face AI models** (Gemma, Qwen, etc.).
*   **🎯 Multi-Domain Support:** Covers Software Engineering, Data Science, MERN Stack, DevOps, DSA, and more.
*   **📊 Intelligent Scoring:** Uses **Cosine Similarity** and Vector Embeddings to mathematically score your answer against the ideal answer.
*   **📝 Session Reports:** Generates a detailed performance report with scores and feedback at the end of every session.
*   **🎨 Modern UI:** A beautiful, glassmorphism-inspired interface built with React and Tailwind CSS.

---

## 🛠️ Tech Stack

### Frontend
*   **React.js (Vite):** Fast, modern UI library.
*   **Tailwind CSS:** For aesthetic, responsive styling.
*   **Web Speech API:** Native browser API for voice recognition.
*   **Lucide React:** Beautiful icons.

### Backend
*   **Node.js & Express:** RESTful API server.
*   **MongoDB:** Database to store questions and session history.
*   **Hugging Face Inference API:** For generating AI questions.
*   **Xenova Transformers:** For running local embeddings and similarity checks.

---

## ⚙️ Prerequisites

Before running the project, ensure you have the following installed:
1.  **Node.js** (v16 or higher)
2.  **Git**
3.  **MongoDB Account** (or a local MongoDB instance)
4.  **Hugging Face API Key** (Free) - [Get it here](https://huggingface.co/settings/tokens)

---

## 🚀 Installation & Setup Guide

Follow these steps to get the project running locally.

### 1. Clone the Repository
```bash
git clone https://github.com/zishanalam752/AI-Mock-Interview-System.git
cd AI-Mock-Interview-System