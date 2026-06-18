import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { CartItem } from "./useCart";

export type CheckoutStep = "idle" | "shipping" | "payment" | "success";

export function useCheckout(
  checkoutStep: CheckoutStep,
  setCheckoutStep: (step: CheckoutStep) => void
) {
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingEmail, setShippingEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [paymentTxId, setPaymentTxId] = useState("");
  const [paymentReceiptName, setPaymentReceiptName] = useState("");
  const [isCopiedAlias, setIsCopiedAlias] = useState(false);
  const [isCopiedCvu, setIsCopiedCvu] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const resetCheckout = useCallback(() => {
    setCheckoutStep("idle");
    setShippingName("");
    setShippingPhone("");
    setShippingEmail("");
    setShippingAddress("");
    setShippingCity("");
    setPaymentTxId("");
    setPaymentReceiptName("");
    setOrderError(null);
  }, [setCheckoutStep]);

  const submitOrder = useCallback(async (cart: CartItem[], totalAmount: number) => {
    setIsSubmittingOrder(true);
    setOrderError(null);

    const orderPayload = {
      nombre: shippingName,
      email: shippingEmail,
      telefono: shippingPhone,
      direccion: shippingAddress,
      ciudad: shippingCity,
      items: cart.map((i) => ({
        id: i.id,
        nombre: i.product.name,
        color: i.color,
        talle: i.size,
        cantidad: i.quantity,
        precio_unitario: i.product.price,
      })),
      total: totalAmount,
      tx_id: paymentTxId,
      tiene_comprobante: Boolean(paymentReceiptName),
      estado: "pendiente_verificacion",
    };

    if (supabase) {
      const { error } = await supabase.from("pedidos").insert(orderPayload);
      if (error) {
        console.error("Error guardando pedido:", error);
        setOrderError("Hubo un error al registrar tu pedido. Intená de nuevo.");
        setIsSubmittingOrder(false);
        return false;
      }
    } else {
      console.warn("Supabase no configurado: pedido no persistido.");
    }

    setIsSubmittingOrder(false);
    setCheckoutStep("success");
    return true;
  }, [shippingName, shippingEmail, shippingPhone, shippingAddress, shippingCity, paymentTxId, paymentReceiptName, setCheckoutStep]);

  return {
    shippingName,
    setShippingName,
    shippingPhone,
    setShippingPhone,
    shippingEmail,
    setShippingEmail,
    shippingAddress,
    setShippingAddress,
    shippingCity,
    setShippingCity,
    paymentTxId,
    setPaymentTxId,
    paymentReceiptName,
    setPaymentReceiptName,
    isCopiedAlias,
    setIsCopiedAlias,
    isCopiedCvu,
    setIsCopiedCvu,
    isSubmittingOrder,
    orderError,
    submitOrder,
    resetCheckout,
  };
}
