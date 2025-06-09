const express = require('express');
const cors = require('cors');
const analyzeRouter = require('./routes/analyze');

const app = express();

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://devtools-checker.pages.dev' 
    : 'http://localhost:5173',
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/analyze', analyzeRouter); // Changed from '/analyze' to '/api/analyze'

// Root GET route for clarity
app.get('/', (req, res) => {
  res.json({ message: 'DevTools Checker Backend - Use POST /api/analyze to analyze URLs' });
});

// GET /api/analyze route for clarity
app.get('/api/analyze', (req, res) => {
  res.json({ message: 'Use POST /api/analyze with a JSON body { "url": "https://example.com" } to analyze a URL' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));