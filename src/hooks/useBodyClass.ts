import { useEffect } from 'react';

/**
 * Adds a class to <body> while the calling page is mounted. Portals (dialogs, dropdowns, popovers)
 * render under <body>, so a theme applied here reaches them too.
 */
export function useBodyClass(className: string) {
  useEffect(() => {
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className]);
}
