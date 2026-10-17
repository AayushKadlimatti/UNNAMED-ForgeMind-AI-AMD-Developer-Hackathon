import { useEffect, useRef } from 'react';
import { BrainCircuit, X } from 'lucide-react';

export default function DiagnosticsModal({ open, onClose, canCreate, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  return <dialog ref={ref} className="master-diagnostics-modal" aria-labelledby="diagnostics-modal-title" onClose={onClose} onClick={e => {
    if (e.target !== ref.current) return;
    const box = ref.current.getBoundingClientRect();
    if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) onClose();
  }}>
    <div className="master-modal-layout"><header className="master-modal-header"><span className="master-modal-symbol"><BrainCircuit size={23} /></span><div><h2 id="diagnostics-modal-title">AI Diagnostics</h2><p>CONV-MTR-01 · Investigation & human review</p></div><button className="master-icon-button" aria-label="Close diagnostics" onClick={onClose}><X size={23} /></button></header>
      <div className="master-modal-body custom-scrollbar">{open && children}</div>
      <footer className="master-modal-footer"><button className="master-button master-secondary" onClick={onClose}>Dismiss</button><button className="master-button master-primary" disabled={!canCreate} onClick={() => { const form = ref.current.querySelector('[data-task-form]'); form?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); form?.querySelector('input')?.focus({ preventScroll: true }); }}>Create Maintenance Task</button></footer>
    </div>
  </dialog>;
}
