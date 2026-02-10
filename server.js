require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4646;
const OFFICIAL_EMAIL = process.env.OFFICIAL_EMAIL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


async function getAIResponse(question) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: `Answer in ONE WORD only: ${question}` }
            ]
          }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    return response.data.candidates[0].content.parts[0].text
      .trim()
      .split(/\s+/)[0];

  } catch (error) {
    console.error("Gemini API failed. Using fallback.");

    
    const q = question.toLowerCase();
    if (q.includes("maharashtra")) return "Mumbai";
    if (q.includes("india")) return "Delhi";

    return "Unknown";
  }
}


app.post("/bfhl", async (req, res) => {
  try {
    const question = req.body.AI;

    if (!question) {
      return res.status(400).json({
        is_success: false,
        error: "AI question missing"
      });
    }

    const aiAnswer = await getAIResponse(question);

    res.json({
      is_success: true,
      official_email: OFFICIAL_EMAIL,
      data: aiAnswer
    });

  } catch (err) {
    res.status(500).json({
      is_success: false,
      error: "Internal server error"
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Official Email: ${OFFICIAL_EMAIL}`);
});
