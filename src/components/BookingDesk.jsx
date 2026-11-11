import { useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRIES, FLIGHT_NUMBERS, countryForCity } from '../lib/places';
import { flightKey, formatFlightDate } from '../lib/registry';
import { occupiedByAirline, sortSeats } from '../lib/seats';
import { CitySelect } from './CitySelect';
import { SeatMap } from './SeatMap';

const STEPS = ['Flight', 'Cabin', 'Travelers', 'Ticket'];

const blankFlight = {
  flightNumber: '',
  fromCountry: '',
  from: '',
  toCountry: '',
  to: '',
  date: '',
  departs: '',
};

function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function validateFlight(flight) {
  const errors = {};
  if (!flight.flightNumber) errors.flightNumber = 'Choose a flight number.';
  if (!flight.fromCountry) errors.fromCountry = 'Choose a departure country.';
  if (!flight.from.trim()) errors.from = 'Choose a departure city.';
  if (!flight.toCountry) errors.toCountry = 'Choose an arrival country.';
  if (!flight.to.trim()) errors.to = 'Choose an arrival city.';
  if (flight.from && flight.to && flight.from === flight.to) errors.to = 'Arrival should differ from departure.';
  if (!flight.date) errors.date = 'Choose a date.';
  else if (flight.date < todayISO()) errors.date = 'That date has already passed.';
  if (!flight.departs) errors.departs = 'Choose a departure time.';
  return Object.keys(errors).length ? errors : null;
}

export function BookingDesk({ tickets, flights, presetFlight, onPresetConsumed, onSaveFlight, onRegister }) {
  const [step, setStep] = useState(0);
  const [flight, setFlight] = useState(blankFlight);
  const [party, setParty] = useState(1);
  const [selected, setSelected] = useState([]);
  const [email, setEmail] = useState('');
  const [passengers, setPassengers] = useState([]);
  const [errors, setErrors] = useState({});
  const headingRef = useRef(null);
  const lock = useRef(false);

  useEffect(() => {
    if (!presetFlight) return;
    setFlight({
      flightNumber: presetFlight.flightNumber,
      fromCountry: countryForCity(presetFlight.from),
      from: presetFlight.from,
      toCountry: countryForCity(presetFlight.to),
      to: presetFlight.to,
      date: presetFlight.date,
      departs: presetFlight.departs,
    });
    setSelected([]);
    setPassengers([]);
    setStep(1);
    setErrors({});
    onPresetConsumed();
    headingRef.current?.focus();
  }, [presetFlight, onPresetConsumed]);

  const taken = useMemo(() => {
    const seeded = occupiedByAirline(flight.flightNumber || 'open', flight.date || 'undated');
    if (flight.flightNumber && flight.date) {
      const record = flights.find((item) => flightKey(item) === flightKey(flight));
      if (record) {
        tickets.filter((ticket) => ticket.flightId === record.id).forEach((ticket) => seeded.add(ticket.seat));
      }
    }
    return seeded;
  }, [flight, flights, tickets]);

  function patchFlight(partial) {
    setFlight((current) => ({ ...current, ...partial }));
    if (partial.flightNumber != null || partial.date != null) {
      setSelected([]);
      setPassengers([]);
    }
  }

  function changeParty(next) {
    const count = Math.min(6, Math.max(1, next));
    setParty(count);
    setSelected((current) => current.slice(0, count));
  }

  function toggleSeat(id) {
    if (taken.has(id)) return;
    setSelected((current) => {
      if (current.includes(id)) return current.filter((seat) => seat !== id);
      if (current.length >= party) return current;
      return [...current, id];
    });
    setErrors((current) => ({ ...current, seats: undefined }));
  }

  function go(next) {
    setStep(next);
    setErrors({});
    window.requestAnimationFrame(() => {
      document.getElementById('register')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
      headingRef.current?.focus();
    });
  }

  function continueFromFlight(event) {
    event.preventDefault();
    const nextErrors = validateFlight(flight);
    if (nextErrors) {
      setErrors(nextErrors);
      return;
    }
    go(1);
  }

  function saveOnly() {
    const nextErrors = validateFlight(flight);
    if (nextErrors) {
      setErrors(nextErrors);
      return;
    }
    onSaveFlight(flight);
  }

  function continueFromSeats(event) {
    event.preventDefault();
    if (selected.length !== party) {
      setErrors({ seats: `Choose ${party} open seat${party === 1 ? '' : 's'}.` });
      return;
    }
    const seats = sortSeats(selected);
    setPassengers((current) => seats.map((seat) => current.find((person) => person.seat === seat) || { seat, name: '' }));
    go(2);
  }

  function continueFromTravelers(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Enter a contact email.';
    passengers.forEach((person, index) => {
      if (person.name.trim().length < 2) nextErrors[`name-${index}`] = 'Enter this traveler’s name.';
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    go(3);
  }

  function finish(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    onRegister({
      flight,
      email,
      passengers: sortSeats(passengers.map((person) => person.seat)).map((seat) => passengers.find((person) => person.seat === seat)),
    });
    setFlight(blankFlight);
    setParty(1);
    setSelected([]);
    setEmail('');
    setPassengers([]);
    setErrors({});
    setStep(0);
    lock.current = false;
  }

  const openCount = 22 * 6 - taken.size;
  const orderedSeats = sortSeats(selected);

  return (
    <section id="register" className="desk-section">
      <div className="section-copy">
        <p className="eyebrow">Registration</p>
        <h2 ref={headingRef} tabIndex={-1}>
          {step === 0 && 'Which flight is this?'}
          {step === 1 && 'Choose the open seats.'}
          {step === 2 && 'Who is sitting there?'}
          {step === 3 && 'Check the ticket, then save it.'}
        </h2>
        <p className="step-help">
          {step === 0 && 'Choose the flight number, then the country and city it leaves and the country and city where it lands. You can save the flight now and pick seats afterward.'}
          {step === 1 && 'You are looking down on the cabin. The nose points up. A and F are the windows. Hatched seats are already taken.'}
          {step === 2 && 'Write one name for each seat, plus an email for this ticket.'}
          {step === 3 && 'This is the flight and the people you are about to register on this device.'}
        </p>
      </div>

      <ol className="steps">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? 'is-current' : index < step ? 'is-done' : ''}>
            {index < step ? (
              <button type="button" onClick={() => go(index)}>
                {label}
              </button>
            ) : (
              <span>{label}</span>
            )}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <form className="panel" onSubmit={continueFromFlight}>
          <div className="flight-grid">
            <CitySelect
              label="Flight number"
              value={flight.flightNumber}
              options={FLIGHT_NUMBERS}
              placeholder="Choose a flight"
              error={errors.flightNumber}
              onChange={(flightNumber) => patchFlight({ flightNumber })}
            />
            <CitySelect
              label="Departure country"
              value={flight.fromCountry}
              options={Object.keys(COUNTRIES)}
              placeholder="Choose a country"
              error={errors.fromCountry}
              onChange={(fromCountry) => patchFlight({ fromCountry, from: '' })}
            />
            <CitySelect
              label="Departure city"
              value={flight.from}
              options={(COUNTRIES[flight.fromCountry] ?? []).filter((city) => city !== flight.to)}
              placeholder={flight.fromCountry ? 'Choose a city' : 'Choose a country first'}
              disabled={!flight.fromCountry}
              error={errors.from}
              onChange={(from) => patchFlight({ from })}
            />
            <CitySelect
              label="Arrival country"
              value={flight.toCountry}
              options={Object.keys(COUNTRIES)}
              placeholder="Choose a country"
              error={errors.toCountry}
              onChange={(toCountry) => patchFlight({ toCountry, to: '' })}
            />
            <CitySelect
              label="Arrival city"
              value={flight.to}
              options={(COUNTRIES[flight.toCountry] ?? []).filter((city) => city !== flight.from)}
              placeholder={flight.toCountry ? 'Choose a city' : 'Choose a country first'}
              disabled={!flight.toCountry}
              error={errors.to}
              onChange={(to) => patchFlight({ to })}
            />
            <label className="field">
              <span>Date</span>
              <input
                type="date"
                min={todayISO()}
                value={flight.date}
                onChange={(event) => patchFlight({ date: event.target.value })}
                aria-invalid={Boolean(errors.date)}
              />
              {errors.date ? <small>{errors.date}</small> : null}
            </label>
            <label className="field">
              <span>Departs</span>
              <input
                type="time"
                value={flight.departs}
                onChange={(event) => patchFlight({ departs: event.target.value })}
                aria-invalid={Boolean(errors.departs)}
              />
              {errors.departs ? <small>{errors.departs}</small> : null}
            </label>
          </div>
          <div className="actions">
            <button className="btn" type="submit">
              Choose seats
            </button>
            <button className="btn secondary" type="button" onClick={saveOnly}>
              Save flight only
            </button>
          </div>
        </form>
      ) : null}

      {step === 1 ? (
        <form className="panel cabin-panel" onSubmit={continueFromSeats}>
          <div className="cabin-tools">
            <p>
              Nose points up. A and F are windows. {openCount} seats are still open on this map.
            </p>
            <div className="party">
              <span>Travelers</span>
              <button type="button" onClick={() => changeParty(party - 1)} aria-label="Fewer travelers">
                −
              </button>
              <strong>{party}</strong>
              <button type="button" onClick={() => changeParty(party + 1)} aria-label="More travelers">
                +
              </button>
            </div>
          </div>
          <div className="legend">
            <span><i className="swatch open" /> Open</span>
            <span><i className="swatch yours" /> Your seat</span>
            <span><i className="swatch held" /> Already taken</span>
          </div>
          <SeatMap taken={taken} selected={selected} onToggle={toggleSeat} />
          <p className="seat-status" role="status">
            {orderedSeats.length ? `Selected ${orderedSeats.join(', ')}` : 'No seat selected yet.'}
            {errors.seats ? ` ${errors.seats}` : ''}
          </p>
          <div className="actions">
            <button className="btn" type="submit">
              Continue
            </button>
            <button className="btn secondary" type="button" onClick={() => go(0)}>
              Back to flight
            </button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form className="panel" onSubmit={continueFromTravelers}>
          <label className="field">
            <span>Contact email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email ? <small>{errors.email}</small> : null}
          </label>
          <div className="traveler-list">
            {passengers.map((person, index) => (
              <label className="field" key={person.seat}>
                <span>Seat {person.seat}</span>
                <input
                  value={person.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setPassengers((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, name } : item)));
                  }}
                  placeholder="Traveler name"
                  autoComplete="name"
                  aria-invalid={Boolean(errors[`name-${index}`])}
                />
                {errors[`name-${index}`] ? <small>{errors[`name-${index}`]}</small> : null}
              </label>
            ))}
          </div>
          <div className="actions">
            <button className="btn" type="submit">
              Review ticket
            </button>
            <button className="btn secondary" type="button" onClick={() => go(1)}>
              Back to cabin
            </button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form className="panel review" onSubmit={finish}>
          <p className="review-flight">
            {flight.flightNumber.trim().toUpperCase()} · {flight.from.trim()} to {flight.to.trim()}
          </p>
          <p>
            {formatFlightDate(flight.date)} at {flight.departs}
          </p>
          <ul>
            {passengers.map((person) => (
              <li key={person.seat}>
                <strong>{person.seat}</strong>
                {person.name.trim()}
              </li>
            ))}
          </ul>
          <p className="review-mail">{email.trim()}</p>
          <div className="actions">
            <button className="btn" type="submit">
              Register ticket
            </button>
            <button className="btn secondary" type="button" onClick={() => go(2)}>
              Edit travelers
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
