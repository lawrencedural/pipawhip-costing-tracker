import { useEffect, useState } from 'react';
import type { InventoryItem, ProductWithIngredients } from '@/types';
import { calcProductCosts, ingrBatchCost, php } from '@/lib/calculations';
import IngredientModal from './modals/IngredientModal';

interface ProductDetailProps {
  product: ProductWithIngredients;
  inventory: InventoryItem[];
  onBack: () => void;
  onSavePricing: (patch: {
    batch_size: number;
    selling_price: number;
    other_costs: number;
  }) => Promise<void>;
  onAddIngredient: Parameters<typeof IngredientModal>[0]['onSave'];
  onUpdateIngredientQty: (ingredientId: string, qty: number) => Promise<void>;
  onRemoveIngredient: (ingredientId: string) => Promise<void>;
}

export default function ProductDetail({
  product,
  inventory,
  onBack,
  onSavePricing,
  onAddIngredient,
  onUpdateIngredientQty,
  onRemoveIngredient,
}: ProductDetailProps) {
  const [batchSize, setBatchSize] = useState(product.batch_size.toString());
  const [sellingPrice, setSellingPrice] = useState(product.selling_price.toString());
  const [otherCosts, setOtherCosts] = useState(product.other_costs.toString());
  const [ingrModalOpen, setIngrModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBatchSize(product.batch_size.toString());
    setSellingPrice(product.selling_price.toString());
    setOtherCosts(product.other_costs.toString());
  }, [product.id]);

  const batch = parseFloat(batchSize) || 1;
  const sell = parseFloat(sellingPrice) || 0;
  const other = parseFloat(otherCosts) || 0;
  const costs = calcProductCosts(product.ingredients, batch, sell, other);

  async function handleSave() {
    setSaving(true);
    try {
      await onSavePricing({
        batch_size: parseFloat(batchSize) || 1,
        selling_price: parseFloat(sellingPrice) || 0,
        other_costs: parseFloat(otherCosts) || 0,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="detail-view open">
      <button className="back-btn" onClick={onBack}>
        ← Back to Products
      </button>
      <div className="page-header">
        <div className="page-title">
          {product.emoji} {product.name}
        </div>
        <div className="page-sub">{product.size}</div>
      </div>

      <div className="pricing-row">
        <div className="form-group">
          <label>Batch Size (tubs)</label>
          <input type="number" min={1} value={batchSize} onChange={(e) => setBatchSize(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Selling Price / tub (₱)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Other Costs / tub (₱)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={otherCosts}
            onChange={(e) => setOtherCosts(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="summary-strip">
        <div className="summary-item">
          <div className="summary-item-label">Ingredient Cost/tub</div>
          <div className="summary-item-val">{php(costs.ingredientCostPerTub)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-item-label">Total Cost/tub</div>
          <div className="summary-item-val">{php(costs.totalCostPerTub)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-item-label">Selling Price</div>
          <div className="summary-item-val">{php(costs.sellingPrice)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-item-label">Gross Profit</div>
          <div
            className="summary-item-val"
            style={{ color: costs.grossProfit >= 0 ? '#a8f0c6' : '#ffb3b3' }}
          >
            {php(costs.grossProfit)}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-item-label">Margin %</div>
          <div
            className="summary-item-val"
            style={{
              color: costs.marginPct >= 20 ? '#a8f0c6' : costs.marginPct >= 10 ? '#FFE08A' : '#ffb3b3',
            }}
          >
            {costs.marginPct.toFixed(1)}%
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-item-label">Break-even</div>
          <div className="summary-item-val">{php(costs.totalCostPerTub)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Ingredients</span>
          <button className="btn btn-sm btn-primary" onClick={() => setIngrModalOpen(true)}>
            + Add Ingredient
          </button>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th className="td-num">Unit Price (₱)</th>
                <th className="td-num">Pkg Size</th>
                <th>UOM</th>
                <th className="td-num">Qty Used (batch)</th>
                <th>UOM</th>
                <th className="td-num">Batch Cost (₱)</th>
                <th className="td-num">Cost/Tub (₱)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {product.ingredients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    No ingredients yet
                  </td>
                </tr>
              ) : (
                product.ingredients.map((ingr) => {
                  const bCost = ingrBatchCost(ingr);
                  const tCost = bCost / batch;
                  return (
                    <tr key={ingr.id} className="ingr-row">
                      <td>{ingr.name}</td>
                      <td className="td-num">{php(ingr.unit_price)}</td>
                      <td className="td-num">{ingr.pkg_size}</td>
                      <td>{ingr.pkg_uom}</td>
                      <td className="td-num">
                        <input
                          type="number"
                          defaultValue={ingr.qty}
                          min={0}
                          step="0.01"
                          style={{ width: 70 }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val !== ingr.qty) onUpdateIngredientQty(ingr.id, val);
                          }}
                        />
                      </td>
                      <td>{ingr.qty_uom}</td>
                      <td className="td-num cost-cell">{php(bCost)}</td>
                      <td className="td-num cost-cell">{php(tCost)}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => onRemoveIngredient(ingr.id)}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={6} style={{ color: 'var(--text2)' }}>
                  TOTAL INGREDIENT COST
                </td>
                <td className="td-num cost-cell">{php(costs.batchTotal)}</td>
                <td className="td-num cost-cell">{php(costs.ingredientCostPerTub)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {ingrModalOpen && (
        <IngredientModal
          inventory={inventory}
          productId={product.id}
          batchSize={batch}
          onClose={() => setIngrModalOpen(false)}
          onSave={async (values) => {
            await onAddIngredient(values);
            setIngrModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
