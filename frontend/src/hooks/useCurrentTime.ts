import { useState, useEffect } from 'react';

/**
 * Custom hook providing the current reactive timestamp.
 * Updates at the specified interval (default 5000ms) to ensure
 * dynamic election statuses (UPCOMING, REGISTRATION_OPEN, VOTING_OPEN, COMPLETED)
 * change in real-time without requiring a page reload.
 */
export const useCurrentTime = (intervalMs: number = 5000) => {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return currentTime;
};
