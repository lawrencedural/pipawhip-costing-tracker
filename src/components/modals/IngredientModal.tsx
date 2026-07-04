import { useMemo, useState } from 'react';
import type { InventoryItem, ProductIngredientInput } from '@/types';
import { php, ingrBatchCost } from '@/lib/calculations';

const UOM_OPTIONS = ['GRAMS', 'ML', 'PCS', 'KG', 'L', 'CAN', 'PACK', 'PC'];

interface IngredientModalProps {
  inventory: InventoryItem[];
  productId: string;
  batchSize: number;
  onClose: () => void;
  onSave: (values: ProductIngredientInput) => Promise<void>;
}

export default function IngredientModal({
  inventory,
  productId,
  batchSize,
  onClose,
  onSave,
}: IngredientModalProps) {
  const [selectedInvId, setSelectedInvId] = useState('');
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [pkgSize, setPkgSize] = useState('');
  const [pkgUom, setPkgUom] = useState('GRAMS');
  const [qty, setQty] = useState('');
  const [qtyUom, setQtyUom] = useState('GRAMS');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function fillFromInventory(id: string) {
    setSelectedInvId(id);
    if (!id) return;
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    setName(item.name);
    setUnitPrice(item.price.toString());
    setPkgSize(item.pkg_size.toString());
    setPkgUom(item.uom);
    setQtyUom(item.uom);
  }

  const preview = useMemo(() => {
    const price = parseFloat(unitPrice) || 0;
    const size = parseFloat(pkgSize) || 1;
    const q = parseFloat(qty) || 0;
    const batchCost = ingrBatchCost({ unit_price: price, pkg_size: size, qty: q });
    const tubCost = batchCost / (batchSize || 1);
    return { batchCost, tubCost };
  }, [unitPrice, pkgSize, qty, batchSize]);

  async function handleSave() {
    if (!name.trim()) {
      setErr('Enter ingredient name');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        product_id: productId,
        inventory_item_id: selectedInvId || null,
        name: name.trim(),
        unit_price: parseFloat(unitPrice) || 0,
        pkg_size: parseFloat(pkgSize) || 1,
        pkg_uom: pkgUom,
        qty: parseFloat(qty) || 0,
        qty_uom: qtyUom,
        note: note.trim(),
        sort_order: 0,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Ingredient to Recipe</div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {err && <div className="alert alert-error">{err}</div>}
          <div className="alert alert-info">💡 Select from inventory or enter manually. Cost is auto-calculated.</div>
          <div className="form-grid">
            <div className="form-group span2">
              <label>Select from Inventory (optional)</label>
              <select value={selectedInvId} onChange={(e) => fillFromInventory(e.target.value)}>
                <option value="">— Enter manually —</option>
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group span2">
              <label>Ingredient Name</label>
              <input
                type="text"
                placeholder="e.g. All Purpose Cream (Nestlé)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Unit Price (₱)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Package Size</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={pkgSize}
                onChange={(e) => setPkgSize(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Package UOM</label>
              <select value={pkgUom} onChange={(e) => setPkgUom(e.target.value)}>
                {UOM_OPTIONS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Qty Used per Batch</label>
              <input type="number" min={0} step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Qty UOM</label>
              <select value={qtyUom} onChange={(e) => setQtyUom(e.target.value)}>
                {UOM_OPTIONS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="form-group span2">
              <label>Calculation Note (optional)</label>
              <input
                type="text"
                placeholder="e.g. 4 packs × ₱72 per pack"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'var(--brand-lighter)',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Batch cost: <strong>{php(preview.batchCost)}</strong> &nbsp;·&nbsp; Cost/tub:{' '}
            <strong>{php(preview.tubCost)}</strong>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Adding...' : 'Add to Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}
