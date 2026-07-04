import { useState } from 'react';
import TopBar, { type Section } from '@/components/TopBar';
import CostingSection from '@/components/CostingSection';
import InventorySection from '@/components/InventorySection';
import { useInventory } from '@/hooks/useInventory';
import { useProducts } from '@/hooks/useProducts';

export default function App() {
  const [section, setSection] = useState<Section>('costing');

  const {
    inventory,
    loading: inventoryLoading,
    error: inventoryError,
    addItem,
    updateItem,
    deleteItem,
    adjustStock,
  } = useInventory();

  const {
    products,
    loading: productsLoading,
    error: productsError,
    addProduct,
    updateProduct,
    deleteProduct,
    addIngredient,
    updateIngredient,
    removeIngredient,
  } = useProducts();

  const error = inventoryError || productsError;

  return (
    <>
      <TopBar active={section} onChange={setSection} />
      <div className="main">
        {error && <div className="alert alert-error">{error}</div>}

        {section === 'costing' && (
          <CostingSection
            products={products}
            inventory={inventory}
            loading={productsLoading}
            onAddProduct={addProduct}
            onDeleteProduct={deleteProduct}
            onUpdateProduct={updateProduct}
            onAddIngredient={addIngredient}
            onUpdateIngredient={(productId, ingredientId, patch) =>
              updateIngredient(productId, ingredientId, patch)
            }
            onRemoveIngredient={removeIngredient}
          />
        )}

        {section === 'inventory' && (
          <InventorySection
            inventory={inventory}
            loading={inventoryLoading}
            onAdd={addItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
            onAdjustStock={adjustStock}
          />
        )}
      </div>
    </>
  );
}
