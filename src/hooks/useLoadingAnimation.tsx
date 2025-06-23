
import { useState, useEffect } from 'react';

export const useLoadingAnimation = () => {
  const [isLoading, setIsLoading] = useState(() => {
    // Check if this is the first load of the session
    const hasLoadedBefore = sessionStorage.getItem('app-has-loaded');
    return !hasLoadedBefore;
  });

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        // Mark that the app has loaded in this session
        sessionStorage.setItem('app-has-loaded', 'true');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return isLoading;
};
