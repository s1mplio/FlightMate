# FlightMate

FlightMate includes:

- A modular, versioned API (`/api/v1`) with health checks, search, pagination, and booking endpoints.
- Request context propagation (`x-request-id`), CORS, and rate limiting.
- A modern dashboard UI with search, metrics, and one-click booking.
- Node-native tests for key API paths.
- Vercel deployment support (serverless API + static frontend routing).

## Run locally

```bash
npm start
```

Open <http://localhost:3000>.

## Test

```bash
npm test
```

## Deploy to Vercel

1. Install Vercel CLI and login:

```bash
npm i -g vercel
vercel login
```

2. Deploy preview:

```bash
vercel
```

3. Deploy production:

```bash
vercel --prod
```

`vercel.json` is preconfigured so:
- `/api/*` routes to the serverless handler (`api/index.js`),
- `/` and other non-API paths serve static assets from `public/`.
