import { useLayoutEffect, useRef } from 'react';

// Keep visible navigation under the pointer when an asynchronous result changes
// the exercise height. The controls remain in normal flow below the exercise.
export function useReviewNavigationAnchor(key: string) {
  const navigation = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = navigation.current;
    const reader = element?.closest<HTMLElement>('.reader');
    const page = element?.parentElement;
    const exercise = element?.previousElementSibling;
    if (!element || !reader || !page || !exercise) return;
    const originalPadding = page.style.paddingBottom;
    let previous = element.getBoundingClientRect();
    let width = reader.clientWidth;
    const remember = () => {
      previous = element.getBoundingClientRect();
    };
    const observer = new ResizeObserver(() => {
      const bounds = reader.getBoundingClientRect();
      const current = element.getBoundingClientRect();
      if (width !== reader.clientWidth) page.style.paddingBottom = originalPadding;
      if (
        width === reader.clientWidth &&
        !document.activeElement?.matches('input, textarea, [contenteditable="true"]') &&
        previous.top >= bounds.top &&
        previous.bottom <= bounds.bottom
      ) {
        const target = reader.scrollTop + current.top - previous.top;
        const missingSpace = target - (reader.scrollHeight - reader.clientHeight);
        // There must be enough space below the buttons to preserve their current
        // viewport position even when they were visible near the page's end.
        if (missingSpace > 0) {
          const padding = parseFloat(getComputedStyle(page).paddingBottom);
          page.style.paddingBottom = `${padding + missingSpace}px`;
        }
        reader.scrollTop = target;
      }
      width = reader.clientWidth;
      remember();
    });
    observer.observe(exercise);
    observer.observe(reader);
    reader.addEventListener('scroll', remember, { passive: true });
    return () => {
      observer.disconnect();
      reader.removeEventListener('scroll', remember);
      page.style.paddingBottom = originalPadding;
    };
  }, [key]);
  return navigation;
}
