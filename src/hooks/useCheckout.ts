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

    const payload = {
      nombre: shippingName,
      email: shippingEmail,
      telefono: shippingPhone,
      direccion: shippingAddress,
      ciudad: shippingCity,
      items: cart.map((i) => ({
        id: i.id,
        nombre: i.product.name,
        color: i.color,
        size: i.size,
        quantity: i.quantity,
      })),
      tx_id: paymentTxId,
      tiene_comprobante: Boolean(paymentReceiptName),
    };

    if (supabase) {
      try {
        // 1. Primary: Invoke Edge Function for secure backend processing
        const { data, error: fnError } = await supabase.functions.invoke("process-order", {
          body: payload,
        });

        if (fnError || !data?.success) {
          console.warn("Edge function error, intentando inserción directa:", fnError || data);
          // 2. Fallback: Direct table insert if Edge Function is unavailable
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

          const { error: dbError } = await supabase.from("pedidos").insert(orderPayload);
          if (dbError) {
            console.error("Error guardando pedido en BD:", dbError);
            setOrderError("Hubo un error al registrar tu pedido. Intenta nuevamente.");
            setIsSubmittingOrder(false);
            return false;
          }
        }
      } catch (err: unknown) {
        console.error("Error inesperado en checkout:", err);
        setOrderError("Error de conexión al procesar el pedido. Intenta de nuevo.");
        setIsSubmittingOrder(false);
        return false;
      }
    } else {
      console.warn("Supabase no configurado: pedido en modo simulación.");
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
