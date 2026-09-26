import { useLayoutEffect, useRef } from 'react';

// Preserve space already occupied by an interactive surface so async updates
// cannot clamp its scroll position. Intentional navigation or resizing resets it.
export function useRetainedHeight<T extends HTMLElement>(key: string, enabled = true) {
  const elementRef = useRef<T>(null);
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!enabled || !element) return;
    let width = 0;
    let height = 0;
    const retainHeight = () => {
      const nextWidth = element.getBoundingClientRect().width;
      if (nextWidth !== width) {
        width = nextWidth;
        height = 0;
        element.style.minHeight = '';
      }
      height = Math.max(height, element.getBoundingClientRect().height);
      element.style.minHeight = `${height}px`;
    };
    retainHeight();
    const observer = new ResizeObserver(retainHeight);
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.style.minHeight = '';
    };
  }, [key, enabled]);
  return elementRef;
}
