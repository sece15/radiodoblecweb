"use client";

import { Plus, Star, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { useAudio } from "@/hooks/useAudio";
import { isAdmin } from "@/lib/permissions";
import { useProducts } from "@/hooks/useProductsQuery";
import { useStoreModals } from "@/hooks/useStoreModals";
import { StoreProductCard } from "./store/StoreProductCard";
import { ProductDetailModal } from "./store/ProductDetailModal";
import { ProductSpecsModal } from "./store/ProductSpecsModal";
import { AddProductModal } from "./store/AddProductModal";
import { EditProductModal } from "./store/EditProductModal";

interface StoreViewProps {
  addToCart: (product: Product, color: string, size: string) => void;
  onModalToggle?: (isOpen: boolean) => void;
}

export const StoreView = ({ addToCart, onModalToggle }: StoreViewProps) => {
  const { userProfile } = useAudio();
  const userIsAdmin = isAdmin(userProfile.role);

  // 1. Data Query
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();

  // 2. Modals & Action Logic Hook
  const {
    selectedProduct,
    setSelectedProduct,
    isSpecsOpen,
    setSpecsOpen,
    isAddModalOpen,
    setAddModalOpen,
    editingProduct,
    setEditingProduct,
    handleOpenDetail,
    handleOpenEdit,
    handleDeleteProduct,
    handleCreateProduct,
    handleUpdateProduct,
    isSubmittingCreate,
    isSubmittingEdit,
  } = useStoreModals(onModalToggle);

  return (
    <div
      className="store-view-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "16px 12px 180px 12px",
        position: "relative",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {/* URBAN BACKGROUND GRAFFITI & STAR DECORATIONS */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "-20px",
            fontSize: "clamp(4rem, 15vw, 9rem)",
            fontWeight: 900,
            fontFamily: "Space Grotesk, sans-serif",
            color: "var(--primary)",
            opacity: 0.05,
            transform: "rotate(-20deg)",
            userSelect: "none",
          }}
        >
          PUNK
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "-20px",
            fontSize: "clamp(4rem, 15vw, 9rem)",
            fontWeight: 900,
            fontFamily: "Space Grotesk, sans-serif",
            color: "var(--primary)",
            opacity: 0.05,
            transform: "rotate(15deg)",
            userSelect: "none",
          }}
        >
          DOBLE C
        </div>
      </div>

      {/* HEADER MERCH HERO */}
      <div
        className="neo-card"
        style={{
          width: "100%",
          padding: "16px 20px",
          backgroundColor: "var(--background)",
          border: "4px solid var(--primary)",
          boxShadow: "6px 6px 0px var(--primary)",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          transform: "rotate(-0.5deg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-12px",
            left: "14px",
            backgroundColor: "var(--primary-container)",
            color: "var(--primary)",
            border: "2px solid var(--primary)",
            padding: "2px 8px",
            fontSize: "0.6rem",
            fontWeight: 900,
            textTransform: "uppercase",
            boxShadow: "2px 2px 0px var(--primary)",
            transform: "rotate(-3deg)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Sparkles size={10} /> OFICIAL 2026
        </div>

        <h2
          style={{
            fontSize: "clamp(1.5rem, 5vw, 2.2rem)",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.5px",
            margin: "4px 0 2px 0",
            color: "var(--primary)",
          }}
        >
          TIENDA RADIO DOBLE C
        </h2>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            opacity: 0.85,
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          PRENDAS OVERSIZE • EDICIÓN ESTUDIO & BROADCAMPUS
        </p>

        <div
          style={{
            position: "absolute",
            bottom: "-10px",
            right: "14px",
            backgroundColor: "var(--card-bg)",
            color: "var(--primary)",
            border: "2px solid var(--primary)",
            padding: "2px 6px",
            fontSize: "0.55rem",
            fontWeight: 900,
            transform: "rotate(2deg)",
            display: "flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <Star size={9} fill="currentColor" /> STOCK LIMITADO
        </div>
      </div>

      {/* ADMIN ACTION: ADD PRODUCT BUTTON */}
      {userIsAdmin && (
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", zIndex: 1 }}>
          <button
            onClick={() => setAddModalOpen(true)}
            className="neo-button fun-hover-wobble"
            style={{
              backgroundColor: "var(--primary-container)",
              color: "var(--primary)",
              padding: "8px 16px",
              fontSize: "0.75rem",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "3px 3px 0px var(--primary)",
              border: "3px solid var(--primary)",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            <Plus size={16} /> AGREGAR PRENDA A LA TIENDA (ADMIN)
          </button>
        </div>
      )}

      {/* PRODUCT GRID / SKELETON LOADER */}
      {isLoadingProducts ? (
        <div className="store-products-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="neo-card"
              style={{
                width: "100%",
                aspectRatio: "1/1",
                border: "3px solid var(--primary)",
                boxShadow: "4px 4px 0px var(--primary)",
                backgroundColor: "var(--surface-container)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulse 1.2s infinite ease-in-out",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 900, opacity: 0.6 }}>
                CARGANDO PRENDA...
              </span>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            border: "3px dashed var(--primary)",
            width: "100%",
          }}
        >
          <p style={{ fontSize: "0.9rem", fontWeight: 900 }}>
            NO HAY PRENDAS REGISTRADAS EN SUPABASE
          </p>
        </div>
      ) : (
        <div className="store-products-grid">
          {products.map((product) => (
            <StoreProductCard
              key={product.id}
              product={product}
              userIsAdmin={userIsAdmin}
              onOpenDetail={handleOpenDetail}
              onAddToCart={addToCart}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteProduct}
            />
          ))}
        </div>
      )}

      {/* MODAL 1: PRODUCT DETAIL */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        onOpenSpecs={() => setSpecsOpen(true)}
      />

      {/* MODAL 2: SPECIFICATIONS & SIZE GUIDE */}
      <ProductSpecsModal
        isOpen={isSpecsOpen}
        product={selectedProduct}
        onClose={() => setSpecsOpen(false)}
      />

      {/* MODAL 3: ADMIN ADD PRODUCT */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateProduct}
        isSubmitting={isSubmittingCreate}
      />

      {/* MODAL 4: ADMIN EDIT PRODUCT */}
      <EditProductModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSubmit={handleUpdateProduct}
        isSubmitting={isSubmittingEdit}
      />
    </div>
  );
};
