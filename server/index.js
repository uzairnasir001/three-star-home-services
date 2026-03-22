import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import jazzcashRoutes from './routes/jazzcash.js';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Browser on Vercel calls API on another host → CORS. Comma-separated origins, no spaces (or trim below).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** Quick check: open http://localhost:3001/api/health while dev proxy uses 3000 */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API server is running', port: config.port });
});

app.use('/api', jazzcashRoutes);

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`  IPN: POST http://localhost:${PORT}/api/jazzcash-ipn (configure in JazzCash Credentials)`);
  console.log(`  Status: POST http://localhost:${PORT}/api/check-payment-status`);
  console.log(`  MWALLET CNIC: POST http://localhost:${PORT}/api/initiate-mwallet-cnic`);
});
