const express = require('express');
const cors = require('cors');
const analyzeRoute = require('./routes/analyze');

const app = express();

// Configure CORS for Cloudflare Pages frontend
app.use(cors({ origin: 'https://devtools-checker.pages.dev' }));
app.use(express.json());

// Routes
app.use('/analyze', analyzeRoute);

// Root GET route for clarity
app.get('/', (req, res) => {
  res.json({ message: 'DevTools Checker Backend - Use POST /analyze to analyze URLs' });
});

// GET /analyze route for clarity
app.get('/analyze', (req, res) => {
  res.json({ message: 'Use POST /analyze with a JSON body { "url": "https://example.com" } to analyze a URL' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));