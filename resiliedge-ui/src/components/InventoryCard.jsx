/**
 * Inventory card showing SKU, bay, and stock status.
 * @param {{ inventory: import('../api/schema.js').Inventory }} props
 */
export default function InventoryCard({ inventory }) {
  const { sku, bay, in_stock } = inventory;
  const hasData = !!bay;

  if (!hasData) {
    return (
      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 'var(--space-md)' }}>
        Awaiting inventory lookup…
      </div>
    );
  }

  return (
    <div>
      <div className="field-row">
        <span className="field-label">SKU</span>
        <span className="field-value">{sku || 'n/a'}</span>
      </div>
      <div className="field-row">
        <span className="field-label">Bay</span>
        <span className="field-value">{bay || 'n/a'}</span>
      </div>
      <div className="field-row">
        <span className="field-label">In Stock</span>
        <span style={{ color: in_stock ? 'var(--status-healthy)' : 'var(--status-critical)', fontWeight: 600 }}>
          {in_stock ? '● IN STOCK' : '○ OUT OF STOCK'}
        </span>
      </div>
    </div>
  );
}
