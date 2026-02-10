import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';

export const json = (res, statusCode, body, headers = {}) => {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    ...headers
  });
  res.end(JSON.stringify(body));
};

export const noContent = (res, headers = {}) => {
  res.writeHead(204, headers);
  res.end();
};

export const parseUrl = (req) => new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

export const parseBody = async (req) => {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
  }

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON payload');
  }
};

export const withRequestContext = (handler) => async (req, res, services) => {
  const requestId = req.headers['x-request-id'] ?? randomUUID();
  const startedAt = performance.now();

  res.setHeader('x-request-id', requestId);

  try {
    await handler(req, res, { ...services, requestId });
  } finally {
    const durationMs = (performance.now() - startedAt).toFixed(1);
    if (!res.headersSent) {
      res.setHeader('x-request-id', requestId);
      res.setHeader('x-response-time', `${durationMs}ms`);
    }
  }
};
