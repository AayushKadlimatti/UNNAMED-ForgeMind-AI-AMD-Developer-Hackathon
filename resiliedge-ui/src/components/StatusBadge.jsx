export default function StatusBadge({ status }) {
  const cls = `badge badge-severity-${status || 'healthy'}`;
  return <span className={cls}>{status || 'n/a'}</span>;
}
