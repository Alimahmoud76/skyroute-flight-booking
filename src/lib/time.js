// Morning and afternoon use the daylight theme.
// Evening and night use the dark cabin theme.
// The split follows the local clock.

export function getPeriod(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

export function themeForPeriod(period) {
  return period === 'Morning' || period === 'Afternoon' ? 'day' : 'night';
}

export function periodNote(period) {
  switch (period) {
    case 'Morning':
      return 'Bright sky';
    case 'Afternoon':
      return 'Daylight';
    case 'Evening':
      return 'Warm cabin';
    default:
      return 'Dark sky';
  }
}

const clockFormat = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
});

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function formatClock(date) {
  return clockFormat.format(date);
}

export function formatDay(date) {
  return dayFormat.format(date);
}
