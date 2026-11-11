import { useEffect, useState } from 'react';

function describe(code) {
  if (code == null) return 'Sky';
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Overcast';
}

function isRaining(code, precipitation) {
  const snow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  if (snow) return false;
  const rainCode = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  const wet = typeof precipitation === 'number' && precipitation > 0;
  return rainCode || wet;
}

function weatherLine(weather) {
  if (weather.status === 'loading') return 'Checking the sky…';
  if (weather.status !== 'ready') return 'Weather unavailable';
  const temperature = weather.temp == null ? '' : `${weather.temp}°`;
  return [weather.summary, temperature, weather.place].filter(Boolean).join(' · ');
}

async function reversePlace(latitude, longitude, signal) {
  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');
    const response = await fetch(url, { signal });
    if (!response.ok) return '';
    const data = await response.json();
    return data.results?.[0]?.name || '';
  } catch {
    return '';
  }
}

async function readForecast(latitude, longitude, place, signal) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m,precipitation,weather_code');
  url.searchParams.set('timezone', 'auto');
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('forecast failed');
  const data = await response.json();
  const current = data.current ?? {};
  return {
    status: 'ready',
    raining: isRaining(current.weather_code, current.precipitation),
    summary: describe(current.weather_code),
    place,
    temp: Number.isFinite(current.temperature_2m) ? Math.round(current.temperature_2m) : null,
  };
}

function locate(signal) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('geolocation missing'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 6000,
      maximumAge: 10 * 60 * 1000,
    });
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
}

export function useWeather() {
  const [weather, setWeather] = useState({
    status: 'loading',
    raining: false,
    summary: 'Checking the sky',
    place: '',
    temp: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const position = await locate(controller.signal);
        const { latitude, longitude } = position.coords;
        const place = await reversePlace(latitude, longitude, controller.signal);
        const next = await readForecast(latitude, longitude, place, controller.signal);
        if (!controller.signal.aborted) setWeather(next);
      } catch (error) {
        if (controller.signal.aborted || error?.name === 'AbortError') return;
        try {
          const response = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: controller.signal });
          if (!response.ok) throw new Error('ip lookup failed');
          const data = await response.json();
          const next = await readForecast(data.latitude, data.longitude, data.city || '', controller.signal);
          if (!controller.signal.aborted) setWeather(next);
        } catch (fallbackError) {
          if (controller.signal.aborted || fallbackError?.name === 'AbortError') return;
          setWeather({
            status: 'unavailable',
            raining: false,
            summary: 'Weather unavailable',
            place: '',
            temp: null,
          });
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return { ...weather, line: weatherLine(weather) };
}
