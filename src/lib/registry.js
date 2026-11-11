const STORAGE_KEY = 'skyroute-registry-v1';

export function emptyRegistry() {
  return { flights: [], tickets: [] };
}

function flightHasData(flight) {
  return Boolean(
    flight
    && String(flight.flightNumber || '').trim()
    && String(flight.from || '').trim()
    && String(flight.to || '').trim()
    && flight.date,
  );
}

export function withoutEmptyFlights(registry) {
  const tickets = Array.isArray(registry.tickets) ? registry.tickets : [];
  const flights = (Array.isArray(registry.flights) ? registry.flights : []).filter((flight) => {
    const seats = tickets.filter((ticket) => ticket.flightId === flight.id);
    return flightHasData(flight) || seats.length > 0;
  });
  const ids = new Set(flights.map((flight) => flight.id));
  return {
    flights,
    tickets: tickets.filter((ticket) => ids.has(ticket.flightId)),
  };
}

export function loadRegistry() {
  if (typeof localStorage === 'undefined') return emptyRegistry();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyRegistry();
    const data = JSON.parse(raw);
    return withoutEmptyFlights({
      flights: Array.isArray(data.flights) ? data.flights : [],
      tickets: Array.isArray(data.tickets) ? data.tickets : [],
    });
  } catch {
    return emptyRegistry();
  }
}

export function saveRegistry(registry) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutEmptyFlights(registry)));
}

export function flightKey(flight) {
  return `${String(flight.flightNumber).trim().toUpperCase()}|${flight.date}`;
}

export function normalizeFlight(flight) {
  return {
    flightNumber: String(flight.flightNumber).trim().toUpperCase().replace(/\s+/g, ' '),
    from: flight.from.trim(),
    to: flight.to.trim(),
    date: flight.date,
    departs: flight.departs,
  };
}

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function saveFlight(registry, flight) {
  const details = normalizeFlight(flight);
  const key = flightKey(details);
  const existing = registry.flights.find((item) => flightKey(item) === key);
  if (!existing) {
    return {
      ...registry,
      flights: [{ id: uid(), ...details }, ...registry.flights],
    };
  }
  return {
    ...registry,
    flights: registry.flights.map((item) => (item.id === existing.id ? { ...item, ...details } : item)),
  };
}

export function registerTickets(registry, input) {
  const withFlight = saveFlight(registry, input.flight);
  const flight = withFlight.flights.find((item) => flightKey(item) === flightKey(normalizeFlight(input.flight)));
  const tickets = [
    ...input.passengers.map((passenger) => ({
      id: uid(),
      flightId: flight.id,
      name: passenger.name.trim(),
      email: input.email.trim(),
      seat: passenger.seat,
    })),
    ...withFlight.tickets,
  ];
  return { flights: withFlight.flights, tickets };
}

export function deleteTicket(registry, ticketId) {
  const removed = registry.tickets.find((ticket) => ticket.id === ticketId);
  const tickets = registry.tickets.filter((ticket) => ticket.id !== ticketId);
  if (!removed) return { ...registry, tickets };
  const seatsLeft = tickets.filter((ticket) => ticket.flightId === removed.flightId).length;
  if (seatsLeft === 0) return deleteFlight({ ...registry, tickets }, removed.flightId);
  return { ...registry, tickets };
}

export function deleteFlight(registry, flightId) {
  return {
    flights: registry.flights.filter((flight) => flight.id !== flightId),
    tickets: registry.tickets.filter((ticket) => ticket.flightId !== flightId),
  };
}

export function formatFlightDate(iso) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}
