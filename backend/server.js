import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import axios from "axios";
import { pipeline, cos_sim } from "@xenova/transformers";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// --- SCHEMAS ---
const QuestionSchema = new mongoose.Schema({
  topic: String,
  subTopic: String,
  difficulty: String,
  question: String,
  idealAnswer: String,
  embedding: [Number],
  createdAt: { type: Date, default: Date.now },
});
const Question = mongoose.models.Question || mongoose.model("Question", QuestionSchema);

// --- CONFIG ---
const HF_API_KEY = process.env.HF_API_KEY;

// ⚡️ AI MODELS (Try these first)
const AI_MODELS = [
  "google/gemma-2b-it",
  "Qwen/Qwen2.5-0.5B-Instruct"
];

// --- VECTOR ENGINE ---
class VectorEngine {
  static instance = null;
  static async getInstance() {
    if (!this.instance) {
      console.log("⏳ Loading Vector Engine...");
      this.instance = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
      console.log("✅ Vector Engine Ready");
    }
    return this.instance;
  }
}

// --- HELPERS ---
async function getEmbedding(text) {
  const extractor = await VectorEngine.getInstance();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

// --- 🧠 SMART LOCAL GENERATOR (The Fix for Blank Screens) ---
// This runs if the AI API is down. It constructs a unique question dynamically.
function generateSmartFallback(topic, subTopic, difficulty) {
  const aspects = [
    "memory management", "performance optimization", "security implications", 
    "error handling", "scalability", "best practices", "internal architecture"
  ];
  const randomAspect = aspects[Math.floor(Math.random() * aspects.length)];

  const templates = [
    { q: `How does ${subTopic} handle ${randomAspect} in ${topic}?`, a: `Discuss how ${subTopic} manages ${randomAspect}.` },
    { q: `Can you explain the lifecycle of ${subTopic} in ${topic} specifically regarding ${randomAspect}?`, a: `Focus on the execution flow.` },
    { q: `What are the common pitfalls when using ${subTopic} in ${topic}?`, a: `Mention anti-patterns and debugging.` },
    { q: `Compare ${subTopic} with its alternatives in ${topic}. When would you use it?`, a: `Discuss trade-offs and use cases.` },
    { q: `How would you debug a critical issue involving ${subTopic} in a production ${topic} app?`, a: `Explain your troubleshooting steps.` }
  ];

  const random = templates[Math.floor(Math.random() * templates.length)];
  
  console.log("⚡️ Generated Smart Fallback Question");
  return {
    question: random.q,
    ideal_answer: random.a
  };
}

// --- GENERATION LOGIC ---
async function generateQuestion(topic, subTopic, difficulty) {
  const prompt = `<start_of_turn>user
Generate a unique ${difficulty} interview question about ${subTopic} in ${topic}.
Return ONLY valid JSON: { "question": "...", "ideal_answer": "..." }<end_of_turn>
<start_of_turn>model`;

  // 1. Try AI Models
  for (const model of AI_MODELS) {
    try {
      console.log(`🤖 AI Request (${model})...`);
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { 
          inputs: prompt, 
          parameters: { max_new_tokens: 250, return_full_text: false, temperature: 0.8 } 
        },
        { headers: { Authorization: `Bearer ${HF_API_KEY}` }, timeout: 5000 }
      );

      let text = response.data[0]?.generated_text || "";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const match = text.match(/\{[\s\S]*\}/);
      
      if (match) {
        const result = JSON.parse(match[0]);
        if (result.question) {
          console.log("✅ AI Success!");
          // Save async
          getEmbedding(result.ideal_answer).then(embedding => {
             Question.create({ topic, subTopic, difficulty, ...result, embedding });
          });
          return result;
        }
      }
    } catch (err) {
      console.warn(`⚠️ ${model} failed.`);
    }
  }

  // 2. If AI fails, use Smart Fallback (Guarantees a question)
  console.log("🔄 AI Unavailable. Using Smart Generator.");
  return generateSmartFallback(topic, subTopic, difficulty);
}

// --- ROUTES ---

app.post("/api/interview/generate", async (req, res) => {
  const { topic, subTopic, difficulty } = req.body;
  try {
    // This will NEVER throw an error now. It always returns something.
    const result = await generateQuestion(topic, subTopic, difficulty);
    res.json(result);
  } catch (error) {
    console.error("Critical Error:", error);
    // Ultimate safety net
    res.json({ 
      question: `Tell me about ${subTopic} in ${topic}.`, 
      ideal_answer: "Explain the concept." 
    });
  }
});

app.post("/api/interview/evaluate", async (req, res) => {
  const { userAnswer, idealAnswer } = req.body;
  try {
    const extractor = await VectorEngine.getInstance();
    const userEmb = await extractor(userAnswer, { pooling: "mean", normalize: true });
    const idealEmb = await extractor(idealAnswer, { pooling: "mean", normalize: true });
    const score = Math.round(cos_sim(userEmb.data, idealEmb.data) * 100);
    
    let feedback = score > 75 ? "Great job!" : score > 50 ? "Good attempt." : "Needs improvement.";
    res.json({ score, feedback, idealAnswer });
  } catch (err) {
    res.status(500).json({ error: "Evaluation failed" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
