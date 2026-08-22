import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  CreateProductInput,
  UpdateProductInput,
} from "@/services/productService";
import { Product } from "@/types";

export const PRODUCTS_QUERY_KEY = ["store_products"] as const;

/**
 * Custom React Query hook for fetching store products with cache and background revalidation
 */
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: fetchStoreProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
}

/**
 * Custom React Query mutation hook for creating a product with cache invalidation
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createStoreProduct(input),
    onSuccess: (newProduct) => {
      // Optimistically update cache and then invalidate for fresh data
      queryClient.setQueryData<Product[]>(PRODUCTS_QUERY_KEY, (old) => {
        return old ? [newProduct, ...old] : [newProduct];
      });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

/**
 * Custom React Query mutation hook for updating a product with cache invalidation
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateStoreProduct(input),
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData<Product[]>(PRODUCTS_QUERY_KEY, (old) => {
        return old
          ? old.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
          : [updatedProduct];
      });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

/**
 * Custom React Query mutation hook for deleting a product with cache invalidation
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, driveFileId }: { productId: string; driveFileId?: string }) =>
      deleteStoreProduct(productId, driveFileId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<Product[]>(PRODUCTS_QUERY_KEY, (old) => {
        return old ? old.filter((p) => p.id !== variables.productId) : [];
      });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}
