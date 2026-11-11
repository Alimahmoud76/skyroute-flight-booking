export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const ROW_COUNT = 22;
export const EXIT_ROWS = new Set([10, 11]);

export function seatId(row, column) {
  return `${row}${column}`;
}

export function allSeatIds() {
  const ids = [];
  for (let row = 1; row <= ROW_COUNT; row += 1) {
    for (const column of COLUMNS) ids.push(seatId(row, column));
  }
  return ids;
}

export function sortSeats(ids) {
  return [...ids].sort((a, b) => {
    const rowA = parseInt(a, 10);
    const rowB = parseInt(b, 10);
    if (rowA !== rowB) return rowA - rowB;
    return a.slice(String(rowA).length).localeCompare(b.slice(String(rowB).length));
  });
}

// Stable pretend occupancy so each flight looks partly booked
// before anyone registers a ticket on this device.
export function occupiedByAirline(flightNumber, date) {
  const key = `${flightNumber}|${date}`.trim().toUpperCase();
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const taken = new Set();
  for (const id of allSeatIds()) {
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 2246822507);
    hash >>>= 0;
    const row = parseInt(id, 10);
    const chance = EXIT_ROWS.has(row) ? 0.14 : 0.28;
    if ((hash % 1000) / 1000 < chance) taken.add(id);
  }
  return taken;
}
