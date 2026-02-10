import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
const { server } = await import('../src/server.js');

let base;

before(async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});

test('health endpoint returns ok', async () => {
  const res = await fetch(`${base}/api/v1/health`);
  assert.equal(res.status, 200);
  const payload = await res.json();
  assert.equal(payload.status, 'ok');
});

test('flights endpoint supports query filtering', async () => {
  const res = await fetch(`${base}/api/v1/flights?query=tokyo`);
  assert.equal(res.status, 200);
  const payload = await res.json();
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].from, 'Tokyo');
});

test('booking validation returns 400 when fields missing', async () => {
  const res = await fetch(`${base}/api/v1/bookings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 400);
});
