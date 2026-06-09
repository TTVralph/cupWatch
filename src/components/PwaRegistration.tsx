'use client';

import { useEffect } from 'react';

export function PwaRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.warn('CupWatch service worker registration failed:', error);
      }
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
      return;
    }

    window.addEventListener('load', registerServiceWorker, { once: true });
    return () => window.removeEventListener('load', registerServiceWorker);
  }, []);

  return null;
}
