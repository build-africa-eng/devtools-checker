const express = require('express');
const cors = require('cors');
const analyzeRouter = require('./routes/analyze');

const app = express();

app.set('trust proxy', 1); // Trust Render's first proxy
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://devtools-checker.pages.dev' 
    : 'http://localhost:5173',
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/analyze', analyzeRouter);

app.get('/', (req, res) => {
  res.json({ message: 'DevTools Checker Backend - Use POST /api/analyze to analyze URLs' });
});

app.get('/api/analyze', (req, res) => {
  res.json({ message: 'Use POST /api/analyze with a JSON body { "url": "https://example.com" } to analyze a URL' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));