"use client";

import { useState, useEffect, MouseEvent } from "react";
import { Product } from "@/types";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "./useProductsQuery";
import { CreateProductInput, UpdateProductInput } from "@/services/productService";

export function useStoreModals(onModalToggle?: (isOpen: boolean) => void) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSpecsOpen, setSpecsOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Notify parent on modal state change for z-index / layout stacking
  useEffect(() => {
    if (onModalToggle) {
      onModalToggle(Boolean(selectedProduct || isAddModalOpen || editingProduct || isSpecsOpen));
    }
  }, [selectedProduct, isAddModalOpen, editingProduct, isSpecsOpen, onModalToggle]);

  const handleOpenDetail = (product: Product) => {
    setSelectedProduct(product);
    setSpecsOpen(false);
  };

  const handleOpenEdit = (e: MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProduct(product);
  };

  const handleDeleteProduct = async (e: MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`¿Eliminar la prenda "${product.name}" de la tienda?`)) return;

    try {
      await deleteProductMutation.mutateAsync({
        productId: product.id,
        driveFileId: product.driveFileId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al eliminar: ${msg}`);
    }
  };

  const handleCreateProduct = async (input: CreateProductInput) => {
    await createProductMutation.mutateAsync(input);
  };

  const handleUpdateProduct = async (input: UpdateProductInput) => {
    await updateProductMutation.mutateAsync(input);
  };

  return {
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
    isSubmittingCreate: createProductMutation.isPending,
    isSubmittingEdit: updateProductMutation.isPending,
  };
}
