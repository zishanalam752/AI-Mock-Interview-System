import React, { useState, useEffect, useRef } from "react";
import "./index.css";
import { Mic, MicOff, Send, PlayCircle, BookOpen, Award, RefreshCw, ChevronRight } from "lucide-react";

const API_URL = "http://localhost:3000/api"; // Check your backend port (3000 or 5000)

// --- TOPIC DATA ---
const TOPICS = {
  "Software Engineering": ["System Design", "Design Patterns", "OOP", "SOLID Principles", "Microservices", "Testing", "Agile/Scrum"],
  "Data Structures & Algo": ["Arrays & Strings", "Linked Lists", "Trees & Graphs", "Dynamic Programming", "Recursion", "Sorting & Searching", "Hash Maps"],
  "Frontend Engineering": ["React.js", "Vue.js", "Angular", "HTML/CSS", "JavaScript (ES6+)", "TypeScript", "Redux/State Management", "Next.js"],
  "Backend Engineering": ["Node.js", "Express.js", "Django", "Spring Boot", "REST APIs", "GraphQL", "Database Design (SQL/NoSQL)", "Authentication"],
  "Full Stack (MERN)": ["MongoDB", "Express.js", "React.js", "Node.js", "Mongoose", "JWT Auth", "Deployment"],
  "Data Science": ["Python", "Statistics", "Data Visualization", "Pandas/NumPy", "SQL for Data Science", "Exploratory Data Analysis"],
  "Machine Learning": ["Supervised Learning", "Unsupervised Learning", "Neural Networks", "Scikit-Learn", "Model Evaluation", "NLP", "Computer Vision"],
  "Deep Learning": ["TensorFlow", "PyTorch", "CNNs", "RNNs/LSTMs", "Transformers", "GANs"],
  "Data Engineering": ["ETL Pipelines", "Big Data (Spark/Hadoop)", "Data Warehousing", "SQL Optimization", "Apache Airflow", "Cloud Data Services"],
  "DevOps": ["Docker", "Kubernetes", "CI/CD", "AWS/Azure", "Linux", "Terraform"]
};

function App() {
  // --- STATE ---
  const [view, setView] = useState("setup"); // setup | interview | report
  const [config, setConfig] = useState({ topic: "Software Engineering", subTopic: "", difficulty: "Medium" });
  
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);

  // Voice & Text
  const [finalAnswer, setFinalAnswer] = useState("");
  const [interimAnswer, setInterimAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Set default subtopic when topic changes
    setConfig(prev => ({ ...prev, subTopic: TOPICS[prev.topic][0] }));
  }, [config.topic]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let liveInterim = "";
      let newFinal = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) newFinal += event.results[i][0].transcript;
        else liveInterim += event.results[i][0].transcript;
      }
      if (newFinal) setFinalAnswer(prev => prev + " " + newFinal);
      setInterimAnswer(liveInterim);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  // --- HANDLERS ---
  const toggleListening = () => {
    if (!recognitionRef.current) return alert("Browser not supported");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const generateQuestion = async () => {
    setLoading(true);
    setFeedback(null);
    setFinalAnswer("");
    setInterimAnswer("");
    setQuestionData(null);

    try {
      const res = await fetch(`${API_URL}/interview/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setQuestionData(data);
      
      // Auto-speak
      const utterance = new SpeechSynthesisUtterance(data.question);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      alert("Server Error. Is Backend Running?");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    const fullAnswer = (finalAnswer + " " + interimAnswer).trim();
    if (!fullAnswer) return;
    
    setLoading(true);
    if (isListening) recognitionRef.current.stop();

    try {
      const res = await fetch(`${API_URL}/interview/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswer: fullAnswer, idealAnswer: questionData.ideal_answer }),
      });
      const data = await res.json();
      setFeedback(data);
      setFinalAnswer(fullAnswer);
      setInterimAnswer("");

      setHistory(prev => [...prev, {
        question: questionData.question,
        userAnswer: fullAnswer,
        idealAnswer: questionData.ideal_answer,
        score: data.score,
        feedback: data.feedback
      }]);
    } catch (err) {
      alert("Evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  // --- VIEWS ---

  // 1. SETUP VIEW
  if (view === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <BookOpen size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Interview Coach</h1>
            <p className="text-slate-400">Master your technical interview skills</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Domain</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={config.topic}
                onChange={e => setConfig({ ...config, topic: e.target.value })}
              >
                {Object.keys(TOPICS).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Topic</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={config.subTopic}
                onChange={e => setConfig({ ...config, subTopic: e.target.value })}
              >
                {TOPICS[config.topic].map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-3">
                {["Easy", "Medium", "Hard"].map(level => (
                  <button
                    key={level}
                    onClick={() => setConfig({ ...config, difficulty: level })}
                    className={`py-2 rounded-lg text-sm font-medium transition ${
                      config.difficulty === level 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => { setView("interview"); setHistory([]); generateQuestion(); }} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/30 transition transform hover:-translate-y-0.5 mt-4 flex items-center justify-center gap-2"
            >
              Start Interview <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. REPORT VIEW
  if (view === "report") {
    const avgScore = history.length > 0 
      ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / history.length) 
      : 0;

    return (
      <div className="min-h-screen bg-slate-50 p-8 font-sans">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Session Report</h1>
              <p className="text-slate-500">{config.topic} • {config.subTopic}</p>
            </div>
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 text-center">
              <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">Average Score</span>
              <span className={`text-4xl font-bold ${avgScore >= 70 ? "text-emerald-500" : "text-amber-500"}`}>
                {avgScore}%
              </span>
            </div>
          </div>

          {history.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-800 w-3/4">Q{idx+1}: {item.question}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  item.score >= 70 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  Score: {item.score}%
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Your Answer</span>
                  <p className="text-slate-700 text-sm leading-relaxed">{item.userAnswer}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <span className="text-xs font-bold text-blue-400 uppercase block mb-2">Ideal Answer</span>
                  <p className="text-slate-700 text-sm leading-relaxed">{item.idealAnswer}</p>
                </div>
              </div>
            </div>
          ))}

          <button onClick={() => setView("setup")} 
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2">
            <RefreshCw size={20} /> Start New Session
          </button>
        </div>
      </div>
    );
  }

  // 3. INTERVIEW VIEW
  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{config.subTopic}</h2>
            <span className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">{config.difficulty}</span>
          </div>
          <button onClick={() => setView("report")} className="text-red-500 font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition">
            End Session
          </button>
        </div>

        <div className="p-8">
          {/* Question Card */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Award size={16} /> Question
            </h3>
            {loading && !questionData ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ) : (
              <p className="text-2xl font-medium text-slate-800 leading-relaxed">{questionData?.question}</p>
            )}
          </div>

          {/* Answer Input */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Answer</h3>
            <div className="relative group">
              <div className="w-full border-2 border-slate-200 rounded-xl h-48 overflow-y-auto bg-slate-50 p-5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                <span className="text-lg text-slate-800 leading-relaxed">{finalAnswer}</span>
                <span className="text-lg text-slate-400 italic ml-1">{interimAnswer}</span>
                {(!finalAnswer && !interimAnswer) && <span className="text-slate-400">Type or speak your answer...</span>}
              </div>
              
              <textarea 
                className="absolute inset-0 opacity-0 cursor-text w-full h-full"
                value={finalAnswer}
                onChange={(e) => setFinalAnswer(e.target.value)}
              />

              {isListening && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div> Recording
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button 
                onClick={toggleListening}
                className={`flex-1 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                  isListening 
                    ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isListening ? <><MicOff size={20} /> Stop Recording</> : <><Mic size={20} /> Start Speaking</>}
              </button>
              
              <button 
                onClick={submitAnswer}
                disabled={(!finalAnswer && !interimAnswer) || loading}
                className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <><Send size={20} /> Submit Answer</>}
              </button>
            </div>
          </div>

          {/* Feedback Card */}
          {feedback && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white animate-fade-in shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <Award className="text-yellow-400" /> AI Feedback
                </h3>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                  feedback.score > 70 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  Score: {feedback.score}%
                </div>
              </div>
              
              <p className="text-slate-300 mb-6 leading-relaxed text-lg">{feedback.feedback}</p>
              
              <div className="bg-white/5 p-5 rounded-xl border border-white/10 mb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Ideal Answer</span>
                <p className="text-slate-300 text-sm italic">{feedback.idealAnswer}</p>
              </div>

              <button 
                onClick={generateQuestion}
                className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-100 transition flex items-center justify-center gap-2"
              >
                Next Question <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
