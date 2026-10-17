import { useEffect, useRef, useState } from 'react';
import { Activity, Bell, BrainCircuit, ChartNoAxesCombined, ChevronLeft, Cpu, Factory, LayoutDashboard, Menu, Search, Settings, Wrench, X } from 'lucide-react';

const items = [
  ['dashboard', 'Dashboard', LayoutDashboard], ['alerts', 'Alerts', Bell],
  ['equipment', 'Machines', Factory], ['predictions', 'AI Diagnostics', BrainCircuit],
  ['maintenance', 'Maintenance', Wrench], ['analytics', 'Reports', ChartNoAxesCombined],
  ['amd-compute', 'AMD Inference', Cpu],
];

export default function ConsoleShell({ view, title, user, activeAlerts, connected, running, onNavigate, search, onSearch, children }) {
  const [compact, setCompact] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawer = useRef(null);
  const searchInput = useRef(null);
  useEffect(() => {
    if (mobileOpen) drawer.current?.showModal();
    else drawer.current?.close();
  }, [mobileOpen]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [mobileOpen]);
  useEffect(() => {
    const shortcut = event => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
      const field = searchInput.current?.getClientRects().length ? searchInput.current : document.querySelector('.master-inline-search input');
      if (field) { event.preventDefault(); field.focus(); }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);
  function navigate(next) { onNavigate(next); setMobileOpen(false); }
  function navigation(mobile = false) {
    return <>
      <div className="master-brand"><span className="master-brand-mark"><Factory size={23} strokeWidth={1.6} /></span><div><strong>ForgeMind<span> AI</span></strong><small>INDUSTRIAL IoT CONSOLE</small></div>{mobile && <button className="master-icon-button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={20} /></button>}</div>
      <p className="master-nav-label">WORKSPACE</p>
      <nav aria-label={mobile ? 'Mobile navigation' : 'Main navigation'}>{items.map(([id, label, Icon]) => <button key={id} className={`master-nav-item ${view === id ? 'is-active' : ''}`} aria-current={view === id ? 'page' : undefined} title={label} onClick={() => navigate(id)}><Icon size={19} strokeWidth={1.7} /><span>{label}</span>{id === 'alerts' && activeAlerts > 0 && <b>{activeAlerts}</b>}</button>)}</nav>
      <div className="master-sidebar-bottom"><div className="master-source"><Activity size={17} /><div><strong>Synthetic conveyor</strong><small>1 monitored machine</small></div></div><button className={`master-nav-item ${view === 'settings' ? 'is-active' : ''}`} title="Settings" onClick={() => navigate('settings')}><Settings size={19} /><span>Settings</span></button>{!mobile && <button className="master-collapse" onClick={() => setCompact(!compact)} aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}><ChevronLeft size={16} className={compact ? 'rotate-180' : ''} /><span>Collapse sidebar</span></button>}</div>
    </>;
  }
  return <div className={`master-console ${compact ? 'master-compact' : ''}`}>
    <a href="#console-content" className="master-skip">Skip to content</a>
    <aside className="master-sidebar">{navigation()}</aside>
    <dialog className="master-mobile-drawer" ref={drawer} onClose={() => setMobileOpen(false)} onClick={e => { if (e.target === drawer.current) setMobileOpen(false); }}><div className="master-mobile-navigation" onClick={e => e.stopPropagation()}>{navigation(true)}</div></dialog>
    <div className="master-workspace">
      <header className="master-header"><div className="master-breadcrumb"><button className="master-mobile-menu master-icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span>Workspace</span><span className="master-crumb-divider">/</span><strong>{title}</strong></div>
        <div className="master-header-actions"><label className="master-search"><Search size={16} /><input ref={searchInput} aria-label="Search machine or incidents" placeholder="Search machine or incidents…" value={search} onChange={e => { onSearch(e.target.value); if (view !== 'dashboard') navigate('dashboard'); }} /><kbd>/</kbd></label><span className={`master-connection ${connected ? running ? '' : 'is-paused' : 'is-offline'}`}><i />{connected ? running ? 'Monitoring active' : 'Monitoring paused' : 'Reconnecting'}</span><button className="master-account" onClick={() => navigate('settings')} title="Access settings"><span>{user?.role === 'admin' ? 'AD' : user ? 'TE' : 'RO'}</span><div><strong>{user ? user.role === 'admin' ? 'Administrator' : 'Technician' : 'Read-only access'}</strong><small>Local workspace</small></div></button></div>
      </header>
      <main id="console-content" className="master-content" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
