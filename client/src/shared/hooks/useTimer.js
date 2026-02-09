import { useState, useEffect } from 'react';

export function useTimer(endsAt) {
  const [remaining, setRemaining] = useState(() =>
    endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0
  );

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }

    function tick() {
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  return remaining;
}
