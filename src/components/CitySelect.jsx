import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function CitySelect({ label, value, options, placeholder = 'Choose', onChange, error, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const labelId = useId();
  const choices = options ?? [];
  const listed = value && !choices.includes(value) ? [value, ...choices] : choices;

  useEffect(() => {
    if (!open) return undefined;

    let frame = 0;

    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom;
      const above = rect.top;
      const flip = below < 220 && above > below;
      const top = flip ? rect.top - 6 : rect.bottom + 6;
      const left = rect.left;
      const width = rect.width;
      setBox((prev) => (
        prev && prev.top === top && prev.left === left && prev.width === width && prev.flip === flip
          ? prev
          : { top, left, width, flip }
      ));
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        place();
      });
    };

    const onScroll = (event) => {
      const menu = menuRef.current;
      if (menu && (event.target === menu || menu.contains(event.target))) return;
      schedule();
    };

    const onPointerDown = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      setBox(null);
    };

    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setBox(null);
      }
    };

    schedule();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <div className={`field city-field ${open ? 'is-open' : ''}`} ref={rootRef}>
      <span id={labelId}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        className="city-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setBox(null);
          setOpen((current) => !current);
        }}
      >
        {value || placeholder}
      </button>
      {open && box
        ? createPortal(
            <ul
              ref={menuRef}
              className={`city-menu${box.flip ? ' is-up' : ''}`}
              role="listbox"
              aria-labelledby={labelId}
              style={{ position: 'fixed', top: box.top, left: box.left, width: box.width, right: 'auto', zIndex: 40 }}
            >
              {listed.map((city) => (
                <li key={city} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === city}
                    className={value === city ? 'is-selected' : ''}
                    onClick={() => {
                      onChange(city);
                      setOpen(false);
                      setBox(null);
                    }}
                  >
                    {city}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
      {error ? <small>{error}</small> : null}
    </div>
  );
}
