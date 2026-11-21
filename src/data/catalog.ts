export type CatalogType = 'place' | 'market' | 'online';
export type CatalogCategory = 'all' | 'clothes' | 'home' | 'media' | 'antiques' | 'flea';
export type CatalogItem = {
  id: string;
  city: string;
  category: CatalogCategory;
  type: CatalogType;
  title: string;
  address?: string;
  coords?: { lat: number; lng: number };
  description?: string;
  priceRange?: string;
  tags: string[];
  url?: string;
};

/**
 * Unified future-ready catalog shape.
 * Supabase/OSM data can be normalized into this model without changing the UI.
 * Keep demo data empty: never present unverified examples as real businesses.
 */
export const catalog: CatalogItem[] = [];
