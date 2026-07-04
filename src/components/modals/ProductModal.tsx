import { useState } from 'react';
import type { ProductInput } from '@/types';

interface ProductModalProps {
  onClose: () => void;
  onSave: (values: ProductInput) => Promise<void>;
}

export default function ProductModal({ onClose, onSave }: ProductModalProps) {
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [emoji, setEmoji] = useState('');
  const [batchSize, setBatchSize] = useState('10');
  const [sellingPrice, setSellingPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setErr('Enter product name');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        name: name.trim(),
        size: size.trim(),
        emoji: emoji.trim() || '🍨',
        batch_size: parseInt(batchSize, 10) || 10,
        selling_price: parseFloat(sellingPrice) || 0,
        other_costs: 5,
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
          <div className="modal-title">New Product Costing Sheet</div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {err && <div className="alert alert-error">{err}</div>}
          <div className="form-grid">
            <div className="form-group span2">
              <label>Product Name</label>
              <input
                type="text"
                placeholder="e.g. Banana Biscoff Grahams"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Container Size</label>
              <input
                type="text"
                placeholder="e.g. 500ml tubs"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Emoji Icon</label>
              <input
                type="text"
                placeholder="🍌"
                maxLength={2}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Batch Size (tubs)</label>
              <input
                type="number"
                min={1}
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
              />
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
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Sheet'}
          </button>
        </div>
      </div>
    </div>
  );
}
