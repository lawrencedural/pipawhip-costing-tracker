import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import type { ProductInput, ProductIngredientInput, ProductWithIngredients } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<ProductWithIngredients[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, ingredients:product_ingredients(*)')
      .order('created_at', { ascending: true });
    if (error) setError(error.message);
    else {
      const withOrderedIngredients = (data ?? []).map((p) => ({
        ...p,
        ingredients: [...(p.ingredients ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      })) as ProductWithIngredients[];
      setProducts(withOrderedIngredients);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProduct = useCallback(async (product: ProductInput) => {
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) throw error;
    setProducts((prev) => [...prev, { ...data, ingredients: [] }]);
    return data;
  }, []);

  const updateProduct = useCallback(async (id: string, patch: Partial<ProductInput>) => {
    const { data, error } = await supabase.from('products').update(patch).eq('id', id).select().single();
    if (error) throw error;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    return data;
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addIngredient = useCallback(async (ingredient: ProductIngredientInput) => {
    const { data, error } = await supabase
      .from('product_ingredients')
      .insert(ingredient)
      .select()
      .single();
    if (error) throw error;
    setProducts((prev) =>
      prev.map((p) => (p.id === ingredient.product_id ? { ...p, ingredients: [...p.ingredients, data] } : p))
    );
    return data;
  }, []);

  const updateIngredient = useCallback(
    async (productId: string, ingredientId: string, patch: Partial<ProductIngredientInput>) => {
      const { data, error } = await supabase
        .from('product_ingredients')
        .update(patch)
        .eq('id', ingredientId)
        .select()
        .single();
      if (error) throw error;
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, ingredients: p.ingredients.map((i) => (i.id === ingredientId ? data : i)) }
            : p
        )
      );
      return data;
    },
    []
  );

  const removeIngredient = useCallback(async (productId: string, ingredientId: string) => {
    const { error } = await supabase.from('product_ingredients').delete().eq('id', ingredientId);
    if (error) throw error;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, ingredients: p.ingredients.filter((i) => i.id !== ingredientId) } : p
      )
    );
  }, []);

  return {
    products,
    loading,
    error,
    refresh,
    addProduct,
    updateProduct,
    deleteProduct,
    addIngredient,
    updateIngredient,
    removeIngredient,
  };
}
