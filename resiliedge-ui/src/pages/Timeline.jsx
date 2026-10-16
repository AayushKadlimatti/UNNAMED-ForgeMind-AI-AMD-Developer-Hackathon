import { useState, useEffect } from 'react';
import { getTimeline } from '../api/index.js';

const EVENT_LABELS = {
  scenario: 'Scenario Triggered',
  anomaly: 'Anomaly Detected',
  diagnosis: 'Diagnosis Returned',
  inventory: 'Part Verified',
  'work-order': 'Work Order Created',
};

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const poll = () => {
      Promise.resolve(getTimeline()).then(data => {
        if (mounted) { setEvents(data); setLoading(false); }
      });
    };

    poll();
    const handle = setInterval(poll, 2000);
    return () => { mounted = false; clearInterval(handle); };
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state"><div className="loading-spinner" /> Loading timeline…</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
        Pipeline Event Timeline
      </h2>

      {events.length === 0 ? (
        <div className="empty-state">
          No events yet. Run the demo scenario from the Overview page to see the pipeline in action.
        </div>
      ) : (
        <div className="timeline-list">
          {events.map((ev, i) => (
            <div key={i} className={`timeline-item ${ev.event || ''}`}>
              <div className="timeline-dot" />
              <div className="timeline-time">
                {new Date(ev.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="timeline-title">
                {EVENT_LABELS[ev.event] || ev.event}
                {ev.pump_id && (
                  <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>
                    {ev.pump_id}
                  </span>
                )}
              </div>
              <div className="timeline-detail">{ev.detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
