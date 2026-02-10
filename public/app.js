const els = {
  badge: document.querySelector('#health-badge'),
  query: document.querySelector('#query'),
  searchBtn: document.querySelector('#search-btn'),
  flights: document.querySelector('#flights'),
  template: document.querySelector('#flight-card-template'),
  totalFlights: document.querySelector('#total-flights'),
  activeQuery: document.querySelector('#active-query'),
  cachedRecords: document.querySelector('#cached-records'),
  paginationMeta: document.querySelector('#pagination-meta')
};

const state = {
  cache: new Map(),
  lastQuery: ''
};

const api = async (path, options = {}) => {
  const res = await fetch(path, {
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
    ...options
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error ?? `Request failed (${res.status})`);
  }

  return res.json();
};

const renderFlights = (payload, queryText) => {
  els.flights.innerHTML = '';

  if (!payload.data.length) {
    els.flights.innerHTML = '<p class="error">No flights found for this query.</p>';
    return;
  }

  for (const flight of payload.data) {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.querySelector('.flight-route').textContent = `${flight.from} → ${flight.to}`;
    node.querySelector('.flight-meta').textContent = `${flight.id} • ${flight.date} • ${flight.seatsLeft} seats left`;
    node.querySelector('.flight-price').textContent = `$${flight.price}`;

    node.querySelector('.book-btn').addEventListener('click', async () => {
      await api('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify({
          flightId: flight.id,
          passengerName: 'Quick Booker',
          email: 'quick.booker@flightmate.local'
        })
      });

      node.querySelector('.book-btn').textContent = 'Booked';
      node.querySelector('.book-btn').disabled = true;
    });

    els.flights.append(node);
  }

  els.totalFlights.textContent = payload.pagination.total;
  els.activeQuery.textContent = queryText || 'All';
  els.cachedRecords.textContent = state.cache.size;
  els.paginationMeta.textContent = `Page ${payload.pagination.page} / ${payload.pagination.totalPages}`;
};

const loadFlights = async (queryText = '') => {
  const key = queryText.trim().toLowerCase();
  state.lastQuery = queryText;

  if (state.cache.has(key)) {
    renderFlights(state.cache.get(key), queryText);
    return;
  }

  const encoded = encodeURIComponent(queryText);
  const payload = await api(`/api/v1/flights?query=${encoded}&page=1&pageSize=20`);
  state.cache.set(key, payload);
  renderFlights(payload, queryText);
};

const loadHealth = async () => {
  try {
    await api('/api/v1/health');
    els.badge.textContent = 'API healthy';
  } catch {
    els.badge.textContent = 'API unavailable';
    els.badge.classList.add('error');
  }
};

els.searchBtn.addEventListener('click', () => loadFlights(els.query.value));
els.query.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    loadFlights(els.query.value);
  }
});

await Promise.all([loadHealth(), loadFlights()]);
