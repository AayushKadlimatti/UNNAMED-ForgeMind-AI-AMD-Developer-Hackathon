import { useState, useMemo } from 'react';
import { StatusBadge } from '../components/UIComponents';
import { useMaintenanceSchedule } from '../hooks/useMockData';
import {
  Wrench, Calendar, Clock, Filter, Search, CheckCircle2,
  AlertTriangle, ChevronRight, Target
} from '../utils/constants';

export default function MaintenanceView() {
  const { data: schedule, refresh } = useMaintenanceSchedule();
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const filteredSchedule = useMemo(() => {
    let filtered = schedule;
    if (filterType !== 'all') filtered = filtered.filter(s => s.type === filterType);
    if (filterPriority !== 'all') filtered = filtered.filter(s => s.priority === filterPriority);
    return filtered;
  }, [schedule, filterType, filterPriority]);

  const getPriorityColor = (priority) => {
    const colors = { Critical: '#EF4444', High: '#F59E0B', Medium: '#00F0FF', Low: '#10B981' };
    return colors[priority] || '#00F0FF';
  };

  const getStatusStyle = (status) => {
    if (status === 'Overdue') return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (status === 'Today') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  };

  const overdue = schedule.filter(s => s.status === 'Overdue').length;
  const today = schedule.filter(s => s.status === 'Today').length;
  const upcoming = schedule.filter(s => s.status === 'Scheduled').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Maintenance Scheduler</h2>
          <p className="text-sm text-gray-500 mt-1">AI-optimized maintenance work orders & scheduling</p>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-2 bg-industrial-accent/10 border border-industrial-accent/20 text-industrial-accent text-xs font-medium rounded-lg hover:bg-industrial-accent/20 transition-colors"
        >
          <Calendar className="w-3 h-3 inline mr-1.5" />
          Generate Schedule
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-industrial-800 border border-industrial-critical/20 rounded-xl p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-industrial-critical" />
            <span className="text-xs text-gray-500">Overdue</span>
          </div>
          <div className="text-3xl font-bold text-industrial-critical">{overdue}</div>
          <p className="text-[10px] text-gray-600 mt-1">Work orders past due date</p>
        </div>
        <div className="bg-industrial-800 border border-industrial-warning/20 rounded-xl p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-industrial-warning" />
            <span className="text-xs text-gray-500">Due Today</span>
          </div>
          <div className="text-3xl font-bold text-industrial-warning">{today}</div>
          <p className="text-[10px] text-gray-600 mt-1">Scheduled for today</p>
        </div>
        <div className="bg-industrial-800 border border-industrial-accent/20 rounded-xl p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-industrial-accent" />
            <span className="text-xs text-gray-500">Upcoming</span>
          </div>
          <div className="text-3xl font-bold text-industrial-accent">{upcoming}</div>
          <p className="text-[10px] text-gray-600 mt-1">Scheduled work orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 mr-1">Type:</span>
          {['all', 'Preventive', 'Predictive', 'Corrective', 'Inspection'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                filterType === type
                  ? 'bg-industrial-accent/10 text-industrial-accent border border-industrial-accent/30'
                  : 'bg-industrial-800 text-gray-500 border border-industrial-700 hover:text-gray-300'
              }`}
            >
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 mr-1">Priority:</span>
          {['all', 'Critical', 'High', 'Medium', 'Low'].map(priority => (
            <button
              key={priority}
              onClick={() => setFilterPriority(priority)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                filterPriority === priority
                  ? 'bg-industrial-accent/10 text-industrial-accent border border-industrial-accent/30'
                  : 'bg-industrial-800 text-gray-500 border border-industrial-700 hover:text-gray-300'
              }`}
            >
              {priority === 'all' ? 'All' : priority}
            </button>
          ))}
        </div>
      </div>

      {/* Work orders */}
      <div className="space-y-3">
        {filteredSchedule.map(wo => (
          <div
            key={wo.id}
            className="bg-industrial-800 border border-industrial-700 rounded-xl p-5 card-hover"
          >
            <div className="flex items-start gap-4">
              {/* Priority indicator */}
              <div
                className="w-1 h-full min-h-[60px] rounded-full shrink-0"
                style={{ backgroundColor: getPriorityColor(wo.priority) }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-200">{wo.id}</h4>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusStyle(wo.status)}`}>
                    {wo.status}
                  </span>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${getPriorityColor(wo.priority)}15`,
                      color: getPriorityColor(wo.priority),
                      border: `1px solid ${getPriorityColor(wo.priority)}30`,
                    }}
                  >
                    {wo.priority}
                  </span>
                </div>
                
                <p className="text-xs text-gray-400 mb-2">{wo.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    {wo.equipmentName} ({wo.equipmentId})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {wo.scheduledDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Est. {wo.estimatedDuration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {wo.assignee}
                  </span>
                  <span>{wo.location}</span>
                </div>
              </div>

              {/* Type badge */}
              <span className={`text-[10px] font-medium px-2 py-1 rounded-lg shrink-0 ${
                wo.type === 'Predictive' ? 'bg-cyan-500/10 text-cyan-400' :
                wo.type === 'Preventive' ? 'bg-green-500/10 text-green-400' :
                wo.type === 'Corrective' ? 'bg-red-500/10 text-red-400' :
                'bg-gray-500/10 text-gray-400'
              }`}>
                {wo.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredSchedule.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-sm text-gray-400">No work orders match your filters</p>
        </div>
      )}
    </div>
  );
}
