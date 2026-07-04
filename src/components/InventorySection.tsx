import { useMemo, useState } from 'react';
import type { InventoryItem } from '@/types';
import { php, stockClass } from '@/lib/calculations';
import InventoryModal from './modals/InventoryModal';

interface InventorySectionProps {
  inventory: InventoryItem[];
  loading: boolean;
  onAdd: (item: Omit<InventoryItem, 'id'>) => Promise<unknown>;
  onUpdate: (id: string, patch: Partial<Omit<InventoryItem, 'id'>>) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  onAdjustStock: (id: string, delta: number) => Promise<void>;
}

export default function InventorySection({
  inventory,
  loading,
  onAdd,
  onUpdate,
  onDelete,
  onAdjustStock,
}: InventorySectionProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.vendor.toLowerCase().includes(q) ||
        (i.brand || '').toLowerCase().includes(q)
    );
  }, [inventory, search]);

  const vendorCount = useMemo(() => new Set(inventory.map((i) => i.vendor)).size, [inventory]);
  const avgPrice = useMemo(
    () => (inventory.length ? inventory.reduce((s, i) => s + i.price, 0) / inventory.length : 0),
    [inventory]
  );
  const lowCount = useMemo(() => inventory.filter((i) => (i.stock || 0) <= 1).length, [inventory]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditing(item);
    setModalOpen(true);
  }

  async function handleDelete(item: InventoryItem) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await onDelete(item.id);
  }

  return (
    <div className="section active">
      <div className="page-header">
        <div className="page-title">Ingredient Inventory</div>
        <div className="page-sub">Manage your ingredients, prices, stock levels, and suppliers</div>
      </div>

      <div className="stats-row">
        <div className="stat-card pink">
          <div className="stat-label">Total Ingredients</div>
          <div className="stat-value">{inventory.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Vendors</div>
          <div className="stat-value">{vendorCount}</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-label">Avg Unit Price</div>
          <div className="stat-value">{php(avgPrice)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Low / Out of Stock</div>
          <div className="stat-value">{lowCount}</div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Ingredient
        </button>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Product / Ingredient</th>
                <th>Brand</th>
                <th>Vendor</th>
                <th className="td-num">Price (₱)</th>
                <th className="td-num">Pkg Size</th>
                <th>UOM</th>
                <th className="td-center">Stock (qty)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No ingredients found
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const stock = item.stock || 0;
                  const sClass = stockClass(stock);
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td style={{ color: 'var(--text2)' }}>{item.brand || '—'}</td>
                      <td style={{ color: 'var(--text2)' }}>{item.vendor || '—'}</td>
                      <td className="td-num">
                        <strong>{php(item.price)}</strong>
                      </td>
                      <td className="td-num">{item.pkg_size}</td>
                      <td>
                        <span className="badge badge-pink">{item.uom}</span>
                      </td>
                      <td className="td-center">
                        <div className="stock-control">
                          <button
                            className="stock-btn"
                            onClick={() => onAdjustStock(item.id, -1)}
                            disabled={stock === 0}
                          >
                            −
                          </button>
                          <span className={`stock-val ${sClass}`}>{stock}</span>
                          <button className="stock-btn" onClick={() => onAdjustStock(item.id, 1)}>
                            +
                          </button>
                          {stock === 0 && <span className="badge badge-red" style={{ fontSize: 10 }}>Out</span>}
                          {stock === 1 && <span className="badge badge-gold" style={{ fontSize: 10 }}>Low</span>}
                        </div>
                      </td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-sm" onClick={() => openEdit(item)}>
                            Edit
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item)}>
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <InventoryModal
          item={editing}
          onClose={() => setModalOpen(false)}
          onSave={async (values) => {
            if (editing) await onUpdate(editing.id, values);
            else await onAdd(values);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
