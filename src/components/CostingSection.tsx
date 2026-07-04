import { useState } from 'react';
import type { InventoryItem, ProductWithIngredients, ProductInput, ProductIngredientInput } from '@/types';
import ProductGrid from './ProductGrid';
import ProductDetail from './ProductDetail';
import ProductModal from './modals/ProductModal';

interface CostingSectionProps {
  products: ProductWithIngredients[];
  inventory: InventoryItem[];
  loading: boolean;
  onAddProduct: (values: ProductInput) => Promise<unknown>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateProduct: (id: string, patch: Partial<ProductInput>) => Promise<unknown>;
  onAddIngredient: (values: ProductIngredientInput) => Promise<unknown>;
  onUpdateIngredient: (productId: string, ingredientId: string, patch: { qty: number }) => Promise<unknown>;
  onRemoveIngredient: (productId: string, ingredientId: string) => Promise<void>;
}

export default function CostingSection({
  products,
  inventory,
  loading,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
  onAddIngredient,
  onUpdateIngredient,
  onRemoveIngredient,
}: CostingSectionProps) {
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const openProduct = products.find((p) => p.id === openProductId) ?? null;

  async function handleDelete(product: ProductWithIngredients) {
    if (!confirm('Delete this costing sheet?')) return;
    await onDeleteProduct(product.id);
  }

  if (openProduct) {
    return (
      <div className="section active">
        <ProductDetail
          product={openProduct}
          inventory={inventory}
          onBack={() => setOpenProductId(null)}
          onSavePricing={(patch) => onUpdateProduct(openProduct.id, patch).then(() => undefined)}
          onAddIngredient={(values) => onAddIngredient(values).then(() => undefined)}
          onUpdateIngredientQty={(ingredientId, qty) =>
            onUpdateIngredient(openProduct.id, ingredientId, { qty }).then(() => undefined)
          }
          onRemoveIngredient={(ingredientId) => onRemoveIngredient(openProduct.id, ingredientId)}
        />
      </div>
    );
  }

  return (
    <div className="section active">
      <div className="page-header">
        <div className="page-title">Product Costing Sheets</div>
        <div className="page-sub">Tap a product to view or edit its costing sheet</div>
      </div>
      <ProductGrid
        products={products}
        loading={loading}
        onOpen={setOpenProductId}
        onAddNew={() => setProductModalOpen(true)}
        onDelete={handleDelete}
      />
      {productModalOpen && (
        <ProductModal
          onClose={() => setProductModalOpen(false)}
          onSave={async (values) => {
            const created = await onAddProduct(values);
            setProductModalOpen(false);
            if (created && typeof created === 'object' && 'id' in created) {
              setOpenProductId((created as { id: string }).id);
            }
          }}
        />
      )}
    </div>
  );
}
