import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import { STORE_PRODUCTS } from "@/constants";

export type { Product };

export interface CreateProductInput {
  name: string;
  price: string;
  description: string;
  imageFile?: File | null;
  imageFiles?: File[];
  imageLabels?: string[];
  imageUrl?: string;
  colors?: string[];
  sizes?: string[];
  badge?: string;
  isFeatured?: boolean;
  specs?: string;
  careInstructions?: string;
}

interface DbProductRow {
  id: string;
  name: string;
  price: string;
  image_url: string;
  rotation?: number | string | null;
  description?: string | null;
  colors?: string[] | null;
  sizes?: string[] | null;
  variant_images?: Record<string, string> | null;
  badge?: string | null;
  is_featured?: boolean | null;
  drive_file_id?: string | null;
  specs?: string | null;
  care_instructions?: string | null;
}

export async function fetchStoreProducts(): Promise<Product[]> {
  try {
    if (!supabase) return STORE_PRODUCTS;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("No se pudieron cargar productos de Supabase:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Mapear exclusivamente productos de Supabase
    const dbProducts: Product[] = (data as DbProductRow[]).map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.image_url,
      rotation: Number(item.rotation) || 0,
      description: item.description || "",
      colors: Array.isArray(item.colors) ? item.colors : ["ÚNICO"],
      sizes: Array.isArray(item.sizes) ? item.sizes : ["S", "M", "L", "XL"],
      variantImages: item.variant_images || undefined,
      badge: item.badge || undefined,
      isFeatured: Boolean(item.is_featured),
      driveFileId: item.drive_file_id || undefined,
      specs: item.specs || undefined,
      careInstructions: item.care_instructions || undefined,
    }));

    return dbProducts;
  } catch (err) {
    console.error("Error al obtener productos:", err);
    return [];
  }
}

export async function uploadProductImageFile(file: File, namePrefix: string): Promise<{ url: string; storagePath: string }> {
  if (!supabase) throw new Error("No se pudo subir la imagen: Supabase no disponible");

  const ext = file.name.split(".").pop() || "png";
  const safePrefix = namePrefix.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const filePath = `products/${safePrefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("store")
    .upload(filePath, file, { contentType: file.type || "image/png", upsert: true });

  if (uploadError) {
    console.error("Error al subir imagen a Supabase Storage:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from("store").getPublicUrl(filePath);
  return { url: data.publicUrl, storagePath: filePath };
}

export async function createStoreProduct(input: CreateProductInput): Promise<Product> {
  let finalImageUrl = input.imageUrl || "/store/polera-doblec-ancha-congorro.png";
  let driveFileId: string | undefined = undefined;
  let variantImages: Record<string, string> | undefined = undefined;

  const filesToUpload: File[] = [];
  if (input.imageFiles && input.imageFiles.length > 0) {
    filesToUpload.push(...input.imageFiles);
  } else if (input.imageFile) {
    filesToUpload.push(input.imageFile);
  }

  // Subir fotos en paralelo
  if (filesToUpload.length > 0) {
    const uploadResults = await Promise.all(
      filesToUpload.map((file, idx) =>
        uploadProductImageFile(file, `${input.name}-${idx + 1}`)
      )
    );

    const urls = uploadResults.map((r) => r.url);
    const storagePaths = uploadResults.map((r) => r.storagePath).filter(Boolean);

    finalImageUrl = urls[0];
    driveFileId = storagePaths.join(",");

    // Asociar a variantImages para activar el carrusel de vistas/colores
    variantImages = {};
    const labelsList = input.imageLabels && input.imageLabels.length > 0
      ? input.imageLabels
      : (input.colors && input.colors.length > 0 ? input.colors : []);

    urls.forEach((url, i) => {
      const rawLabel = labelsList[i] || (i === 0 ? "VISTA FRONTAL" : `VISTA ${i + 1}`);
      const cleanLabel = rawLabel.trim().toUpperCase() || `FOTO ${i + 1}`;
      variantImages![cleanLabel] = url;
    });
  }

  const productId = `prod_${Date.now()}`;
  const randomRotation = (Math.random() * 6 - 3).toFixed(1);

  // Derivar colores desde colors o desde las etiquetas de las variantes
  const derivedColors = input.colors && input.colors.length > 0
    ? input.colors
    : (variantImages ? Object.keys(variantImages) : ["ESTÁNDAR"]);

  const newProduct: Product = {
    id: productId,
    name: input.name.trim().toUpperCase(),
    price: input.price.startsWith("S/") ? input.price : `S/.${input.price.replace(/[^0-9.]/g, "")}`,
    imageUrl: finalImageUrl,
    rotation: parseFloat(randomRotation),
    description: input.description.trim(),
    colors: derivedColors,
    sizes: input.sizes && input.sizes.length > 0 ? input.sizes : ["S", "M", "L", "XL"],
    variantImages,
    badge: input.badge || "🔥 NUEVO",
    isFeatured: Boolean(input.isFeatured),
    driveFileId,
    specs: input.specs?.trim() || undefined,
    careInstructions: input.careInstructions?.trim() || undefined,
  };

  if (supabase) {
    const { error } = await supabase.from("products").insert({
      id: newProduct.id,
      name: newProduct.name,
      price: newProduct.price,
      image_url: newProduct.imageUrl,
      rotation: newProduct.rotation,
      description: newProduct.description,
      colors: newProduct.colors,
      sizes: newProduct.sizes,
      variant_images: newProduct.variantImages,
      badge: newProduct.badge,
      is_featured: newProduct.isFeatured,
      drive_file_id: driveFileId,
      specs: newProduct.specs || null,
      care_instructions: newProduct.careInstructions || null,
    });

    if (error) {
      console.error("Error al insertar producto en Supabase:", error);
      throw new Error(`Error al guardar producto: ${error.message}`);
    }
  }

  return newProduct;
}

export interface UpdateProductInput {
  id: string;
  name?: string;
  price?: string;
  description?: string;
  badge?: string;
  sizes?: string[];
  colors?: string[];
  variantImages?: Record<string, string>;
  imageUrl?: string;
  imageFiles?: File[];
  imageLabels?: string[];
  specs?: string;
  careInstructions?: string;
}

export async function updateStoreProduct(input: UpdateProductInput): Promise<Product> {
  const newVariantImages = input.variantImages ? { ...input.variantImages } : {};
  let finalImageUrl = input.imageUrl;

  if (input.imageFiles && input.imageFiles.length > 0) {
    const uploadResults = await Promise.all(
      input.imageFiles.map((file, idx) =>
        uploadProductImageFile(file, `${input.name || "prod"}-${Date.now()}-${idx + 1}`)
      )
    );

    const urls = uploadResults.map((r) => r.url);
    const labels = input.imageLabels || [];

    urls.forEach((url, i) => {
      const label = labels[i] || `VISTA ${Object.keys(newVariantImages).length + 1}`;
      newVariantImages[label.trim().toUpperCase()] = url;
    });

    if (!finalImageUrl && urls.length > 0) {
      finalImageUrl = urls[0];
    }
  }

  const variantKeys = Object.keys(newVariantImages);
  if ((!finalImageUrl || finalImageUrl === "") && variantKeys.length > 0) {
    finalImageUrl = newVariantImages[variantKeys[0]];
  }

  const derivedColors = input.colors && input.colors.length > 0
    ? input.colors
    : (variantKeys.length > 0 ? variantKeys : ["ESTÁNDAR"]);

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name.trim().toUpperCase();
  if (input.price !== undefined) updates.price = input.price.startsWith("S/") ? input.price : `S/.${input.price.replace(/[^0-9.]/g, "")}`;
  if (input.description !== undefined) updates.description = input.description.trim();
  if (input.badge !== undefined) updates.badge = input.badge;
  if (input.sizes !== undefined) updates.sizes = input.sizes;
  if (input.specs !== undefined) updates.specs = input.specs.trim() || null;
  if (input.careInstructions !== undefined) updates.care_instructions = input.careInstructions.trim() || null;
  updates.colors = derivedColors;
  updates.variant_images = Object.keys(newVariantImages).length > 0 ? newVariantImages : null;
  if (finalImageUrl) updates.image_url = finalImageUrl;

  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar producto en Supabase:", error);
      throw new Error(`Error al actualizar: ${error.message}`);
    }

    if (data) {
      const row = data as DbProductRow;
      return {
        id: row.id,
        name: row.name,
        price: row.price,
        imageUrl: row.image_url,
        rotation: Number(row.rotation) || 0,
        description: row.description || "",
        colors: Array.isArray(row.colors) ? row.colors : derivedColors,
        sizes: Array.isArray(row.sizes) ? row.sizes : ["S", "M", "L", "XL"],
        variantImages: row.variant_images || undefined,
        badge: row.badge || undefined,
        isFeatured: Boolean(row.is_featured),
        driveFileId: row.drive_file_id || undefined,
        specs: row.specs || undefined,
        careInstructions: row.care_instructions || undefined,
      };
    }
  }

  return {
    id: input.id,
    name: input.name || "",
    price: input.price || "",
    imageUrl: finalImageUrl || "/store/polera-doblec-ancha-congorro.png",
    rotation: 0,
    description: input.description || "",
    colors: derivedColors,
    sizes: input.sizes || ["S", "M", "L", "XL"],
    variantImages: newVariantImages,
    badge: input.badge,
  };
}

export async function deleteStoreProduct(productId: string, driveFileId?: string): Promise<boolean> {
  if (driveFileId && supabase) {
    const ids = driveFileId.split(",").map((s) => s.trim()).filter(Boolean);
    const storagePaths = ids.filter((id) => id.startsWith("products/"));
    if (storagePaths.length > 0) {
      await supabase.storage.from("store").remove(storagePaths);
    }
  }

  if (supabase) {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      console.error("Error al eliminar producto de Supabase:", error);
      throw new Error(`Error al eliminar: ${error.message}`);
    }
  }

  return true;
}
