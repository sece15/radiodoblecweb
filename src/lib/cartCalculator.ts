import { CartItem } from "@/types";
import { parsePrice } from "./priceUtils";

export interface CouponDefinition {
  code: string;
  discountPercent: number;
  isFreeShipping: boolean;
  description: string;
}

export const ACTIVE_COUPONS: Record<string, CouponDefinition> = {
  DOBLEC2026: {
    code: "DOBLEC2026",
    discountPercent: 10,
    isFreeShipping: false,
    description: "¡Cupón DOBLEC2026 aplicado! 10% OFF 🔥",
  },
  FUCKINGGOODSHIT: {
    code: "FUCKINGGOODSHIT",
    discountPercent: 15,
    isFreeShipping: false,
    description: "¡Cupón FUCKINGGOODSHIT aplicado! 15% OFF ⚡",
  },
  VIPDOBLEC: {
    code: "VIPDOBLEC",
    discountPercent: 20,
    isFreeShipping: false,
    description: "¡Cupón VIP aplicado! 20% OFF ⭐",
  },
  ENVIOFREE: {
    code: "ENVIOFREE",
    discountPercent: 0,
    isFreeShipping: true,
    description: "¡Cupón ENVIOFREE aplicado! Envío Gratis 🚚",
  },
};

export interface CartCalculation {
  subtotal: number;
  totalItems: number;
  discountPercent: number;
  discountAmount: number;
  isFreeShipping: boolean;
  shippingCost: number;
  total: number;
  couponMessage: string | null;
  isCouponValid: boolean;
}

export const BASE_SHIPPING_COST = 5.0;
export const FREE_SHIPPING_THRESHOLD = 199.0;

/**
 * Pure calculation function for Cart totals and discounts across the entire application.
 */
export function calculateCartTotals(cart: CartItem[], rawCouponCode?: string): CartCalculation {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => {
    const unitPrice = parsePrice(item.product.price);
    return acc + unitPrice * item.quantity;
  }, 0);

  const cleanCode = (rawCouponCode || "").trim().toUpperCase();
  const coupon = cleanCode ? ACTIVE_COUPONS[cleanCode] : null;

  let discountPercent = 0;
  let isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  let couponMessage: string | null = null;
  let isCouponValid = false;

  if (cleanCode) {
    if (coupon) {
      discountPercent = coupon.discountPercent;
      if (coupon.isFreeShipping) isFreeShipping = true;
      couponMessage = coupon.description;
      isCouponValid = true;
    } else {
      couponMessage = "Cupón inválido. Prueba DOBLEC2026 o ENVIOFREE";
      isCouponValid = false;
    }
  }

  const discountAmount = (subtotal * discountPercent) / 100;
  const shippingCost = isFreeShipping || subtotal === 0 ? 0 : BASE_SHIPPING_COST;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  return {
    subtotal,
    totalItems,
    discountPercent,
    discountAmount,
    isFreeShipping,
    shippingCost,
    total,
    couponMessage,
    isCouponValid,
  };
}
