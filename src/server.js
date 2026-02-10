import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRouter } from './api/routes.js';
import { config } from './config.js';
import { json, noContent, withRequestContext } from './core/http.js';
import { createRateLimiter } from './core/rateLimiter.js';
import { BookingsRepository } from './data/bookingsRepository.js';
import { FlightsRepository } from './data/flightsRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const flightsRepository = new FlightsRepository();
const bookingsRepository = new BookingsRepository();
const router = createRouter({ flightsRepository, bookingsRepository });
const limit = createRateLimiter({
  maxRequests: config.rateLimitMaxRequests,
  windowMs: config.rateLimitWindowMs
});

const serveStatic = async (req, res) => {
  const requested = req.url === '/' ? '/index.html' : req.url;
  const normalized = path.normalize(requested).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(publicDir, normalized);

  try {
    const file = await readFile(filePath);
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8'
    };

    res.writeHead(200, { 'content-type': contentTypes[ext] ?? 'text/plain; charset=utf-8' });
    res.end(file);
    return true;
  } catch {
    return false;
  }
};

const app = withRequestContext(async (req, res, context) => {
  res.setHeader('access-control-allow-origin', config.corsOrigin);
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type,x-request-id');

  if (req.method.toUpperCase() === 'OPTIONS') {
    noContent(res);
    return;
  }

  const clientId = req.socket.remoteAddress ?? 'unknown';
  const rate = limit(clientId);

  res.setHeader('x-ratelimit-remaining', String(rate.remaining));
  res.setHeader('x-ratelimit-reset-ms', String(rate.resetInMs));

  if (!rate.allowed) {
    json(res, 429, { error: 'Rate limit exceeded', retryAfterMs: rate.resetInMs });
    return;
  }

  if (req.url.startsWith('/api/')) {
    try {
      await router(req, res, context);
    } catch (error) {
      json(res, 500, {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    return;
  }

  const served = await serveStatic(req, res);
  if (!served) {
    json(res, 404, { error: 'Not Found' });
  }
});

const server = http.createServer((req, res) => app(req, res, {}));

if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    console.log(`FlightMate running on http://localhost:${config.port}`);
  });
}

export { server };
