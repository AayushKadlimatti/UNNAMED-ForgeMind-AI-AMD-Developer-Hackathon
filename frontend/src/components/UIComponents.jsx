import { STATUS_CONFIG, SEVERITY_CONFIG, ArrowUpRight, ArrowDownRight, MoreVertical, Eye } from '../utils/constants';

// Stat card with icon, value, trend
export function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'cyan', className = '' }) {
  const colorMap = {
    cyan: { border: 'border-industrial-accent/20', glow: 'hover:shadow-glow-cyan', iconBg: 'bg-industrial-accent/10', iconColor: 'text-industrial-accent' },
    red: { border: 'border-industrial-critical/20', glow: 'hover:shadow-glow-red', iconBg: 'bg-industrial-critical/10', iconColor: 'text-industrial-critical' },
    amber: { border: 'border-industrial-warning/20', glow: 'hover:shadow-glow-amber', iconBg: 'bg-industrial-warning/10', iconColor: 'text-industrial-warning' },
    green: { border: 'border-industrial-success/20', glow: 'hover:shadow-glow-green', iconBg: 'bg-industrial-success/10', iconColor: 'text-industrial-success' },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <div className={`bg-industrial-800 border ${c.border} rounded-xl p-5 card-hover ${c.glow} transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-industrial-success' : 'text-industrial-critical'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500">{title}</div>
      {subtitle && <div className="text-[11px] text-gray-600 mt-1">{subtitle}</div>}
    </div>
  );
}

// Status badge
export function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor} ${sizeClasses[size]}`}>
      <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {config.label}
    </span>
  );
}

// Severity badge
export function SeverityBadge({ severity, size = 'sm' }) {
  const config = SEVERITY_CONFIG[severity];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center rounded-full font-medium text-xs px-2 py-1 ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
      {config.label}
    </span>
  );
}

// Health score gauge
export function HealthGauge({ score, size = 'md', showLabel = true }) {
  const radius = size === 'lg' ? 52 : size === 'md' ? 40 : 28;
  const stroke = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const svgSize = (radius + stroke) * 2;

  const color = score >= 85 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const glowColor = score >= 85 ? 'rgba(16,185,129,0.3)' : score >= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="#21262D"
          strokeWidth={stroke}
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})`, transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'}`} style={{ color }}>
            {score}
          </span>
          {size !== 'sm' && <span className="text-[10px] text-gray-500">Health</span>}
        </div>
      )}
    </div>
  );
}

// Progress bar
export function ProgressBar({ value, max = 100, color = '#00F0FF', height = 'h-2', showLabel = false, label = '' }) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">{label}</span>
          <span className="text-xs font-mono text-gray-300">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full ${height} bg-industrial-700 rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

// Equipment card
export function EquipmentCard({ equipment, onClick }) {
  const statusConfig = STATUS_CONFIG[equipment.status];

  return (
    <div
      onClick={() => onClick?.(equipment)}
      className={`bg-industrial-800 border border-industrial-700 rounded-xl p-4 card-hover cursor-pointer group animate-fade-in`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{equipment.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{equipment.id} · {equipment.location}</p>
        </div>
        <StatusBadge status={equipment.status} size="xs" />
      </div>

      <div className="mb-3">
        <HealthGauge score={equipment.healthScore} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-industrial-900/50 rounded-lg px-2 py-1.5">
          <span className="text-gray-500 block text-[10px]">Temp</span>
          <span className={`font-mono font-medium ${equipment.temperature > 95 ? 'text-industrial-critical' : 'text-gray-300'}`}>
            {equipment.temperature}°C
          </span>
        </div>
        <div className="bg-industrial-900/50 rounded-lg px-2 py-1.5">
          <span className="text-gray-500 block text-[10px]">Vibration</span>
          <span className={`font-mono font-medium ${equipment.vibration > 4 ? 'text-industrial-warning' : 'text-gray-300'}`}>
            {equipment.vibration} mm/s
          </span>
        </div>
        <div className="bg-industrial-900/50 rounded-lg px-2 py-1.5">
          <span className="text-gray-500 block text-[10px]">RPM</span>
          <span className="font-mono font-medium text-gray-300">{equipment.rpm}</span>
        </div>
        <div className="bg-industrial-900/50 rounded-lg px-2 py-1.5">
          <span className="text-gray-500 block text-[10px]">Pressure</span>
          <span className="font-mono font-medium text-gray-300">{equipment.pressure} PSI</span>
        </div>
      </div>

      {equipment.predictedFailure && (
        <div className="mt-3 bg-industrial-critical/5 border border-industrial-critical/20 rounded-lg px-3 py-2">
          <p className="text-[11px] text-industrial-critical font-medium">⚠ {equipment.predictedFailure}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Est. {equipment.daysToFailure} days to failure</p>
        </div>
      )}
    </div>
  );
}

// Alert row
export function AlertRow({ alert, onAcknowledge }) {
  const sevConfig = SEVERITY_CONFIG[alert.severity];

  return (
    <div className={`flex items-center gap-4 px-4 py-3 border-b border-industrial-700/50 hover:bg-industrial-700/20 transition-colors group ${
      alert.acknowledged ? 'opacity-60' : ''
    }`}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        alert.severity === 'critical' ? 'bg-industrial-critical animate-pulse' :
        alert.severity === 'warning' ? 'bg-industrial-warning' :
        'bg-industrial-accent'
      }`} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 truncate">{alert.message}</p>
        <p className="text-xs text-gray-500 mt-0.5">{alert.equipmentName} · {alert.location}</p>
      </div>

      <span className="text-xs text-gray-600 whitespace-nowrap">{alert.timeAgo}</span>

      <SeverityBadge severity={alert.severity} />

      {!alert.acknowledged && (
        <button
          onClick={(e) => { e.stopPropagation(); onAcknowledge?.(alert.id); }}
          className="opacity-0 group-hover:opacity-100 text-xs text-industrial-accent hover:text-white bg-industrial-accent/10 hover:bg-industrial-accent/20 px-2 py-1 rounded transition-all"
        >
          Acknowledge
        </button>
      )}
    </div>
  );
}

// Empty/Loading states
export function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizeClasses[size]} border-2 border-industrial-700 border-t-industrial-accent rounded-full animate-spin`} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="w-12 h-12 text-gray-700 mb-4" />}
      <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-600 max-w-sm">{description}</p>}
    </div>
  );
}
