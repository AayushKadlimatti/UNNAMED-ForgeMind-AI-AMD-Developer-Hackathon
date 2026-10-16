import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Bell,
  HardDrive,
  Brain,
  Wrench,
  BarChart3,
  Settings,
  ChevronLeft,
  Search,
  RefreshCw,
  Activity,
  SlidersHorizontal,
  X,
  Server
} from 'lucide-react';

// Sidebar: 220px, collapsible to 64px, with Lucide icons (size=18, strokeWidth=1.75)
export function Sidebar({ activeView, onNavigate, collapsed, onToggle, alertsCount = 0 }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'amd-compute', label: 'Inference', icon: Cpu },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertsCount > 0 ? alertsCount : null },
    { id: 'equipment', label: 'Machines', icon: HardDrive },
    { id: 'predictions', label: 'AI Diagnostics', icon: Brain },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'analytics', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#111827] border-r border-[#2E3846] z-50 transition-all duration-200 flex flex-col ${
        collapsed ? 'w-16' : 'w-[220px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-[64px] px-4 border-b border-[#2E3846] flex items-center justify-between shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-[6px] bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center shrink-0 text-[#06B6D4]">
              <Activity size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-[#F9FAFB] leading-none truncate">
                ResiliEdge
              </h1>
              <p className="text-[11px] text-[#9CA3AF] mt-1 leading-none truncate">
                Operational continuity agent
              </p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-[6px] bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4]">
            <Activity size={18} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        {items.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium transition-colors control-btn ${
                isActive
                  ? 'sidebar-link-active'
                  : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} strokeWidth={1.75} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-[#EF4444] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold mono">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}

        {/* Settings button */}
        <button
          onClick={() => onNavigate('settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium text-[#9CA3AF] mt-auto hover:bg-[#1F2937] hover:text-[#F9FAFB] transition-colors control-btn"
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} strokeWidth={1.75} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-[#2E3846] shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[6px] text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937] transition-colors control-btn text-xs font-medium"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            size={16}
            strokeWidth={1.75}
            className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

// Header: Clean industrial 64px header with AMD compute branding & interactive RBAC toggle
export function Header({
  onRefresh,
  alertsCount = 0,
  userRole = 'ADMIN',
  onToggleRole,
  isSimulated = true,
  debugInfo = {},
}) {
  const [debugOpen, setDebugOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close debug popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setDebugOpen(false);
      }
    }
    if (debugOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [debugOpen]);

  return (
    <header className="h-[64px] bg-[#111827] border-b border-[#2E3846] flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Backend & Simulation Labelling */}
      <div className="flex items-center gap-3">
        {/* AMD Compute Indicator Badge: #ED1C24 */}
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#ED1C24]/10 border border-[#ED1C24]/40 text-[#ED1C24] text-xs font-bold font-mono tracking-wider shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#ED1C24] pulse-dot-regular" />
          <span>ROCm • AMD Instinct MI300X Engine</span>
        </span>

        {/* Simulated Telemetry Pill */}
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#1F2937] border border-[#2E3846] text-[#9CA3AF] text-xs font-medium">
          <Server size={14} strokeWidth={1.75} />
          <span>Simulated telemetry</span>
        </span>

        {/* Persistent SIMULATED DATA Tag */}
        {isSimulated && (
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-[4px] bg-[#1F2937] border border-[#2E3846] text-[#6B7280] text-[11px] font-mono uppercase tracking-wider">
            SIMULATED DATA
          </span>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-sm mx-6 hidden md:block">
        <div className="relative">
          <Search size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search telemetry, assets, logs..."
            className="w-full bg-[#0B0F19] border border-[#2E3846] rounded-[6px] pl-9 pr-10 py-1.5 text-xs text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-[#06B6D4] transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#6B7280] bg-[#1F2937] px-1.5 py-0.5 rounded font-mono">
            /
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Debug Popover & User Profile */}
      <div className="flex items-center gap-2">
        {/* Collapsed Debug Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setDebugOpen(!debugOpen)}
            className={`p-2 rounded-[6px] text-xs font-medium flex items-center gap-1.5 border transition-colors control-btn ${
              debugOpen
                ? 'bg-[#1F2937] border-[#06B6D4] text-[#06B6D4]'
                : 'bg-[#111827] border-[#2E3846] text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937]'
            }`}
            title="Open telemetry engine debug panel"
            aria-label="Debug Panel"
          >
            <SlidersHorizontal size={14} strokeWidth={1.75} />
            <span className="hidden sm:inline text-xs">Debug</span>
          </button>

          {/* Popover content */}
          {debugOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#111827] border border-[#2E3846] rounded-[8px] p-3 shadow-xl z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#2E3846] mb-2.5">
                <span className="font-semibold text-[#F9FAFB]">Pipeline Diagnostics</span>
                <button
                  onClick={() => setDebugOpen(false)}
                  className="text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2 text-[#9CA3AF]">
                <div className="flex items-center justify-between">
                  <span>Backend Host</span>
                  <span className="font-mono text-[#F9FAFB]">127.0.0.1:8000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Polling Engine</span>
                  <span className="font-mono text-[#10B981]">1.5s Interval Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>WebSocket Stream</span>
                  <span className="font-mono text-[#06B6D4]">
                    {debugInfo.wsStatus || 'WS STREAM LIVE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Streamed Ticks</span>
                  <span className="font-mono text-[#F9FAFB]">{debugInfo.tickCount ?? 0} ticks</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Scenario</span>
                  <span className="font-mono uppercase text-[#F9FAFB]">
                    {debugInfo.scenario || 'normal'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-[6px] text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937] transition-colors control-btn"
          title="Refresh telemetry"
          aria-label="Refresh"
        >
          <RefreshCw size={16} strokeWidth={1.75} />
        </button>

        {/* Alerts Pill */}
        <div className="relative">
          <button
            className="p-2 rounded-[6px] text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937] transition-colors relative control-btn"
            title={`${alertsCount} active alerts`}
            aria-label="Alerts"
          >
            <Bell size={16} strokeWidth={1.75} />
            {alertsCount > 0 && (
              <span className="absolute 1.5 top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#EF4444] text-[9px] font-bold text-white flex items-center justify-center">
                {alertsCount}
              </span>
            )}
          </button>
        </div>

        {/* Interactive RBAC Toggle: ROLE: ADMIN vs ROLE: TECH */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#2E3846]">
          <button
            onClick={onToggleRole}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs font-mono font-bold border transition-all cursor-pointer control-btn ${
              userRole === 'ADMIN'
                ? 'bg-[#06B6D4]/15 border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4]/25 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/25 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
            }`}
            title={`Current: ROLE: ${userRole}. Click to toggle RBAC permissions.`}
            aria-label={`Toggle user role, current role is ${userRole}`}
          >
            <div
              className={`w-4 h-4 rounded-[3px] flex items-center justify-center font-bold text-[9px] ${
                userRole === 'ADMIN' ? 'bg-[#06B6D4] text-[#0B0F19]' : 'bg-[#F59E0B] text-[#0B0F19]'
              }`}
            >
              {userRole === 'ADMIN' ? 'AD' : 'TC'}
            </div>
            <span>ROLE: {userRole}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
