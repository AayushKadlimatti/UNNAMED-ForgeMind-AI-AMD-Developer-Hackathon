import { useState, useMemo } from 'react';
import { AlertRow, SeverityBadge } from '../components/UIComponents';
import { useAlerts } from '../hooks/useMockData';
import {
  Bell, Filter, Search, AlertTriangle, AlertOctagon, Info,
  CheckCircle2, Clock, X
} from '../utils/constants';
import { SEVERITY_CONFIG } from '../utils/constants';

export default function AlertsView({ alerts: propAlerts }) {
  const { data: mockAlerts } = useAlerts(30);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterAck, setFilterAck] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set());

  const handleAcknowledge = (id) => {
    setAcknowledgedIds(prev => new Set([...prev, id]));
  };

  const handleAcknowledgeAll = () => {
    setAcknowledgedIds(new Set(processedAlerts.map(a => a.id)));
  };

  const combinedAlerts = useMemo(() => {
    if (!propAlerts || propAlerts.length === 0) return mockAlerts;
    const formattedPropAlerts = propAlerts.map(a => ({
      id: a.id,
      equipmentId: a.machine_id || 'CONV-MTR-01',
      equipmentName: 'Conveyor Drive Motor (CONV-MTR-01)',
      location: 'Production Line 1, Main Pulley',
      severity: a.severity || 'warning',
      message: a.description || a.title,
      timestamp: a.timestamp || new Date().toISOString(),
      acknowledged: a.acknowledged || false,
    }));
    return [...formattedPropAlerts, ...mockAlerts];
  }, [propAlerts, mockAlerts]);

  const processedAlerts = useMemo(() => {
    return combinedAlerts.map(a => ({
      ...a,
      acknowledged: a.acknowledged || acknowledgedIds.has(a.id),
    }));
  }, [combinedAlerts, acknowledgedIds]);

  const filteredAlerts = useMemo(() => {
    let filtered = processedAlerts;

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(a => a.severity === filterSeverity);
    }

    if (filterAck === 'unacknowledged') {
      filtered = filtered.filter(a => !a.acknowledged);
    } else if (filterAck === 'acknowledged') {
      filtered = filtered.filter(a => a.acknowledged);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.message.toLowerCase().includes(q) ||
        a.equipmentName.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [processedAlerts, filterSeverity, filterAck, searchQuery]);

  const severityCounts = useMemo(() => {
    const counts = { all: processedAlerts.length, critical: 0, warning: 0, info: 0 };
    processedAlerts.forEach(a => counts[a.severity]++);
    return counts;
  }, [processedAlerts]);

  const unackCount = processedAlerts.filter(a => !a.acknowledged).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Alert Center</h2>
          <p className="text-sm text-gray-500 mt-1">
            {unackCount} unacknowledged of {processedAlerts.length} total alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAcknowledgeAll}
            disabled={unackCount === 0}
            className="px-3 py-2 bg-industrial-accent/10 border border-industrial-accent/20 text-industrial-accent text-xs font-medium rounded-lg hover:bg-industrial-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3 h-3 inline mr-1.5" />
            Acknowledge All
          </button>
          <button
            onClick={refresh}
            className="px-3 py-2 bg-industrial-800 border border-industrial-700 text-gray-400 text-xs rounded-lg hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { severity: 'all', label: 'Total', icon: Bell, color: '#00F0FF' },
          { severity: 'critical', label: 'Critical', icon: AlertOctagon, color: '#EF4444' },
          { severity: 'warning', label: 'Warning', icon: AlertTriangle, color: '#F59E0B' },
          { severity: 'info', label: 'Informational', icon: Info, color: '#00F0FF' },
        ].map(({ severity, label, icon: Icon, color }) => (
          <button
            key={severity}
            onClick={() => setFilterSeverity(severity)}
            className={`bg-industrial-800 border rounded-xl p-4 text-left transition-all card-hover ${
              filterSeverity === severity ? 'border-[--accent]' : 'border-industrial-700'
            }`}
            style={{ '--accent': `${color}40` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color }}>{severityCounts[severity]}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="w-full bg-industrial-800 border border-industrial-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-industrial-accent/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['all', 'unacknowledged', 'acknowledged'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterAck(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterAck === status
                  ? 'bg-industrial-accent/10 text-industrial-accent border border-industrial-accent/30'
                  : 'bg-industrial-800 text-gray-500 border border-industrial-700 hover:text-gray-300'
              }`}
            >
              {status === 'all' ? 'All' : status === 'unacknowledged' ? 'Unacknowledged' : 'Acknowledged'}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div className="bg-industrial-800 border border-industrial-700 rounded-xl overflow-hidden">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-sm text-gray-400">No alerts match your filters</p>
            <button
              onClick={() => { setFilterSeverity('all'); setFilterAck('all'); setSearchQuery(''); }}
              className="text-xs text-industrial-accent mt-2 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
