export type Uom =
  | 'GRAMS'
  | 'ML'
  | 'PCS'
  | 'KG'
  | 'L'
  | 'CAN'
  | 'PACK'
  | 'PC'
  | 'BUNCH'
  | 'PACKS'
  | string;

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  vendor: string;
  price: number;
  pkg_size: number;
  uom: Uom;
  stock: number;
  created_at?: string;
  updated_at?: string;
}

export type InventoryItemInput = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>;

export interface ProductIngredient {
  id: string;
  product_id: string;
  inventory_item_id: string | null;
  name: string;
  unit_price: number;
  pkg_size: number;
  pkg_uom: Uom;
  qty: number;
  qty_uom: Uom;
  note: string;
  sort_order: number;
  created_at?: string;
}

export type ProductIngredientInput = Omit<ProductIngredient, 'id' | 'created_at'>;

export interface Product {
  id: string;
  name: string;
  size: string;
  emoji: string;
  batch_size: number;
  selling_price: number;
  other_costs: number;
  created_at?: string;
  updated_at?: string;
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

export interface ProductWithIngredients extends Product {
  ingredients: ProductIngredient[];
}

// Minimal Supabase Database typing (hand-written to match supabase/schema.sql).
export interface Database {
  public: {
    Tables: {
      inventory_items: {
        Row: InventoryItem;
        Insert: Partial<InventoryItem>;
        Update: Partial<InventoryItem>;
      };
      products: {
        Row: Product;
        Insert: Partial<Product>;
        Update: Partial<Product>;
      };
      product_ingredients: {
        Row: ProductIngredient;
        Insert: Partial<ProductIngredient>;
        Update: Partial<ProductIngredient>;
      };
    };
  };
}
