import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import type { InventoryItem, InventoryItemInput } from '@/types';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });
    if (error) setError(error.message);
    else setInventory(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (item: InventoryItemInput) => {
    const { data, error } = await supabase.from('inventory_items').insert(item).select().single();
    if (error) throw error;
    setInventory((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  }, []);

  const updateItem = useCallback(async (id: string, patch: Partial<InventoryItemInput>) => {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setInventory((prev) => prev.map((i) => (i.id === id ? data : i)));
    return data;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
    setInventory((prev) => prev.filter((i) => i.id !== id));
  }, []);

  /** Adjust stock by a delta (+1 / -1), clamped at 0, with optimistic UI update. */
  const adjustStock = useCallback(
    async (id: string, delta: number) => {
      const current = inventory.find((i) => i.id === id);
      if (!current) return;
      const nextStock = Math.max(0, (current.stock || 0) + delta);
      setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, stock: nextStock } : i)));
      const { error } = await supabase.from('inventory_items').update({ stock: nextStock }).eq('id', id);
      if (error) {
        setError(error.message);
        refresh(); // revert to server truth on failure
      }
    },
    [inventory, refresh]
  );

  return { inventory, loading, error, refresh, addItem, updateItem, deleteItem, adjustStock };
}
