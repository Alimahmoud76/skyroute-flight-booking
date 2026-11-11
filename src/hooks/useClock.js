import { useEffect, useState } from 'react';
import { formatDay, getPeriod, periodNote, themeForPeriod } from '../lib/time';

function readStamp(now) {
  return { period: getPeriod(now), dateLabel: formatDay(now) };
}

export function useClock() {
  const [stamp, setStamp] = useState(() => readStamp(new Date()));

  useEffect(() => {
    let id = 0;

    const sync = () => {
      const next = readStamp(new Date());
      setStamp((current) => (
        current.period === next.period && current.dateLabel === next.dateLabel ? current : next
      ));
    };

    const stop = () => {
      window.clearInterval(id);
      id = 0;
    };

    const start = () => {
      stop();
      sync();
      id = window.setInterval(sync, 1000);
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

  return {
    period: stamp.period,
    theme: themeForPeriod(stamp.period),
    note: periodNote(stamp.period),
    dateLabel: stamp.dateLabel,
  };
}
