import React, { useEffect, useState, useRef } from "react";

function formatHHMMSS(sec) {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


export default function CountdownTimer({ resetInSeconds = 0, onZero, paused = false }) {
  const [seconds, setSeconds] = useState(Math.max(0, Math.floor(resetInSeconds)));
  const onZeroRef = useRef(onZero);
  const pausedRef = useRef(paused);

  useEffect(() => { onZeroRef.current = onZero; }, [onZero]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // update when prop changes
  useEffect(() => {
    setSeconds(Math.max(0, Math.floor(resetInSeconds)));
  }, [resetInSeconds]);

  useEffect(() => {
    if (seconds === 0) {
      // call onZero asynchronously
      setTimeout(() => { if (onZeroRef.current) onZeroRef.current(); }, 0);
      return;
    }

    const id = setInterval(() => {
      if (pausedRef.current) {
        return;
      }

      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          setTimeout(() => { if (onZeroRef.current) onZeroRef.current(); }, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [seconds]);

  return <span>{formatHHMMSS(seconds)}</span>;
}
