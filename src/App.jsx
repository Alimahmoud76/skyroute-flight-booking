import { useCallback, useEffect, useState } from 'react';
import { BookingDesk } from './components/BookingDesk';
import { Registry } from './components/Registry';
import { Sky } from './components/Sky';
import { useClock } from './hooks/useClock';
import { useWeather } from './hooks/useWeather';
import { formatClock } from './lib/time';
import {
  deleteFlight,
  deleteTicket,
  loadRegistry,
  registerTickets,
  saveFlight,
  saveRegistry,
} from './lib/registry';

function scrollBehavior() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function ClockReadout() {
  const [time, setTime] = useState(() => formatClock(new Date()));

  useEffect(() => {
    let id = 0;
    const tick = () => setTime(formatClock(new Date()));
    const stop = () => {
      window.clearInterval(id);
      id = 0;
    };
    const start = () => {
      stop();
      tick();
      id = window.setInterval(tick, 1000);
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <p className="clock-time">{time}</p>;
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 36 36" aria-hidden="true">
      <path d="M5 26c7-10 14-11 26-16" />
      <circle cx="6" cy="26" r="2.2" />
      <circle cx="29" cy="10" r="2.2" />
    </svg>
  );
}

export default function App() {
  const clock = useClock();
  const weather = useWeather();
  const [registry, setRegistry] = useState(loadRegistry);
  const [notice, setNotice] = useState('');
  const [presetFlight, setPresetFlight] = useState(null);

  const clearPreset = useCallback(() => setPresetFlight(null), []);

  useEffect(() => {
    document.documentElement.dataset.theme = clock.theme;
    document.documentElement.dataset.period = clock.period.toLowerCase();
  }, [clock.theme, clock.period]);

  useEffect(() => {
    document.documentElement.dataset.rain = weather.raining ? 'on' : 'off';
  }, [weather.raining]);

  useEffect(() => {
    saveRegistry(registry);
  }, [registry]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = window.setTimeout(() => setNotice(''), 4600);
    return () => window.clearTimeout(id);
  }, [notice]);

  function handleSaveFlight(flight) {
    setRegistry((current) => saveFlight(current, flight));
    setNotice('Flight saved in this browser.');
    document.getElementById('registry')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }

  function handleRegister(input) {
    setRegistry((current) => registerTickets(current, input));
    setNotice('Ticket registered. The seats are held on this flight.');
    window.requestAnimationFrame(() => {
      document.getElementById('registry')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    });
  }

  return (
    <>
      <a className="skip" href="#register">Skip to registration</a>
      <Sky raining={weather.raining} />
      <header className="topbar">
        <a className="brand" href="#runway">
          <Mark />
          <span>Skyroute</span>
        </a>
        <div className="clock">
          <ClockReadout />
          <p className="clock-meta">
            {clock.period}
            <span> · {clock.note}</span>
          </p>
          <p className="clock-weather">{weather.line}</p>
        </div>
        <nav className="nav">
          <a href="#register">Register</a>
          <a href="#register">Cabin</a>
          <a href="#registry">Saved</a>
        </nav>
      </header>
      <main>
        <section id="runway" className="runway">
          <div className="hero-copy">
            <p className="eyebrow">A boarding desk on this device</p>
            <h1>Register the flight. Keep the seat.</h1>
            <figure className="quote">
              <blockquote>
                <p>Once you have tasted flight, you will forever walk the earth with your eyes turned skyward.</p>
              </blockquote>
              <figcaption>Leonardo da Vinci</figcaption>
            </figure>
            <p className="lede">
              This is where a flight is registered and a seat is held. Choose the cities, name the departure, then look down on the cabin and take a chair that is still open. The ticket stays in this browser, on a card you can turn in your hand.
            </p>
            <div className="hero-actions">
              <a className="btn" href="#register">Register a flight</a>
              <p className="scroll-note">It flies out before the desk</p>
            </div>
          </div>
        </section>
        <div className="sheet">
          <BookingDesk
            tickets={registry.tickets}
            flights={registry.flights}
            presetFlight={presetFlight}
            onPresetConsumed={clearPreset}
            onSaveFlight={handleSaveFlight}
            onRegister={handleRegister}
          />
          <Registry
            flights={registry.flights}
            tickets={registry.tickets}
            notice={notice}
            onClaim={setPresetFlight}
            onRemoveTicket={(ticketId) => {
              let flightGone = false;
              setRegistry((current) => {
                const ticket = current.tickets.find((item) => item.id === ticketId);
                const next = deleteTicket(current, ticketId);
                flightGone = Boolean(ticket && !next.flights.some((flight) => flight.id === ticket.flightId));
                return next;
              });
              setNotice(flightGone
                ? 'Last seat removed. That flight left this browser.'
                : 'Ticket removed. That seat is open again.');
            }}
            onRemoveFlight={(flightId) => {
              setRegistry((current) => deleteFlight(current, flightId));
              setNotice('Flight removed from this browser.');
            }}
          />
          <footer className="colophon">
            <p>{clock.dateLabel}. Registry stays on this device.</p>
          </footer>
        </div>
      </main>
    </>
  );
}
