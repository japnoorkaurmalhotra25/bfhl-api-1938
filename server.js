require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OFFICIAL_EMAIL = process.env.OFFICIAL_EMAIL || 'your.email@chitkara.edu.in';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


function generateFibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  
  const fib = [0, 1];
  for (let i = 2; i < n; i++) {
    fib.push(fib[i - 1] + fib[i - 2]);
  }
  return fib;
}

function isPrime(num) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

function filterPrimes(arr) {
  return arr.filter(num => isPrime(num));
}

function gcd(a, b) {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return Math.abs(a);
}

function calculateHCF(arr) {
  return arr.reduce((acc, num) => gcd(acc, num));
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function calculateLCM(arr) {
  return arr.reduce((acc, num) => lcm(acc, num));
}

async function getAIResponse(question) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [{
      parts: [{
        text: `Answer this question with only a single word, no punctuation or explanation: ${question}`
      }]
    }]
  };

  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  const text = response.data.candidates[0].content.parts[0].text.trim();
  return text.split(/\s+/)[0].replace(/[.,!?;:]$/, '');
}


app.get('/health', (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL
  });
});


app.post('/bfhl', async (req, res) => {
  try {
    const body = req.body;
    
    const validKeys = ['fibonacci', 'prime', 'lcm', 'hcf', 'AI'];
    const providedKeys = Object.keys(body).filter(key => validKeys.includes(key));
    
    if (providedKeys.length === 0) {
      return res.status(400).json({
        is_success: false,
        error: 'No valid key provided. Expected one of: fibonacci, prime, lcm, hcf, AI'
      });
    }
    
    if (providedKeys.length > 1) {
      return res.status(400).json({
        is_success: false,
        error: 'Multiple keys provided. Expected exactly one of: fibonacci, prime, lcm, hcf, AI'
      });
    }
    
    const key = providedKeys[0];
    const value = body[key];
    
    let data;
    
    switch (key) {
      case 'fibonacci':
        if (!Number.isInteger(value) || value < 0) {
          return res.status(400).json({
            is_success: false,
            error: 'fibonacci requires a non-negative integer'
          });
        }
        data = generateFibonacci(value);
        break;
        
      case 'prime':
        if (!Array.isArray(value) || !value.every(num => Number.isInteger(num))) {
          return res.status(400).json({
            is_success: false,
            error: 'prime requires an array of integers'
          });
        }
        data = filterPrimes(value);
        break;
        
      case 'lcm':
        if (!Array.isArray(value) || value.length === 0 || !value.every(num => Number.isInteger(num) && num > 0)) {
          return res.status(400).json({
            is_success: false,
            error: 'lcm requires a non-empty array of positive integers'
          });
        }
        data = calculateLCM(value);
        break;
        
      case 'hcf':
        if (!Array.isArray(value) || value.length === 0 || !value.every(num => Number.isInteger(num) && num > 0)) {
          return res.status(400).json({
            is_success: false,
            error: 'hcf requires a non-empty array of positive integers'
          });
        }
        data = calculateHCF(value);
        break;
        
      case 'AI':
        if (typeof value !== 'string' || value.trim() === '') {
          return res.status(400).json({
            is_success: false,
            error: 'AI requires a non-empty string question'
          });
        }
        try {
          data = await getAIResponse(value);
        } catch (error) {
          return res.status(500).json({
            is_success: false,
            error: 'AI service unavailable'
          });
        }
        break;
    }
    
    res.status(200).json({
      is_success: true,
      official_email: OFFICIAL_EMAIL,
      data: data
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      is_success: false,
      error: 'Internal server error'
    });
  }
});


app.use((req, res) => {
  res.status(404).json({
    is_success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});