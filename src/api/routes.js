import { json, noContent, parseBody, parseUrl } from '../core/http.js';

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

export const createRouter = ({ flightsRepository, bookingsRepository }) => {
  const routes = new Map();

  const register = (method, path, handler) => {
    routes.set(`${method.toUpperCase()} ${path}`, handler);
  };

  register('GET', '/api/v1/health', async (req, res, context) => {
    json(res, 200, {
      status: 'ok',
      service: 'flightmate-api',
      requestId: context.requestId,
      timestamp: new Date().toISOString()
    });
  });

  register('GET', '/api/v1/flights', async (req, res) => {
    const url = parseUrl(req);
    const page = toPositiveInt(url.searchParams.get('page'), 1);
    const pageSize = Math.min(toPositiveInt(url.searchParams.get('pageSize'), 10), 50);
    const query = url.searchParams.get('query') ?? undefined;

    const result = flightsRepository.list({ page, pageSize, query });

    json(res, 200, result);
  });

  register('GET', '/api/v1/flights/:id', async (req, res, context) => {
    const { id } = context.params;
    const flight = flightsRepository.getById(id);

    if (!flight) {
      json(res, 404, { error: 'Flight not found', id });
      return;
    }

    json(res, 200, flight);
  });

  register('GET', '/api/v1/bookings', async (req, res) => {
    json(res, 200, { data: bookingsRepository.list() });
  });

  register('POST', '/api/v1/bookings', async (req, res) => {
    const body = await parseBody(req);

    if (!body?.flightId || !body?.passengerName || !body?.email) {
      json(res, 400, {
        error: 'Validation error',
        fields: ['flightId', 'passengerName', 'email']
      });
      return;
    }

    const flight = flightsRepository.getById(body.flightId);

    if (!flight) {
      json(res, 404, { error: 'Flight not found', flightId: body.flightId });
      return;
    }

    const booking = bookingsRepository.create({
      flightId: body.flightId,
      passengerName: body.passengerName,
      email: body.email
    });

    json(res, 201, booking);
  });

  register('OPTIONS', '/api/v1/flights', async (req, res) => noContent(res));
  register('OPTIONS', '/api/v1/bookings', async (req, res) => noContent(res));

  const dynamicRoutes = [
    { method: 'GET', pattern: /^\/api\/v1\/flights\/([^/]+)$/, pathKey: '/api/v1/flights/:id' }
  ];

  return async (req, res) => {
    const url = parseUrl(req);
    const key = `${req.method.toUpperCase()} ${url.pathname}`;

    if (routes.has(key)) {
      return routes.get(key)(req, res, { params: {} });
    }

    for (const route of dynamicRoutes) {
      if (route.method !== req.method.toUpperCase()) {
        continue;
      }

      const match = url.pathname.match(route.pattern);
      if (!match) {
        continue;
      }

      const handler = routes.get(`${route.method} ${route.pathKey}`);
      return handler(req, res, { params: { id: decodeURIComponent(match[1]) } });
    }

    json(res, 404, { error: 'Not Found', path: url.pathname });
  };
};
