"use client";

import { MouseEvent } from "react";
import { ShoppingCart, Trash2, Pencil } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/priceUtils";

interface StoreProductCardProps {
  product: Product;
  userIsAdmin: boolean;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product, color: string, size: string) => void;
  onEdit: (e: MouseEvent, product: Product) => void;
  onDelete: (e: MouseEvent, product: Product) => void;
}

export const StoreProductCard = ({
  product,
  userIsAdmin,
  onOpenDetail,
  onAddToCart,
  onEdit,
  onDelete,
}: StoreProductCardProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {/* Product Image Card Container */}
      <div
        onClick={() => onOpenDetail(product)}
        className="neo-card store-card-hover"
        style={{
          width: "100%",
          aspectRatio: "1/1",
          transform: `rotate(${product.rotation}deg)`,
          overflow: "hidden",
          boxShadow: product.isFeatured
            ? "6px 6px 0px var(--primary)"
            : "4px 4px 0px var(--primary)",
          borderWidth: product.isFeatured ? "4px" : "3px",
          borderColor: product.isFeatured
            ? "var(--primary-container)"
            : "var(--primary)",
          position: "relative",
          cursor: "pointer",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {product.badge && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                backgroundColor: product.isFeatured
                  ? "var(--primary-container)"
                  : "var(--card-bg)",
                color: "var(--primary)",
                border: "2px solid var(--primary)",
                padding: "2px 6px",
                fontSize: "0.55rem",
                fontWeight: 900,
                zIndex: 10,
                transform: "rotate(-5deg)",
                boxShadow: "2px 2px 0px var(--primary)",
                textTransform: "uppercase",
              }}
            >
              {product.badge}
            </div>
          )}

          {/* Admin Actions: Edit + Delete */}
          {userIsAdmin && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                display: "flex",
                gap: "5px",
                zIndex: 15,
              }}
            >
              <button
                onClick={(e) => onEdit(e, product)}
                title="Editar prenda (Admin)"
                style={{
                  backgroundColor: "#1A6BB5",
                  color: "white",
                  border: "2px solid #111",
                  borderRadius: "4px",
                  padding: "5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "2px 2px 0px #111",
                }}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={(e) => onDelete(e, product)}
                title="Eliminar prenda (Admin)"
                style={{
                  backgroundColor: "#BA1A1A",
                  color: "white",
                  border: "2px solid #111",
                  borderRadius: "4px",
                  padding: "5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "2px 2px 0px #111",
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}

          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {/* Price Badge */}
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              border: "2px solid var(--primary-container)",
              padding: "2px 6px",
              fontSize: "0.65rem",
              fontWeight: 900,
              transform: `rotate(${product.rotation < 0 ? 4 : -4}deg)`,
              boxShadow: "1px 1px 0px var(--primary)",
            }}
          >
            {formatPrice(product.price)}
          </div>
        </div>
      </div>

      {/* Product Name */}
      <h4
        onClick={() => onOpenDetail(product)}
        style={{
          fontSize: "0.95rem",
          fontWeight: 900,
          textAlign: "center",
          lineHeight: "1.15rem",
          height: "2.3rem",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          marginTop: "6px",
          cursor: "pointer",
          textTransform: "uppercase",
          color: "var(--primary)",
        }}
      >
        {product.name}
      </h4>

      {/* Add to Cart Button */}
      <button
        onClick={() =>
          onAddToCart(product, product.colors[0] || "ÚNICO", product.sizes[0] || "M")
        }
        className="neo-button"
        style={{
          width: "100%",
          padding: "6px 10px",
          fontSize: "0.65rem",
          backgroundColor: "var(--primary-container)",
          boxShadow: "3px 3px 0px var(--primary)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ShoppingCart size={12} style={{ marginRight: "4px" }} />
        AÑADIR
      </button>
    </div>
  );
};
