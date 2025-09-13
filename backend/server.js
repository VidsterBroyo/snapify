require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini client
const ai = new GoogleGenAI({
  // API key is automatically picked from GEMINI_API_KEY environment variable
});

app.post('/api/recommend', async (req, res) => {
  const { products, prompt } = req.body;

  if (!products || !prompt) {
    return res.status(400).json({ error: 'Missing products or prompt' });
  }

  // transform products to context string
  const productContext = products.map(p =>
    `ID: ${p.id}, Title: ${p.title}, Description: ${p.description}, Category: ${p.productType}`
  ).join('\n');

  try {
    // Send request to Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        "You are a sophisticated algorithm that recommends furniture. You are seeking the best fit but also want to ensure a good variety.",
        `Given these products:\n${productContext}\nUser desires: "${prompt}"\nReturn ONLY the top 10 product IDs in a comma-separated list.`
      ],
    });

    // Extract recommended IDs
    const recommendedText = response.text;
    const recommendedIds = recommendedText.split(',').map(id => id.trim().split('/').pop());

    res.json({ recommendedIds });
  } catch (err) {
    console.error('Gemini request failed:', err);
    res.status(500).json({ error: 'Gemini call failed' });
  }
});

let savedGrid = null;

app.post('/api/update-grid', (req, res) => {
  const { grid } = req.body;
  if (!grid) return res.status(400).json({ error: 'Missing grid data' });

  savedGrid = grid; // persist in memory
  console.log('Grid updated:', savedGrid);
  res.json({ success: true });
});

app.get('/api/get-grid', (req, res) => {
  res.json({ grid: savedGrid || [] });
});

app.listen(4000, () => console.log('Server running on http://localhost:4000'));
