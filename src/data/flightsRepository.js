const flightsSeed = [
  { id: 'FL-1001', from: 'New York', to: 'London', date: '2026-03-15', price: 680, seatsLeft: 8 },
  { id: 'FL-1002', from: 'Paris', to: 'Dubai', date: '2026-03-18', price: 520, seatsLeft: 12 },
  { id: 'FL-1003', from: 'Tokyo', to: 'Singapore', date: '2026-03-16', price: 430, seatsLeft: 3 },
  { id: 'FL-1004', from: 'Berlin', to: 'Rome', date: '2026-03-20', price: 210, seatsLeft: 20 },
  { id: 'FL-1005', from: 'Los Angeles', to: 'Sydney', date: '2026-03-22', price: 990, seatsLeft: 5 }
];

export class FlightsRepository {
  constructor(seed = flightsSeed) {
    this.flights = seed;
    this.byId = new Map(seed.map((f) => [f.id, f]));
  }

  list({ query, page = 1, pageSize = 10 }) {
    const normalized = query?.trim().toLowerCase();
    const filtered = normalized
      ? this.flights.filter((f) =>
          [f.id, f.from, f.to, f.date].some((v) => v.toLowerCase().includes(normalized))
        )
      : this.flights;

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    };
  }

  getById(id) {
    return this.byId.get(id) ?? null;
  }
}
