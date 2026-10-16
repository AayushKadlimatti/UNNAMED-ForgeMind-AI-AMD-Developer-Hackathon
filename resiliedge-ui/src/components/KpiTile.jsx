export default function KpiTile({ label, value, color }) {
  return (
    <div className="panel" style={{ flex: '1', minWidth: '140px' }}>
      <div className="panel-header">{label}</div>
      <div className={`big-number ${color || ''}`}>{value}</div>
    </div>
  );
}
