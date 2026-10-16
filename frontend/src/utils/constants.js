import {
  Activity, AlertTriangle, BarChart3, Bell, Brain, Calendar,
  ChevronDown, ChevronRight, Clock, Cpu, Database, Droplets,
  Eye, Filter, Gauge, Heart, Home, Layers, LifeBuoy,
  LineChart, Menu, Monitor, MoreVertical, PieChart, RefreshCw,
  Search, Settings, Shield, Sliders, Target, Thermometer,
  TrendingDown, TrendingUp, Wrench, X, Zap, ArrowUpRight,
  ArrowDownRight, CheckCircle2, XCircle, AlertOctagon,
  ChevronLeft, Info, Volume2, Waves, Package, Cog,
  Factory, HardDrive, CircuitBoard
} from 'lucide-react';

// Status configuration
export const STATUS_CONFIG = {
  healthy: {
    label: 'Healthy',
    color: '#10B981',
    bgColor: 'bg-industrial-success/10',
    borderColor: 'border-industrial-success/30',
    textColor: 'text-industrial-success',
    icon: CheckCircle2,
    glow: 'glow-green',
  },
  warning: {
    label: 'Warning',
    color: '#F59E0B',
    bgColor: 'bg-industrial-warning/10',
    borderColor: 'border-industrial-warning/30',
    textColor: 'text-industrial-warning',
    icon: AlertTriangle,
    glow: 'glow-amber',
  },
  critical: {
    label: 'Critical',
    color: '#EF4444',
    bgColor: 'bg-industrial-critical/10',
    borderColor: 'border-industrial-critical/30',
    textColor: 'text-industrial-critical',
    icon: AlertOctagon,
    glow: 'glow-red',
  },
  maintenance: {
    label: 'Maintenance',
    color: '#00F0FF',
    bgColor: 'bg-industrial-accent/10',
    borderColor: 'border-industrial-accent/30',
    textColor: 'text-industrial-accent',
    icon: Wrench,
    glow: 'glow-cyan',
  },
};

export const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    color: '#EF4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
  },
  warning: {
    label: 'Warning',
    color: '#F59E0B',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
  },
  info: {
    label: 'Info',
    color: '#00F0FF',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
  },
};

// Navigation items
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'equipment', label: 'Equipment', icon: HardDrive },
  { id: 'predictions', label: 'Predictions', icon: Brain },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

// Re-export icons for use
export {
  Activity, AlertTriangle, BarChart3, Bell, Brain, Calendar,
  ChevronDown, ChevronRight, Clock, Cpu, Database, Droplets,
  Eye, Filter, Gauge, Heart, Home, Layers, LifeBuoy,
  LineChart, Menu, Monitor, MoreVertical, PieChart, RefreshCw,
  Search, Settings, Shield, Sliders, Target, Thermometer,
  TrendingDown, TrendingUp, Wrench, X, Zap, ArrowUpRight,
  ArrowDownRight, CheckCircle2, XCircle, AlertOctagon,
  ChevronLeft, Info, Volume2, Waves, Package, Cog,
  Factory, HardDrive, CircuitBoard
};
