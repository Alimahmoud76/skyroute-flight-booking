export const FLIGHT_NUMBERS = [
  'EG189',
  'SK402',
  'EK202',
  'BA114',
  'QR707',
  'AF318',
  'LH441',
  'JL016',
  'SQ225',
  'TK708',
];

export const COUNTRIES = {
  Egypt: ['Cairo', 'Alexandria', 'Luxor'],
  USA: ['New York', 'Atlanta', 'Los Angeles'],
  Japan: ['Tokyo', 'Osaka'],
  France: ['Paris', 'Lyon'],
  'United Kingdom': ['London', 'Manchester'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi'],
};

export function countryForCity(city) {
  const match = Object.entries(COUNTRIES).find(([, cities]) => cities.includes(city));
  return match ? match[0] : '';
}
