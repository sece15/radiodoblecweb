import { useState, useEffect, useMemo, MouseEvent } from "react";
import { ShoppingCart, Star, Sparkles, Plus, Trash2, Upload, Image as ImageIcon, Check, Pencil } from "lucide-react";
import { Product } from "@/types";
import { STORE_PRODUCTS } from "@/constants";
import { useAudio } from "@/hooks/useAudio";
import { isAdmin } from "@/lib/permissions";
import { fetchStoreProducts, createStoreProduct, deleteStoreProduct, updateStoreProduct } from "@/services/productService";
import { NeoModal } from "./common/NeoModal";

interface StoreViewProps {
  addToCart: (product: Product, color: string, size: string) => void;
  onModalToggle?: (isOpen: boolean) => void;
}

export const StoreView = ({ addToCart, onModalToggle }: StoreViewProps) => {
  const { userProfile } = useAudio();
  const userIsAdmin = isAdmin(userProfile.role);

  const [products, setProducts] = useState<Product[]>(STORE_PRODUCTS);

  useEffect(() => {
    fetchStoreProducts().then(setProducts);
  }, []);

  // Modal Detail States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Add Product Modal States (Admin Only)
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdSpecs, setNewProdSpecs] = useState("");
  const [newProdCare, setNewProdCare] = useState("");
  const [newProdBadge, setNewProdBadge] = useState("🔥 NUEVO INGRESO");
  const [newProdSizes, setNewProdSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [newProdColors, setNewProdColors] = useState("");
  const [newProdImageFiles, setNewProdImageFiles] = useState<File[]>([]);
  const [newProdImagePreviews, setNewProdImagePreviews] = useState<string[]>([]);
  const [newProdImageLabels, setNewProdImageLabels] = useState<string[]>([]);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productSuccessMsg, setProductSuccessMsg] = useState<string | null>(null);

  // Edit Product Modal States (Admin Only)
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSpecs, setEditSpecs] = useState("");
  const [editCare, setEditCare] = useState("");
  const [editColors, setEditColors] = useState("");
  const [editSizes, setEditSizes] = useState<string[]>([]);
  const [editBadge, setEditBadge] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Trigger modal callback for parent stacking context z-index adjustment
  useEffect(() => {
    if (onModalToggle) {
      onModalToggle(!!selectedProduct || isAddModalOpen);
    }
  }, [selectedProduct, isAddModalOpen, onModalToggle]);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [isSpecsOpen, setSpecsOpen] = useState<boolean>(false);
  const [isDescriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);

  const handleOpenDetail = (product: Product) => {
    setSelectedProduct(product);
    setSelectedColor(product.colors[0] || "");
    setSelectedSize(product.sizes[0] || "");
    setActiveImgIndex(0);
    setSpecsOpen(false);
    setDescriptionExpanded(false);
  };

  // Memoized array of unique images for the carousel
  const activeImages = useMemo(() => {
    if (!selectedProduct) return [];
    const imgs: string[] = [];
    if (selectedProduct.imageUrl) {
      imgs.push(selectedProduct.imageUrl);
    }
    if (selectedProduct.variantImages) {
      Object.values(selectedProduct.variantImages).forEach((url) => {
        if (url && !imgs.includes(url)) {
          imgs.push(url);
        }
      });
    }
    return imgs;
  }, [selectedProduct]);

  // Helper: get the label (variantImages key) for a given image URL
  const getLabelForImage = (url: string): string => {
    if (!selectedProduct?.variantImages) return "";
    const entry = Object.entries(selectedProduct.variantImages).find(([, v]) => v === url);
    return entry ? entry[0] : "";
  };

  const syncColorFromImage = (index: number) => {
    if (!selectedProduct || !selectedProduct.variantImages) return;
    const url = activeImages[index];
    if (!url) return;
    const matchingColor = Object.keys(selectedProduct.variantImages).find(
      (color) => selectedProduct.variantImages?.[color] === url
    );
    if (matchingColor) {
      setSelectedColor(matchingColor);
    }
  };

  const handlePrevImage = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeImages.length <= 1) return;
    const nextIdx = (activeImgIndex - 1 + activeImages.length) % activeImages.length;
    setActiveImgIndex(nextIdx);
    syncColorFromImage(nextIdx);
  };

  const handleNextImage = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeImages.length <= 1) return;
    const nextIdx = (activeImgIndex + 1) % activeImages.length;
    setActiveImgIndex(nextIdx);
    syncColorFromImage(nextIdx);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    if (!selectedProduct) return;

    // Option 1: direct match via variantImages key
    if (selectedProduct.variantImages?.[color]) {
      const url = selectedProduct.variantImages[color];
      const index = activeImages.indexOf(url);
      if (index !== -1) {
        setActiveImgIndex(index);
        return;
      }
    }

    // Option 2: fallback — nth color button shows nth image (for cases where colors ≠ variantImages keys)
    const colorIndex = selectedProduct.colors.indexOf(color);
    if (colorIndex !== -1 && colorIndex < activeImages.length) {
      setActiveImgIndex(colorIndex);
    }
  };

  const handleThumbnailSelect = (index: number) => {
    setActiveImgIndex(index);
    syncColorFromImage(index);
  };

  const defaultSmartLabels = ["VISTA FRONTAL", "PARTE DE ATRÁS", "VISTA LATERAL", "DETALLE", "ETIQUETA"];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const addedFiles = Array.from(files);
      const currentCount = newProdImageFiles.length;
      setNewProdImageFiles((prev) => [...prev, ...addedFiles]);
      const newPreviews = addedFiles.map((file) => URL.createObjectURL(file));
      setNewProdImagePreviews((prev) => [...prev, ...newPreviews]);
      const newLabels = addedFiles.map((_, i) => defaultSmartLabels[currentCount + i] || `VISTA ${currentCount + i + 1}`);
      setNewProdImageLabels((prev) => [...prev, ...newLabels]);
    }
  };

  const handleUpdateImageLabel = (index: number, label: string) => {
    setNewProdImageLabels((prev) => {
      const updated = [...prev];
      updated[index] = label;
      return updated;
    });
  };

  const handleRemoveImage = (index: number) => {
    setNewProdImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewProdImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setNewProdImageLabels((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleSize = (size: string) => {
    setNewProdSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleAddColorChip = (colorName: string) => {
    setNewProdColors((prev) => {
      const currentList = prev.split(",").map((s) => s.trim()).filter(Boolean);
      if (!currentList.includes(colorName)) {
        return currentList.length > 0 ? `${prev}, ${colorName}` : colorName;
      }
      return prev;
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice.trim() || newProdImageFiles.length === 0) {
      alert("Por favor completa el nombre, precio y sube al menos una foto de la prenda.");
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const colorsArr = newProdColors
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

      const created = await createStoreProduct({
        name: newProdName,
        price: newProdPrice,
        description: newProdDesc,
        imageFiles: newProdImageFiles,
        imageLabels: newProdImageLabels,
        badge: newProdBadge,
        sizes: newProdSizes.length > 0 ? newProdSizes : ["ÚNICA"],
        colors: colorsArr.length > 0 ? colorsArr : undefined,
        specs: newProdSpecs.trim() || undefined,
        careInstructions: newProdCare.trim() || undefined,
      });

      setProducts((prev) => [created, ...prev]);
      setProductSuccessMsg(`¡Prenda "${created.name}" (${newProdImageFiles.length} fotos) guardada con éxito!`);
      setTimeout(() => {
        setAddModalOpen(false);
        setProductSuccessMsg(null);
        setNewProdName("");
        setNewProdPrice("");
        setNewProdDesc("");
        setNewProdSpecs("");
        setNewProdCare("");
        setNewProdColors("");
        setNewProdImageFiles([]);
        setNewProdImagePreviews([]);
        setNewProdImageLabels([]);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al agregar producto: ${msg}`);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (e: MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`¿Eliminar la prenda "${product.name}" de la tienda?`)) return;

    try {
      await deleteStoreProduct(product.id, product.driveFileId);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al eliminar: ${msg}`);
    }
  };

  const handleOpenEdit = (e: MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price.replace("S/.", "").replace("S/", "").trim());
    setEditDesc(product.description || "");
    setEditSpecs(product.specs || "");
    setEditCare(product.careInstructions || "");
    setEditColors(product.colors.join(", "));
    setEditSizes(product.sizes || ["S", "M", "L", "XL"]);
    setEditBadge(product.badge || "");
    setEditSuccessMsg(null);
    setEditModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmittingEdit(true);
    try {
      const colorsArr = editColors.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
      const updated = await updateStoreProduct({
        id: editingProduct.id,
        name: editName,
        price: editPrice,
        description: editDesc,
        badge: editBadge,
        sizes: editSizes.length > 0 ? editSizes : ["S", "M", "L", "XL"],
        colors: colorsArr.length > 0 ? colorsArr : undefined,
        specs: editSpecs,
        careInstructions: editCare,
        variantImages: editingProduct.variantImages,
        imageUrl: editingProduct.imageUrl,
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditSuccessMsg("¡Prenda actualizada con éxito!");
      setTimeout(() => {
        setEditModalOpen(false);
        setEditingProduct(null);
        setEditSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al actualizar: ${msg}`);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

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
      {/* URBAN BACKGROUND GRAFFITI & STAR DECORATIONS (ISOLATED TO PREVENT HORIZONTAL SCROLL) */}
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
            fontSize: "clamp(3.5rem, 12vw, 7rem)",
            fontWeight: 900,
            fontFamily: "Space Grotesk, sans-serif",
            color: "var(--primary-container)",
            opacity: 0.07,
            transform: "rotate(15deg)",
            userSelect: "none",
          }}
        >
          DOBLE C
        </div>

        <div
          style={{
            position: "absolute",
            top: "45%",
            right: "5%",
            fontSize: "clamp(3rem, 10vw, 5rem)",
            fontWeight: 900,
            fontFamily: "Space Grotesk, sans-serif",
            color: "var(--primary)",
            opacity: 0.04,
            transform: "rotate(-10deg)",
            userSelect: "none",
          }}
        >
          STREET
        </div>

        <Star
          size={120}
          style={{
            position: "absolute",
            top: "25%",
            right: "-30px",
            color: "var(--primary-container)",
            fill: "var(--primary-container)",
            opacity: 0.06,
            transform: "rotate(25deg)",
          }}
        />

        <Star
          size={100}
          style={{
            position: "absolute",
            bottom: "10%",
            left: "-20px",
            color: "var(--primary)",
            fill: "var(--primary)",
            opacity: 0.05,
            transform: "rotate(-35deg)",
          }}
        />

        <Sparkles
          size={60}
          style={{
            position: "absolute",
            top: "5%",
            right: "15%",
            color: "var(--primary)",
            opacity: 0.05,
            transform: "rotate(15deg)",
          }}
        />
      </div>

      {/* HEADER SECTION */}
      <h2
        className="neo-card"
        style={{
          backgroundColor: "var(--primary-container)",
          padding: "8px 16px",
          transform: "rotate(-2deg)",
          fontSize: "1.5rem",
          fontWeight: 900,
          textTransform: "uppercase",
          borderWidth: "4px",
          boxShadow: "4px 4px 0px var(--primary)",
          zIndex: 1,
        }}
      >
        TIENDA OFICIAL
      </h2>

      <p style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", opacity: 0.8, zIndex: 1 }}>
        APOYA A LA RADIO, VÍSTETE BRUTAL.
      </p>

      {/* ADMIN ONLY: BOTÓN PARA AGREGAR ROPA / PRODUCTO */}
      {userIsAdmin && (
        <div style={{ width: "100%", maxWidth: "800px", display: "flex", justifyContent: "flex-end", marginTop: "4px", zIndex: 2 }}>
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

      {/* COMPACT PRODUCT GRID */}
      <div className="store-products-grid">
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {/* Product Card */}
            <div
              onClick={() => handleOpenDetail(product)}
              className="neo-card store-card-hover"
              style={{
                width: "100%",
                aspectRatio: "1/1",
                transform: `rotate(${product.rotation}deg)`,
                overflow: "hidden",
                boxShadow: product.isFeatured ? "6px 6px 0px var(--primary)" : "4px 4px 0px var(--primary)",
                borderWidth: product.isFeatured ? "4px" : "3px",
                borderColor: product.isFeatured ? "var(--primary-container)" : "var(--primary)",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                {product.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      backgroundColor: product.isFeatured ? "var(--primary-container)" : "var(--card-bg)",
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
                  <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "5px", zIndex: 15 }}>
                    <button
                      onClick={(e) => handleOpenEdit(e, product)}
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
                      onClick={(e) => handleDeleteProduct(e, product)}
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
                  {product.price}
                </div>
              </div>
            </div>

            {/* Product Name */}
            <h4
              onClick={() => handleOpenDetail(product)}
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
              onClick={() => addToCart(product, product.colors[0], product.sizes[0])}
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
        ))}
      </div>

      {/* NEO-BRUTALIST PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div
          style={{
            position: "fixed",
            top: 0, // Cover the header!
            left: 0,
            width: "100vw",
            height: "100vh", // Full screen
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 3000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "80px 16px 40px 16px",
            overflowY: "auto",
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="neo-card scanlines"
            style={{
              backgroundColor: "var(--background)",
              backgroundImage: selectedProduct.isFeatured
                ? "repeating-linear-gradient(-45deg, rgba(204, 255, 0, 0.04) 0px, rgba(204, 255, 0, 0.04) 10px, transparent 10px, transparent 20px)"
                : "none",
              border: selectedProduct.isFeatured ? "4px solid var(--primary-container)" : "4px solid var(--primary)",
              boxShadow: "10px 10px 0px var(--primary)",
              width: "100%",
              maxWidth: "760px",
              padding: "24px",
              position: "relative",
              transform: "rotate(0.5deg)",
              margin: "0 auto",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent click-away
          >
            {/* Tilted Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                position: "absolute",
                top: "-15px",
                right: "15px",
                backgroundColor: "var(--error)",
                color: "white",
                border: "2.5px solid var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
                padding: "4px 10px",
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "0.75rem",
                fontWeight: 900,
                cursor: "pointer",
                transform: "rotate(-3deg)",
                zIndex: 10,
              }}
            >
              CERRAR X
            </button>

            {/* Split layout wrapper */}
            <div className="modal-split-container">
              {/* Left Column: Carousel */}
              <div className="modal-split-left">
                {/* Main Image Container */}
                <div
                  className="neo-card"
                  style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    borderWidth: "3px",
                    boxShadow: "5px 5px 0px var(--primary)",
                    transform: "rotate(-1.5deg)",
                    overflow: "hidden",
                    backgroundColor: "white",
                    position: "relative",
                  }}
                >
                  {/* Badge Overlay */}
                  {selectedProduct.badge && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        backgroundColor: "var(--primary-container)",
                        color: "var(--primary)",
                        border: "2px solid var(--primary)",
                        padding: "3px 8px",
                        fontSize: "0.65rem",
                        fontWeight: 900,
                        zIndex: 10,
                        transform: "rotate(-4deg)",
                        boxShadow: "2px 2px 0px var(--primary)",
                        textTransform: "uppercase",
                      }}
                    >
                      {selectedProduct.badge}
                    </div>
                  )}

                  <img
                    src={activeImages[activeImgIndex] || selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* Carousel Navigation Arrows */}
                  {activeImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        aria-label="Foto anterior"
                        className="neo-button"
                        style={{
                          position: "absolute",
                          left: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "white",
                          border: "2.5px solid var(--primary)",
                          boxShadow: "2px 2px 0px var(--primary)",
                          cursor: "pointer",
                          zIndex: 20,
                          fontWeight: 900,
                        }}
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        aria-label="Foto siguiente"
                        className="neo-button"
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "white",
                          border: "2.5px solid var(--primary)",
                          boxShadow: "2px 2px 0px var(--primary)",
                          cursor: "pointer",
                          zIndex: 20,
                          fontWeight: 900,
                        }}
                      >
                        ▶
                      </button>
                    </>
                  )}

                  {/* Indicator Index Pill */}
                  {activeImages.length > 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        backgroundColor: "var(--primary-container)",
                        color: "var(--primary)",
                        border: "2px solid var(--primary)",
                        padding: "2px 6px",
                        fontSize: "0.6rem",
                        fontWeight: 900,
                        boxShadow: "1px 1px 0px var(--primary)",
                        textAlign: "right",
                        maxWidth: "100px",
                      }}
                    >
                      {getLabelForImage(activeImages[activeImgIndex]) || `${activeImgIndex + 1} / ${activeImages.length}`}
                    </div>
                  )}

                  {/* Price Tag overlay badge */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      right: "10px",
                      backgroundColor: "var(--primary)",
                      color: "white",
                      border: "2px solid var(--primary-container)",
                      padding: "4px 8px",
                      fontSize: "0.8rem",
                      fontWeight: 900,
                      boxShadow: "1.5px 1.5px 0px var(--primary)",
                      transform: "rotate(-3deg)",
                    }}
                  >
                    {selectedProduct.price}
                  </div>
                </div>

                {/* Thumbnails grid below active image */}
                {activeImages.length > 1 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "12px",
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {activeImages.map((imgUrl, idx) => {
                      const isActive = idx === activeImgIndex;
                      const label = getLabelForImage(imgUrl);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleThumbnailSelect(idx)}
                          className="store-card-hover"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "3px",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              border: isActive ? "3px solid var(--primary-container)" : "2px solid var(--primary)",
                              boxShadow: isActive ? "2px 2px 0px var(--primary)" : "1px 1px 0px var(--primary)",
                              overflow: "hidden",
                              backgroundColor: "white",
                              transform: isActive ? "scale(1.05) rotate(-1deg)" : "none",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={label || `Vista ${idx + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          {label && (
                            <span
                              style={{
                                fontSize: "0.45rem",
                                fontWeight: 900,
                                textTransform: "uppercase",
                                color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                                textAlign: "center",
                                maxWidth: "52px",
                                lineHeight: "0.55rem",
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Title, Description, Selectors, Button */}
              <div className="modal-split-right">
                <div>
                  <span
                    style={{
                      backgroundColor: "var(--primary-container)",
                      border: "1.5px solid var(--primary)",
                      padding: "2px 6px",
                      fontSize: "0.6rem",
                      fontWeight: 900,
                      width: "max-content",
                      display: "block",
                      transform: "rotate(1deg)",
                      marginBottom: "6px",
                    }}
                  >
                    PRENDA OFICIAL
                  </span>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      lineHeight: "1.7rem",
                      color: "var(--primary)",
                      marginBottom: "4px",
                    }}
                  >
                    {selectedProduct.name}
                  </h3>
                  <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--primary)" }}>
                    {selectedProduct.price}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <button
                    onClick={() => setDescriptionExpanded(!isDescriptionExpanded)}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "var(--primary-container)",
                      border: "2px solid var(--primary)",
                      padding: "6px 12px",
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      boxShadow: "2px 2px 0px var(--primary)",
                      marginBottom: "6px",
                    }}
                  >
                    <span>Detalles del producto</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                      {isDescriptionExpanded ? "▲" : "▼"}
                    </span>
                  </button>

                  <div
                    style={{
                      maxHeight: isDescriptionExpanded ? "500px" : "0px",
                      overflow: "hidden",
                      transition: "max-height 0.3s ease, padding 0.3s ease, border 0.3s ease",
                      border: isDescriptionExpanded ? "2px solid var(--primary)" : "none",
                      backgroundColor: "white",
                      padding: isDescriptionExpanded ? "10px" : "0 10px",
                      fontSize: "0.7rem",
                      opacity: 0.9,
                      lineHeight: "1.1rem",
                    }}
                  >
                    {selectedProduct.description}
                  </div>
                </div>

                {/* Colors / Views */}
                <div>
                  <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "6px" }}>
                    Variantes / Vistas:
                  </h5>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {selectedProduct.colors.map((color, colorIdx) => {
                      // A chip is "active" if it's the selectedColor OR if its index matches the active image
                      const mappedUrl = selectedProduct.variantImages?.[color];
                      const mappedIndex = mappedUrl ? activeImages.indexOf(mappedUrl) : colorIdx;
                      const isSelected = selectedColor === color || mappedIndex === activeImgIndex;
                      return (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          style={{
                            backgroundColor: isSelected ? "var(--primary)" : "white",
                            color: isSelected ? "var(--on-primary)" : "var(--primary)",
                            border: "2px solid var(--primary)",
                            padding: "4px 10px",
                            fontSize: "0.6rem",
                            fontWeight: 900,
                            cursor: "pointer",
                            boxShadow: isSelected ? "1px 1px 0px var(--primary)" : "2px 2px 0px var(--primary)",
                            transform: isSelected ? "translate(1px, 1px)" : "none",
                          }}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "6px" }}>
                    Tallas disponibles:
                  </h5>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {selectedProduct.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          style={{
                            backgroundColor: isSelected ? "var(--primary-container)" : "white",
                            color: "var(--primary)",
                            border: "2px solid var(--primary)",
                            padding: "4px 10px",
                            fontSize: "0.6rem",
                            fontWeight: 900,
                            cursor: "pointer",
                            boxShadow: isSelected ? "1px 1px 0px var(--primary)" : "2px 2px 0px var(--primary)",
                            transform: isSelected ? "translate(1px, 1px)" : "none",
                          }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Guide & Technical Specs Button */}
                <button
                  onClick={() => setSpecsOpen(true)}
                  className="neo-button"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    border: "2px solid var(--primary)",
                    boxShadow: "2px 2px 0px var(--primary)",
                    padding: "4px 8px",
                    fontSize: "0.6rem",
                    fontWeight: 900,
                    cursor: "pointer",
                    width: "max-content",
                    marginTop: "4px",
                    transform: "rotate(1deg)",
                  }}
                >
                  📐 MEDIDAS Y ESPECIFICACIONES
                </button>

                {/* Add to Cart Action */}
                <button
                  onClick={() => {
                    addToCart(selectedProduct, selectedColor, selectedSize);
                    setSelectedProduct(null);
                  }}
                  className="neo-button"
                  style={{
                    backgroundColor: "var(--primary-container)",
                    border: "3.5px solid var(--primary)",
                    padding: "10px",
                    fontSize: "0.8rem",
                    fontWeight: 900,
                    width: "100%",
                    boxShadow: "3px 3px 0px var(--primary)",
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <ShoppingCart size={14} />
                  <span>AÑADIR AL CARRITO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEO-BRUTALIST SPECIFICATIONS & SIZE GUIDE MODAL */}
      {isSpecsOpen && selectedProduct && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(5px)",
            zIndex: 3500, // superposed on top of details modal (3000)
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setSpecsOpen(false)}
        >
          <div
            className="neo-card scanlines"
            style={{
              backgroundColor: "var(--background)",
              border: "4px solid var(--primary)",
              boxShadow: "8px 8px 0px var(--primary)",
              width: "100%",
              maxWidth: "680px",
              padding: "24px",
              position: "relative",
              transform: "translateY(20px) rotate(-0.5deg)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing
          >
            {/* Specs Close Button */}
            <button
              onClick={() => setSpecsOpen(false)}
              style={{
                position: "absolute",
                top: "-12px",
                right: "12px",
                backgroundColor: "var(--error)",
                color: "white",
                border: "2px solid var(--primary)",
                boxShadow: "2px 2px 0px var(--primary)",
                padding: "3px 8px",
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "0.65rem",
                fontWeight: 900,
                cursor: "pointer",
                transform: "rotate(3deg)",
                zIndex: 10,
              }}
            >
              CERRAR X
            </button>

            {/* Header */}
            <div>
              <span
                style={{
                  backgroundColor: "var(--primary-container)",
                  border: "1.5px solid var(--primary)",
                  padding: "2px 6px",
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  width: "max-content",
                  display: "block",
                  transform: "rotate(-1deg)",
                  marginBottom: "6px",
                }}
              >
                FICHA TÉCNICA Y TALLAS
              </span>
              <h4
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: "var(--primary)",
                }}
              >
                {selectedProduct.name}
              </h4>
            </div>

            {/* Split layout: Sizing vs Technical Specs */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "20px",
                width: "100%",
              }}
            >
              {/* Left Column: Sizing / Dimensions */}
              <div style={{ flex: "1 1 260px", minWidth: "260px" }}>
                {selectedProduct.id !== "4" ? (
                  /* TABLA DE MEDIDAS PARA ROPA */
                  <div>
                    <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "6px" }}>
                      📏 Tabla de Medidas (Prenda plana):
                    </h5>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        border: "3px solid var(--primary)",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "white",
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: "var(--primary-container)", borderBottom: "3px solid var(--primary)" }}>
                          <th style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>TALLA</th>
                          <th style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>ANCHO (cm)</th>
                          <th style={{ padding: "6px" }}>LARGO (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "2px solid var(--primary)" }}>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)", fontWeight: 900 }}>S</td>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>50 cm</td>
                          <td style={{ padding: "6px" }}>68 cm</td>
                        </tr>
                        <tr style={{ borderBottom: "2px solid var(--primary)" }}>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)", fontWeight: 900 }}>M</td>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>53 cm</td>
                          <td style={{ padding: "6px" }}>71 cm</td>
                        </tr>
                        <tr style={{ borderBottom: "2px solid var(--primary)" }}>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)", fontWeight: 900 }}>L</td>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>56 cm</td>
                          <td style={{ padding: "6px" }}>74 cm</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)", fontWeight: 900 }}>XL</td>
                          <td style={{ padding: "6px", borderRight: "2px solid var(--primary)" }}>60 cm</td>
                          <td style={{ padding: "6px" }}>77 cm</td>
                        </tr>
                      </tbody>
                    </table>
                    <p style={{ fontSize: "0.55rem", marginTop: "4px", color: "var(--secondary)" }}>
                      * Margen +/- 1.5 cm. Medidas de sisa a sisa.
                    </p>
                  </div>
                ) : (
                  /* DETALLES DE MEDIDA PARA STICKER PACK */
                  <div>
                    <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "6px" }}>
                      📏 Dimensiones físicas:
                    </h5>
                    <div
                      style={{
                        border: "2px solid var(--primary)",
                        padding: "8px",
                        backgroundColor: "white",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div>• Sticker promedio: ~ 8.0 cm x 8.0 cm</div>
                      <div>• Formato de corte: Troquelado (Die-cut)</div>
                      <div>• Empaque: 10.0 x 15.0 cm en sobre kraft</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Technical Specs */}
              <div style={{ flex: "1 1 260px", minWidth: "260px" }}>
                <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "6px" }}>
                  ⚙️ Especificaciones Técnicas:
                </h5>
                <div
                  style={{
                    border: "2px solid var(--primary)",
                    padding: "8px",
                    backgroundColor: "white",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    whiteSpace: "pre-line",
                  }}
                >
                  {selectedProduct.specs
                    ? selectedProduct.specs
                    : <span style={{ opacity: 0.5 }}>Sin especificaciones cargadas.</span>
                  }
                </div>
              </div>
            </div>

            {/* INSTRUCCIONES DE CUIDADO */}
            <div>
              <h5 style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "4px" }}>
                🧼 Cuidado y Durabilidad:
              </h5>
              <p style={{ fontSize: "0.6rem", opacity: 0.9, lineHeight: "0.85rem", whiteSpace: "pre-line" }}>
                {selectedProduct.careInstructions
                  ? selectedProduct.careInstructions
                  : selectedProduct.id !== "4"
                    ? "Lavar a máquina en ciclo suave con agua fría. Lavar al revés para proteger el estampado. No usar blanqueador. Secar colgado a la sombra. No planchar sobre el diseño."
                    : "Limpiar y secar la superficie antes de pegar. Apto para laptops, guitarras, patinetas, termos y automóviles. Resistente al agua."}
              </p>
            </div>

            {/* Aceptar / Volver */}
            <button
              onClick={() => setSpecsOpen(false)}
              className="neo-button"
              style={{
                backgroundColor: "var(--primary-container)",
                border: "2.5px solid var(--primary)",
                padding: "8px",
                fontSize: "0.7rem",
                fontWeight: 900,
                boxShadow: "2px 2px 0px var(--primary)",
                cursor: "pointer",
                textAlign: "center",
                width: "100%",
                marginTop: "4px",
              }}
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}

      {/* MODAL ADMIN: AGREGAR PRENDA / PRODUCTO A LA TIENDA */}
      <NeoModal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isSubmittingProduct) {
            setAddModalOpen(false);
            setProductSuccessMsg(null);
          }
        }}
        title="AGREGAR PRENDA A LA TIENDA"
        badgeText="⚡ PANEL DE ADMINISTRADOR"
        maxWidth="500px"
        backgroundColor="var(--background)"
      >
        {productSuccessMsg ? (
          <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "var(--primary-container)", border: "3px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={28} style={{ color: "var(--primary)" }} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
              ¡PRENDA AGREGADA CON ÉXITO!
            </h3>
            <p style={{ fontSize: "0.75rem", fontWeight: "bold", opacity: 0.85, margin: 0 }}>
              {productSuccessMsg}
            </p>
          </div>
        ) : (
          <form onSubmit={handleCreateProduct} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
            {/* Fotos de la prenda / Multi-Uploader con nombres de vistas */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <ImageIcon size={14} /> FOTOS Y VISTAS ({newProdImagePreviews.length}) *
              </label>

              {newProdImagePreviews.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      padding: "8px",
                      border: "2px solid var(--primary)",
                      backgroundColor: "white",
                      borderRadius: "4px",
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}
                  >
                    {newProdImagePreviews.map((previewUrl, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "6px",
                          border: idx === 0 ? "2px solid var(--primary)" : "1px solid #ddd",
                          backgroundColor: idx === 0 ? "rgba(186, 26, 26, 0.04)" : "#fafafa",
                          borderRadius: "4px",
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            position: "relative",
                            width: "55px",
                            height: "55px",
                            borderRadius: "4px",
                            overflow: "hidden",
                            border: "1.5px solid var(--primary)",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={previewUrl}
                            alt={`Foto ${idx + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: idx === 0 ? "var(--primary-container)" : "rgba(0,0,0,0.7)",
                              color: idx === 0 ? "var(--primary)" : "white",
                              fontSize: "0.45rem",
                              fontWeight: 900,
                              textAlign: "center",
                              padding: "1px 0",
                            }}
                          >
                            #{idx + 1}
                          </div>
                        </div>

                        {/* Editable label & quick presets */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "0.6rem", fontWeight: 900, opacity: 0.8 }}>
                              {idx === 0 ? "FOTO 1 (PORTADA / COLOR)" : `FOTO ${idx + 1} (VISTA / VARIANTE)`}:
                            </span>
                          </div>
                          <input
                            type="text"
                            value={newProdImageLabels[idx] || ""}
                            onChange={(e) => handleUpdateImageLabel(idx, e.target.value)}
                            placeholder="Ej. MORADO, PARTE DE ATRÁS, VISTA LATERAL"
                            className="neo-input"
                            style={{
                              width: "100%",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              border: "1.5px solid var(--primary)",
                              backgroundColor: "white",
                            }}
                          />
                          {/* Quick label chips */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {["MORADO", "VISTA FRONTAL", "PARTE DE ATRÁS", "VISTA LATERAL", "DETALLE"].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleUpdateImageLabel(idx, preset)}
                                style={{
                                  padding: "2px 6px",
                                  fontSize: "0.55rem",
                                  fontWeight: 800,
                                  border: "1px solid #999",
                                  backgroundColor: newProdImageLabels[idx] === preset ? "var(--primary-container)" : "white",
                                  color: newProdImageLabels[idx] === preset ? "var(--primary)" : "#333",
                                  cursor: "pointer",
                                  borderRadius: "2px",
                                }}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{
                            backgroundColor: "#BA1A1A",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            width: "24px",
                            height: "24px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                          title="Eliminar esta foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Botón para agregar más imágenes */}
                  <label
                    style={{
                      border: "2px dashed var(--primary)",
                      borderRadius: "4px",
                      padding: "8px",
                      textAlign: "center",
                      backgroundColor: "rgba(0,0,0,0.02)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                    }}
                  >
                    <Upload size={16} /> AGREGAR MÁS FOTOS / VISTAS
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              ) : (
                <div
                  style={{
                    border: "2px dashed var(--primary)",
                    borderRadius: "4px",
                    padding: "16px",
                    textAlign: "center",
                    backgroundColor: "rgba(0,0,0,0.02)",
                    cursor: "pointer",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Upload size={28} style={{ color: "var(--primary)", opacity: 0.7 }} />
                  <span style={{ fontSize: "0.65rem", fontWeight: 800 }}>
                    HAZ CLICK PARA SELECCIONAR FOTOS (PUEDES ELEGIR VARIAS)
                  </span>
                  <span style={{ fontSize: "0.55rem", opacity: 0.7 }}>
                    PNG, JPG, WEBP • Puedes nombrar cada vista o color individualmente
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Nombre de la prenda */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                NOMBRE DE LA PRENDA *
              </label>
              <input
                type="text"
                required
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="EJ. POLERA DOBLE C OVERSIZE MORADA"
                className="neo-input"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.75rem",
                  border: "2px solid var(--primary)",
                  fontWeight: "bold",
                  backgroundColor: "white",
                }}
              />
            </div>

            {/* Precio & Badge */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  PRECIO (S/.) *
                </label>
                <input
                  type="text"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  placeholder="EJ. S/.79.90"
                  className="neo-input"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "0.75rem",
                    border: "2px solid var(--primary)",
                    fontWeight: "bold",
                    backgroundColor: "white",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  BADGE / ETIQUETA
                </label>
                <input
                  type="text"
                  value={newProdBadge}
                  onChange={(e) => setNewProdBadge(e.target.value)}
                  placeholder="EJ. 🔥 EXCLUSIVO"
                  className="neo-input"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "0.75rem",
                    border: "2px solid var(--primary)",
                    fontWeight: "bold",
                    backgroundColor: "white",
                  }}
                />
              </div>
            </div>

            {/* Tallas disponibles */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                TALLAS DISPONIBLES
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["S", "M", "L", "XL", "XXL", "ÚNICA"].map((size) => {
                  const isSelected = newProdSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleToggleSize(size)}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.65rem",
                        fontWeight: 900,
                        border: "2px solid var(--primary)",
                        backgroundColor: isSelected ? "var(--primary-container)" : "white",
                        color: "var(--primary)",
                        cursor: "pointer",
                        boxShadow: isSelected ? "2px 2px 0px var(--primary)" : "none",
                      }}
                    >
                      {size} {isSelected ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colores / Variantes */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
                  COLORES / VARIANTES (OPCIONAL)
                </label>
                <span style={{ fontSize: "0.55rem", opacity: 0.7, fontWeight: "bold" }}>
                  💡 Si lo dejas vacío, se usarán los nombres de tus fotos
                </span>
              </div>
              <input
                type="text"
                value={newProdColors}
                onChange={(e) => setNewProdColors(e.target.value)}
                placeholder="EJ. MORADO, PARTE DE ATRÁS, VISTA LATERAL"
                className="neo-input"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.75rem",
                  border: "2px solid var(--primary)",
                  fontWeight: "bold",
                  backgroundColor: "white",
                }}
              />
              {/* Sugerencias rápidas */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                {["MORADO", "PARTE DE ATRÁS", "VISTA LATERAL", "NEGRO", "BLANCO", "GRIS", "AZUL"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleAddColorChip(c)}
                    style={{
                      padding: "2px 8px",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      border: "1px solid var(--primary)",
                      backgroundColor: "white",
                      color: "var(--primary)",
                      cursor: "pointer",
                      borderRadius: "2px",
                    }}
                  >
                    + {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                DESCRIPCIÓN
              </label>
              <textarea
                rows={3}
                value={newProdDesc}
                onChange={(e) => setNewProdDesc(e.target.value)}
                placeholder="Algodón reactivo 100% pesado, estampado de alta durabilidad..."
                className="neo-input"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.75rem",
                  border: "2px solid var(--primary)",
                  fontWeight: "500",
                  backgroundColor: "white",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Especificaciones Técnicas */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                ⚙️ ESPECIFICACIONES TÉCNICAS (OPCIONAL)
              </label>
              <textarea
                rows={3}
                value={newProdSpecs}
                onChange={(e) => setNewProdSpecs(e.target.value)}
                placeholder={"Composición: 100% Algodón Peinado premium\nGramaje: 240 g/m²\nEstampado: Serigrafía textil"}
                className="neo-input"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.75rem",
                  border: "2px solid var(--primary)",
                  fontWeight: "500",
                  backgroundColor: "white",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Instrucciones de Cuidado */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                🧼 INSTRUCCIONES DE CUIDADO (OPCIONAL)
              </label>
              <textarea
                rows={2}
                value={newProdCare}
                onChange={(e) => setNewProdCare(e.target.value)}
                placeholder={"Lavar a máquina en ciclo suave con agua fría.\nNo usar blanqueador. Secar colgado."}
                className="neo-input"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.75rem",
                  border: "2px solid var(--primary)",
                  fontWeight: "500",
                  backgroundColor: "white",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmittingProduct}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: isSubmittingProduct ? "var(--surface-container)" : "var(--primary-container)",
                color: "var(--primary)",
                border: "3px solid var(--primary)",
                padding: "10px",
                fontSize: "0.75rem",
                fontWeight: 900,
                boxShadow: "3px 3px 0px var(--primary)",
                cursor: isSubmittingProduct ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "6px",
              }}
            >
              {isSubmittingProduct ? "SUBIENDO PRENDA Y FOTOS..." : "GUARDAR PRENDA EN LA TIENDA ⚡"}
            </button>
          </form>
        )}
      </NeoModal>

      {/* MODAL ADMIN: EDITAR PRENDA */}
      <NeoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSubmittingEdit) {
            setEditModalOpen(false);
            setEditingProduct(null);
            setEditSuccessMsg(null);
          }
        }}
        title={`EDITAR: ${editingProduct?.name || ""}`}
        badgeText="✏️ EDICIÓN (ADMIN)"
        maxWidth="500px"
        backgroundColor="var(--background)"
      >
        {editSuccessMsg ? (
          <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "var(--primary-container)", border: "3px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={28} style={{ color: "var(--primary)" }} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>¡ACTUALIZADO!</h3>
            <p style={{ fontSize: "0.75rem", fontWeight: "bold", opacity: 0.85, margin: 0 }}>{editSuccessMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleUpdateProduct} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
            {/* Nombre */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>NOMBRE *</label>
              <input
                type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                className="neo-input"
                style={{ width: "100%", padding: "8px 10px", fontSize: "0.75rem", border: "2px solid var(--primary)", fontWeight: "bold", backgroundColor: "white" }}
              />
            </div>

            {/* Precio & Badge */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>PRECIO (S/.) *</label>
                <input
                  type="text" required value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="79.90"
                  className="neo-input"
                  style={{ width: "100%", padding: "8px 10px", fontSize: "0.75rem", border: "2px solid var(--primary)", fontWeight: "bold", backgroundColor: "white" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>BADGE</label>
                <input
                  type="text" value={editBadge} onChange={(e) => setEditBadge(e.target.value)}
                  placeholder="🔥 EXCLUSIVO"
                  className="neo-input"
                  style={{ width: "100%", padding: "8px 10px", fontSize: "0.75rem", border: "2px solid var(--primary)", fontWeight: "bold", backgroundColor: "white" }}
                />
              </div>
            </div>

            {/* Tallas */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>TALLAS</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["S", "M", "L", "XL", "XXL", "ÚNICA"].map((size) => {
                  const isSel = editSizes.includes(size);
                  return (
                    <button
                      key={size} type="button"
                      onClick={() => setEditSizes((prev) => isSel ? prev.filter((s) => s !== size) : [...prev, size])}
                      style={{
                        padding: "4px 10px", fontSize: "0.65rem", fontWeight: 900, border: "2px solid var(--primary)",
                        backgroundColor: isSel ? "var(--primary-container)" : "white", color: "var(--primary)",
                        cursor: "pointer", boxShadow: isSel ? "2px 2px 0px var(--primary)" : "none",
                      }}
                    >
                      {size} {isSel ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colores */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>COLORES / VARIANTES</label>
              <input
                type="text" value={editColors} onChange={(e) => setEditColors(e.target.value)}
                placeholder="MORADO, PARTE DE ATRÁS, VISTA LATERAL"
                className="neo-input"
                style={{ width: "100%", padding: "8px 10px", fontSize: "0.75rem", border: "2px solid var(--primary)", fontWeight: "bold", backgroundColor: "white" }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                {["VISTA FRONTAL", "PARTE DE ATRÁS", "VISTA LATERAL", "MORADO", "NEGRO", "BLANCO", "GRIS", "AZUL", "ROJO"].map((c) => (
                  <button
                    key={c} type="button"
                    onClick={() => setEditColors((prev) => {
                      const list = prev.split(",").map((s) => s.trim()).filter(Boolean);
                      if (!list.includes(c)) return list.length > 0 ? `${prev}, ${c}` : c;
                      return prev;
                    })}
                    style={{ padding: "2px 8px", fontSize: "0.6rem", fontWeight: 800, border: "1px solid var(--primary)", backgroundColor: "white", color: "var(--primary)", cursor: "pointer", borderRadius: "2px" }}
                  >
                    + {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>DESCRIPCIÓN</label>
              <textarea
                rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Descripción de la prenda..."
                className="neo-input"
                style={{ width: "100%", padding: "8px 10px", fontSize: "0.75rem", border: "2px solid var(--primary)", fontWeight: "500", backgroundColor: "white", resize: "vertical" }}
              />
            </div>

            {/* Especificaciones técnicas */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>⚙️ ESPECIFICACIONES TÉCNICAS</label>
              <textarea
                rows={3} value={editSpecs} onChange={(e) => setEditSpecs(e.target.value)}
                placeholder={"Composición: 100% Algodón Peinado premium\nGramaje: 240 g/m²"}
                className="neo-input"
                style={{ width: "100%", padding: "8px 10px", fontSize: "0.75rem", border: "2px solid var(--primary)", fontWeight: "500", backgroundColor: "white", resize: "vertical" }}
              />
            </div>

            {/* Instrucciones de cuidado */}
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>🧼 INSTRUCCIONES DE CUIDADO</label>
              <textarea
                rows={2} value={editCare} onChange={(e) => setEditCare(e.target.value)}
                placeholder={"Lavar a máquina en ciclo suave con agua fría.\nNo usar blanqueador."}
                className="neo-input"
                style={{ width: "100%", padding: "8px 10px", fontSize: "0.75rem", border: "2px solid var(--primary)", fontWeight: "500", backgroundColor: "white", resize: "vertical" }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmittingEdit}
              className="neo-button fun-hover-wobble"
              style={{
                backgroundColor: isSubmittingEdit ? "var(--surface-container)" : "#1A6BB5",
                color: "white",
                border: "3px solid var(--primary)",
                padding: "10px",
                fontSize: "0.75rem",
                fontWeight: 900,
                boxShadow: "3px 3px 0px var(--primary)",
                cursor: isSubmittingEdit ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "6px",
              }}
            >
              {isSubmittingEdit ? "GUARDANDO CAMBIOS..." : "GUARDAR CAMBIOS ✓"}
            </button>
          </form>
        )}
      </NeoModal>
    </div>
  );
};

