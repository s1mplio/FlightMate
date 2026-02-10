import http from 'node:http';

import { config } from './config.js';
import { app } from './app.js';

const server = http.createServer((req, res) => app(req, res, {}));

if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    console.log(`FlightMate running on http://localhost:${config.port}`);
  });
}

export { server };
