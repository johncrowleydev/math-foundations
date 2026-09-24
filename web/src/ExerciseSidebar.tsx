import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from './Rich';

// Practice and Review share the same sidebar and compact exercise picker. The
// desktop sidebar lives beside the reader, so each scrolls independently.
export function ExerciseSidebar({
  children,
  host,
  selected,
  mobileOpen,
  onClose,
  title = 'Exercises',
  className = '',
}: {
  children: ReactNode;
  host: HTMLElement | null;
  selected: string | number;
  mobileOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}) {
  const sidebar = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const content = mobileOpen ? sheet.current : sidebar.current;
    const container = mobileOpen ? content?.closest<HTMLElement>('.modal') : content;
    const item = content?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!item || !container) return;
    const bounds = container.getBoundingClientRect();
    const row = item.getBoundingClientRect();
    if (row.top < bounds.top || row.bottom > bounds.bottom)
      container.scrollTop += row.top - bounds.top - 80;
  }, [selected, mobileOpen, host]);
  return (
    <>
      {host &&
        createPortal(
          <aside ref={sidebar} className={'practice-sidebar ' + className}>
            {children}
          </aside>,
          host,
        )}
      {mobileOpen && (
        <Modal title={title} onClose={onClose}>
          <div ref={sheet} className="practice-sheet">
            {children}
          </div>
        </Modal>
      )}
    </>
  );
}
