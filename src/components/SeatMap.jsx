import { COLUMNS, EXIT_ROWS, ROW_COUNT, seatId } from '../lib/seats';

function SeatButton({ row, column, taken, selected, exit, onToggle }) {
  const id = seatId(row, column);
  const isTaken = taken.has(id);
  const isSelected = selected.has(id);
  const state = isTaken ? 'taken' : isSelected ? 'selected' : 'available';

  return (
    <button
      type="button"
      className={`seat ${state}`}
      disabled={isTaken}
      aria-pressed={isSelected}
      aria-label={`Seat ${id}, ${state}${exit ? ', exit row' : ''}`}
      onClick={() => onToggle(id)}
    />
  );
}

export function SeatMap({ taken, selected, onToggle }) {
  const selectedSet = new Set(selected);

  return (
    <div className="seat-scroll">
      <div className="aircraft">
        <div className="wings" aria-hidden="true">
          <span className="wing-shape left" />
          <span className="wing-shape right" />
          <span className="engine-dot left" />
          <span className="engine-dot right" />
        </div>
        <div className="fuselage">
          <div className="nose" />
          <div className="cabin" role="group" aria-label="Cabin seats, viewed from above. The nose points up.">
            <div className="seat-columns" aria-hidden="true">
              <span />
              {COLUMNS.slice(0, 3).map((column) => (
                <span key={column}>{column}</span>
              ))}
              <span className="aisle-space" />
              {COLUMNS.slice(3).map((column) => (
                <span key={column}>{column}</span>
              ))}
              <span />
            </div>
            {Array.from({ length: ROW_COUNT }, (_, index) => {
              const row = index + 1;
              const exit = EXIT_ROWS.has(row);
              return (
                <div key={row}>
                  {row === 10 ? <p className="exit-label">Exit rows</p> : null}
                  <div className={`seat-row ${exit ? 'is-exit' : ''}`}>
                    <span className="row-index">{row}</span>
                    {COLUMNS.slice(0, 3).map((column) => (
                      <SeatButton
                        key={column}
                        row={row}
                        column={column}
                        taken={taken}
                        selected={selectedSet}
                        exit={exit}
                        onToggle={onToggle}
                      />
                    ))}
                    <span className="aisle-space" />
                    {COLUMNS.slice(3).map((column) => (
                      <SeatButton
                        key={column}
                        row={row}
                        column={column}
                        taken={taken}
                        selected={selectedSet}
                        exit={exit}
                        onToggle={onToggle}
                      />
                    ))}
                    <span className="row-index">{row}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="tail" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
