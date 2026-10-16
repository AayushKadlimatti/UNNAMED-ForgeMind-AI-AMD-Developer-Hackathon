import { useState, useMemo } from 'react';
import { EquipmentCard, StatusBadge, HealthGauge, ProgressBar } from '../components/UIComponents';
import { useEquipment } from '../hooks/useMockData';
import {
  Search, Filter, ChevronDown, Gauge, Thermometer, Activity, Wrench,
  HardDrive, Eye, Clock, ArrowUpRight
} from '../utils/constants';
import { STATUS_CONFIG } from '../utils/constants';

export default function EquipmentView({ onSelectEquipment }) {
  const { data: equipment, refresh } = useEquipment(12);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | table
  const [sortBy, setSortBy] = useState('healthScore');

  const filteredEquipment = useMemo(() => {
    let filtered = equipment;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'healthScore') return a.healthScore - b.healthScore;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'temperature') return b.temperature - a.temperature;
      return 0;
    });

    return filtered;
  }, [equipment, filterStatus, searchQuery, sortBy]);

  const statusCounts = useMemo(() => {
    const counts = { all: equipment.length, healthy: 0, warning: 0, critical: 0, maintenance: 0 };
    equipment.forEach(e => counts[e.status]++);
    return counts;
  }, [equipment]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Equipment Fleet</h2>
          <p className="text-sm text-gray-500 mt-1">{equipment.length} assets tracked across all locations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="px-3 py-2 bg-industrial-800 border border-industrial-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
          >
            {viewMode === 'grid' ? '☰ Table' : '⊞ Grid'}
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, location..."
            className="w-full bg-industrial-800 border border-industrial-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-industrial-accent/50 transition-all"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5">
          {['all', 'healthy', 'warning', 'critical', 'maintenance'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === status
                  ? status === 'all'
                    ? 'bg-industrial-accent/10 text-industrial-accent border border-industrial-accent/30'
                    : `${STATUS_CONFIG[status]?.bgColor} ${STATUS_CONFIG[status]?.textColor} border ${STATUS_CONFIG[status]?.borderColor}`
                  : 'bg-industrial-800 text-gray-500 border border-industrial-700 hover:text-gray-300'
              }`}
            >
              {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-industrial-800 border border-industrial-700 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-industrial-accent/50"
        >
          <option value="healthScore">Sort: Health Score</option>
          <option value="name">Sort: Name</option>
          <option value="temperature">Sort: Temperature</option>
        </select>
      </div>

      {/* Equipment grid or table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEquipment.map(eq => (
            <EquipmentCard key={eq.id} equipment={eq} onClick={onSelectEquipment} />
          ))}
        </div>
      ) : (
        <div className="bg-industrial-800 border border-industrial-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-industrial-700">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Equipment</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Health</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Temp (°C)</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Vibration</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">RPM</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Location</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map(eq => (
                  <tr
                    key={eq.id}
                    className="border-b border-industrial-700/50 hover:bg-industrial-700/20 transition-colors cursor-pointer"
                    onClick={() => onSelectEquipment?.(eq)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-200">{eq.name}</p>
                        <p className="text-xs text-gray-500">{eq.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={eq.status} size="xs" /></td>
                    <td className="px-4 py-3 text-center">
                      <HealthGauge score={eq.healthScore} size="sm" showLabel={true} />
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-sm ${eq.temperature > 95 ? 'text-industrial-critical' : 'text-gray-300'}`}>
                      {eq.temperature}°
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-sm ${eq.vibration > 4 ? 'text-industrial-warning' : 'text-gray-300'}`}>
                      {eq.vibration}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-300">{eq.rpm}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{eq.location}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1.5 rounded-lg text-gray-500 hover:text-industrial-accent hover:bg-industrial-accent/10 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <HardDrive className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-sm text-gray-400">No equipment matches your filters</p>
          <button onClick={() => { setFilterStatus('all'); setSearchQuery(''); }} className="text-xs text-industrial-accent mt-2 hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
