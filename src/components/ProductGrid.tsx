import type { ProductWithIngredients } from '@/types';
import { calcProductCosts, marginBadgeClass, php } from '@/lib/calculations';

interface ProductGridProps {
  products: ProductWithIngredients[];
  loading: boolean;
  onOpen: (id: string) => void;
  onAddNew: () => void;
  onDelete: (product: ProductWithIngredients) => void;
}

export default function ProductGrid({ products, loading, onOpen, onAddNew, onDelete }: ProductGridProps) {
  if (loading) {
    return <div className="empty-state">Loading products...</div>;
  }

  return (
    <div className="product-grid">
      {products.map((p) => {
        const costs = calcProductCosts(p.ingredients, p.batch_size, p.selling_price, p.other_costs);
        return (
          <div key={p.id} className="product-card" onClick={() => onOpen(p.id)}>
            <button
              className="product-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(p);
              }}
            >
              ✕
            </button>
            <div className="product-emoji">{p.emoji || '🍨'}</div>
            <div className="product-name">{p.name}</div>
            <div className="product-size">
              {p.size || ''} · Batch: {p.batch_size}
            </div>
            <div className="product-meta">
              <div className="product-cost">{php(costs.totalCostPerTub)}/tub</div>
              <span className={`badge ${marginBadgeClass(costs.marginPct)}`}>
                {costs.marginPct.toFixed(1)}% margin
              </span>
            </div>
          </div>
        );
      })}
      <div className="product-card add-new" onClick={onAddNew}>
        <div style={{ fontSize: 32 }}>＋</div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>New Costing Sheet</div>
      </div>
    </div>
  );
}
