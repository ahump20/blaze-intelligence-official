import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins (required for Replit)
app.use(cors());

// Serve static files from both root and public directories
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Cache control headers to prevent caching issues in Replit
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Route handlers for main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'pricing.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

app.get('/athlete-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'athlete-dashboard.html'));
});

// Route handlers for generated pages from public directory
app.get('/manifesto', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifesto.html'));
});

app.get('/pilot-playbook', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pilot-playbook.html'));
});

app.get('/investor-narrative', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'investor-narrative.html'));
});

app.get('/recruiting', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recruiting.html'));
});

app.get('/rankings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rankings.html'));
});

app.get('/integration-hub', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'integration-hub.html'));
});

app.get('/lone-star-legends', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lone-star-legends.html'));
});

// Handle 404s by serving index.html
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Blaze Intelligence server running on port ${PORT}`);
  console.log(`🚀 Access your app at: http://localhost:${PORT}`);
});