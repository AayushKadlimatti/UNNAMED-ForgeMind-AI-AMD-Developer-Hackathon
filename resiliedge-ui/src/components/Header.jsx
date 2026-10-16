import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { isMock } from '../api/index.js';

export default function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="header-logo">⚙ ResiliEdge</Link>
        <nav className="header-nav">
          <NavLink to="/" end>Overview</NavLink>
          <NavLink to="/burst">Burst Test</NavLink>
          <NavLink to="/timeline">Timeline</NavLink>
        </nav>
      </div>
      <div className="header-right">
        <span className={`badge ${isMock ? 'badge-mock' : 'badge-live'}`}>
          {isMock ? 'MOCK DATA' : 'LIVE'}
        </span>
        <span className="header-clock">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </header>
  );
}
