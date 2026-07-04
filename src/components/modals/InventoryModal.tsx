import { useState } from 'react';
import type { InventoryItem, InventoryItemInput } from '@/types';

interface InventoryModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (values: InventoryItemInput) => Promise<void>;
}

const UOM_OPTIONS = ['GRAMS', 'ML', 'PCS', 'KG', 'L', 'CAN', 'PACK', 'PC', 'BUNCH'];

export default function InventoryModal({ item, onClose, onSave }: InventoryModalProps) {
  const [name, setName] = useState(item?.name ?? '');
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [vendor, setVendor] = useState(item?.vendor ?? '');
  const [price, setPrice] = useState(item?.price?.toString() ?? '');
  const [pkgSize, setPkgSize] = useState(item?.pkg_size?.toString() ?? '');
  const [uom, setUom] = useState(item?.uom ?? 'GRAMS');
  const [stock, setStock] = useState(item?.stock?.toString() ?? '0');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setErr('Please enter a name');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        name: name.trim(),
        brand: brand.trim(),
        vendor: vendor.trim(),
        price: parseFloat(price) || 0,
        pkg_size: parseFloat(pkgSize) || 1,
        uom,
        stock: parseInt(stock, 10) || 0,
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
          <div className="modal-title">{item ? 'Edit Ingredient' : 'Add Ingredient'}</div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {err && <div className="alert alert-error">{err}</div>}
          <div className="form-grid">
            <div className="form-group span2">
              <label>Ingredient / Product Name</label>
              <input
                type="text"
                placeholder="e.g. All Purpose Cream (Nestlé)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                placeholder="e.g. Nestlé"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Vendor / Store</label>
              <input
                type="text"
                placeholder="e.g. South Supermarket"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Unit Price (₱)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Package Size</label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="e.g. 250"
                value={pkgSize}
                onChange={(e) => setPkgSize(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Unit of Measure (UOM)</label>
              <select value={uom} onChange={(e) => setUom(e.target.value)}>
                {UOM_OPTIONS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Current Stock (qty)</label>
              <input
                type="number"
                min={0}
                step="1"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Ingredient'}
          </button>
        </div>
      </div>
    </div>
  );
}
