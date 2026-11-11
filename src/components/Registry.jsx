import { useRef, useState } from 'react';
import { formatFlightDate } from '../lib/registry';
import { sortSeats } from '../lib/seats';

function barsFor(seed) {
  let hash = 2166136261;
  const text = String(seed);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Array.from({ length: 46 }, (_, index) => {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    const width = 1 + (Math.abs(hash + index) % 3);
    const tall = Math.abs(hash) % 5 !== 0;
    return { width, tall };
  });
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Pass({ flight, ordered, armed, onClaim, onRemoveTicket, onRemoveFlight, onArm }) {
  const ref = useRef(null);
  const box = useRef(null);
  const seats = ordered.map((ticket) => ticket.seat);

  if (!flight) return null;

  function onPointerEnter() {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    box.current = el.getBoundingClientRect();
    el.style.setProperty('--tz', '36px');
    el.style.setProperty('--pop', '1.045');
  }

  function onPointerMove(event) {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    const bounds = box.current;
    if (!el || !bounds || !bounds.width || !bounds.height) return;
    const px = (event.clientX - bounds.left) / bounds.width - 0.5;
    const py = (event.clientY - bounds.top) / bounds.height - 0.5;
    const rx = py * -14;
    const ry = px * 18;
    el.style.setProperty('--rx', `${rx}deg`);
    el.style.setProperty('--ry', `${ry}deg`);
    el.style.setProperty('--gx', `${50 + ry * 1.4}%`);
    el.style.setProperty('--gy', `${28 + rx}%`);
  }

  function onPointerLeave() {
    box.current = null;
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--tz', '0px');
    el.style.setProperty('--pop', '1');
    el.style.setProperty('--gx', '50%');
    el.style.setProperty('--gy', '28%');
  }

  return (
    <div className="pass-scene">
      <article
        ref={ref}
        className="pass"
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <header className="pass-top">
          <span>Skyroute ticket</span>
          <span>Registered</span>
        </header>
        <p className="pass-code">{flight.flightNumber}</p>
        <p className="pass-route">
          {flight.from} <span>to</span> {flight.to}
        </p>
        <dl className="pass-meta">
          <div>
            <dt>Date</dt>
            <dd>{formatFlightDate(flight.date)}</dd>
          </div>
          <div>
            <dt>Departs</dt>
            <dd>{flight.departs}</dd>
          </div>
          <div>
            <dt>Seats</dt>
            <dd>{seats.length ? seats.join(', ') : 'None yet'}</dd>
          </div>
        </dl>
        <div className="pass-tear" />
        {flight && ordered.length > 0 ? (
          <ul className="ticket-list">
            {ordered.map((ticket) => (
              <li key={ticket.id}>
                <span>
                  <strong>{ticket.seat}</strong>
                  {ticket.name}
                </span>
                <button type="button" onClick={() => onRemoveTicket(ticket.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty inline">This flight is saved. Add seats when you know who is traveling.</p>
        )}
        <div className="barcode" aria-hidden="true">
          {barsFor(`${flight.flightNumber}${flight.date}`).map((bar, index) => (
            <span key={index} style={{ width: bar.width, height: bar.tall ? '100%' : '70%' }} />
          ))}
        </div>
        {flight ? (
          <div className="actions">
            <button className="btn" type="button" onClick={() => onClaim(flight)}>
              Add seats
            </button>
            {armed ? (
              <button className="btn secondary danger" type="button" onClick={() => onRemoveFlight(flight.id)}>
                Confirm remove
              </button>
            ) : (
              <button className="btn secondary" type="button" onClick={() => onArm(flight.id)}>
                Remove flight
              </button>
            )}
          </div>
        ) : null}
      </article>
    </div>
  );
}

export function Registry({ flights, tickets, notice, onClaim, onRemoveTicket, onRemoveFlight }) {
  const [armed, setArmed] = useState(null);

  return (
    <section id="registry" className="registry">
      <div className="section-copy">
        <p className="eyebrow">Saved on this browser</p>
        <h2>These are the flights and tickets you registered.</h2>
        <p className="step-help">
          Each card is one flight. The seats listed on it belong to the people you named. Move the pointer over a card and it turns with you.
        </p>
      </div>
      {notice ? <p className="notice" role="status">{notice}</p> : null}
      <div className="flight-list">
        {flights.length === 0 ? (
          <p className="empty">Nothing is saved on this browser yet.</p>
        ) : null}
        {flights.map((flight) => {
          const booked = tickets.filter((ticket) => ticket.flightId === flight.id);
          const ordered = sortSeats(booked.map((ticket) => ticket.seat)).map((seat) => booked.find((ticket) => ticket.seat === seat));
          return (
            <Pass
              key={flight.id}
              flight={flight}
              ordered={ordered}
              armed={armed === flight.id}
              onClaim={onClaim}
              onRemoveTicket={onRemoveTicket}
              onRemoveFlight={(id) => {
                onRemoveFlight(id);
                setArmed(null);
              }}
              onArm={setArmed}
            />
          );
        })}
      </div>
    </section>
  );
}
