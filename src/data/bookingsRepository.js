export class BookingsRepository {
  constructor() {
    this.bookings = [];
  }

  create(payload) {
    const booking = {
      id: `BK-${Date.now()}-${Math.floor(Math.random() * 1_000)}`,
      createdAt: new Date().toISOString(),
      ...payload
    };

    this.bookings.push(booking);
    return booking;
  }

  list() {
    return this.bookings;
  }
}
