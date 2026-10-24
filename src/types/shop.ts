// ==========================================
// TIENDA, CARRITO & AUSPICIADORES (src/types/shop.ts)
// ==========================================

export interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  rotation: number;
  description: string;
  colors: string[];
  sizes: string[];
  variantImages?: Record<string, string>;
  badge?: string;
  isFeatured?: boolean;
  driveFileId?: string;
  specs?: string;
  careInstructions?: string;
}

export interface CartItem {
  id: string; // Combinación: idProducto-color-talla
  product: {
    id: string;
    name: string;
    price: string; // ej. "$25.00"
    imageUrl: string;
  };
  color: string;
  size: string;
  quantity: number;
}

export interface CouponDefinition {
  code: string;
  discountPercent: number;
  isFreeShipping: boolean;
  description: string;
}

export interface CartCalculation {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  appliedCoupon: CouponDefinition | null;
}

// ==========================================
// PATROCINADORES (SPONSORS)
// ==========================================
export interface SponsorMenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
  is_popular?: boolean;
}

export interface SponsorBusiness {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  about?: string;
  category: "comida" | "bebidas" | "servicios" | "diseño" | "radio" | "otro";
  whatsapp_number: string;
  address?: string;
  discount_code: string;
  discount_percent: number;
  logo_url?: string;
  play_store_url?: string;
  has_delivery?: boolean;
  is_active: boolean;
  menu_items: SponsorMenuItem[];
}

export interface SponsorOrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateSponsorOrderInput {
  sponsorId: string;
  customerName: string;
  customerPhone: string;
  deliveryType: "delivery" | "pickup" | "reservation";
  address?: string;
  items: SponsorOrderItem[];
  subtotal: number;
  discount: number;
}

// ==========================================
// MERCADO PAGO & MONEDAS C-COINS
// ==========================================
export interface CoinPackInfo {
  id: string;
  title: string;
  coins: number;
  pricePen: number;
  priceUsd: number;
  description: string;
  badge?: string;
  popular?: boolean;
}
