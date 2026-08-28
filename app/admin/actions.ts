'use server';

import { redirect } from 'next/navigation';
import { createSession, getSession, deleteSession } from '@/lib/session';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';

export interface ActionResponse {
  error?: string;
  success?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function loginAction(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const username = formData.get('username');
  const password = formData.get('password');

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'password123';

  if (username === adminUser && password === adminPass) {
    await createSession(adminUser);
    redirect('/admin/dashboard');
  } else {
    return { error: 'Invalid username or password' };
  }
}

export async function logoutAction() {
  await deleteSession();
  redirect('/admin');
}

// ----------------------------------------------------
// PRODUCT ACTIONS
// ----------------------------------------------------

export async function addProductAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized: Please log in again.' };
  }

  const name = (formData.get('name') as string)?.trim();
  const categoryId = formData.get('categoryId') as string;
  const features = (formData.get('features') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const basePrice = Number(formData.get('basePrice'));
  const badge = (formData.get('badge') as string)?.trim();
  const badgeBg = (formData.get('badgeBg') as string)?.trim();
  const badgeColor = (formData.get('badgeColor') as string)?.trim();
  const variantsJson = formData.get('variantsJson') as string;
  const variants = JSON.parse(variantsJson || '[]');

  if (!name) return { error: 'Product name is required.' };
  if (!categoryId) return { error: 'Category is required.' };
  if (!basePrice || basePrice <= 0) return { error: 'Valid base price is required.' };

  // Handle Multiple Image Uploads
  const imageFiles = formData.getAll('images') as File[];
  const imageUrls: string[] = [];

  try {
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const blob = await put(`products/${Date.now()}-${file.name}`, file, {
          access: 'public',
          addRandomSuffix: true,
        });
        imageUrls.push(blob.url);
      }
    }

    if (imageUrls.length === 0) {
      return { error: 'At least one product image is required.' };
    }

    await dbConnect();

    // Find highest ID and increment
    const lastProduct = await Product.findOne().sort({ id: -1 });
    const nextId = lastProduct ? lastProduct.id + 1 : 1;

    const newProduct = new Product({
      id: nextId,
      name,
      categoryId,
      features,
      description,
      basePrice,
      images: imageUrls,
      badge: badge || undefined,
      badgeBg: badgeBg || undefined,
      badgeColor: badgeColor || undefined,
      variants,
    });

    await newProduct.save();

    revalidatePath('/');
    revalidatePath('/admin/products');
    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');

    return { success: 'Product added successfully!' };
  } catch (error: unknown) {
    console.error('Error adding product:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to add product: ${msg}` };
  }
}

export async function updateProductAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized: Please log in again.' };

  const id = Number(formData.get('id'));
  const name = (formData.get('name') as string)?.trim();
  const categoryId = formData.get('categoryId') as string;
  const features = (formData.get('features') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const basePrice = Number(formData.get('basePrice'));
  const badge = (formData.get('badge') as string)?.trim();
  const badgeBg = (formData.get('badgeBg') as string)?.trim();
  const badgeColor = (formData.get('badgeColor') as string)?.trim();
  const variantsJson = formData.get('variantsJson') as string;
  const variants = JSON.parse(variantsJson || '[]');

  const existingImagesJson = formData.get('existingImages') as string;
  const existingImages = JSON.parse(existingImagesJson || '[]');
  const newImageFiles = formData.getAll('images') as File[];

  if (!id) return { error: 'Product ID is missing.' };
  if (!name) return { error: 'Product name is required.' };
  if (!categoryId) return { error: 'Category is required.' };
  if (!basePrice || basePrice <= 0) return { error: 'Valid base price is required.' };

  try {
    const newImageUrls: string[] = [];
    for (const file of newImageFiles) {
      if (file && file.size > 0) {
        const blob = await put(`products/${Date.now()}-${file.name}`, file, {
          access: 'public',
          addRandomSuffix: true,
        });
        newImageUrls.push(blob.url);
      }
    }

    const finalImages = [...existingImages, ...newImageUrls];

    if (finalImages.length === 0) {
      return { error: 'At least one product image is required.' };
    }

    await dbConnect();
    await Product.findOneAndUpdate(
      { id },
      {
        name,
        categoryId,
        features,
        description,
        basePrice,
        images: finalImages,
        badge: badge || undefined,
        badgeBg: badgeBg || undefined,
        badgeColor: badgeColor || undefined,
        variants,
      },
      { returnDocument: 'after' }
    );

    revalidatePath('/');
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}/edit`);
    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');

    return { success: 'Product updated successfully!' };
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to update product: ${msg}` };
  }
}

export async function deleteProductAction(id: number): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    await dbConnect();
    await Product.findOneAndDelete({ id });

    revalidatePath('/');
    revalidatePath('/admin/products');
    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');

    return { success: 'Product deleted successfully!' };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { error: 'Failed to delete product.' };
  }
}

// ----------------------------------------------------
// CATEGORY ACTIONS
// ----------------------------------------------------

export async function addCategoryAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized: Please log in again.' };

  const name = (formData.get('name') as string)?.trim();
  const rawId = (formData.get('id') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const theme = (formData.get('theme') as string)?.trim() || 'sage';

  if (!name) return { error: 'Category name is required.' };
  if (!description) return { error: 'Category description is required.' };

  const slug = slugify(rawId || name);
  if (!slug) return { error: 'A valid category ID or name is required.' };

  try {
    await dbConnect();

    const existing = await Category.findOne({ id: slug });
    if (existing) {
      return { error: `A category with ID "${slug}" already exists. Please choose a different name or slug.` };
    }

    const newCategory = new Category({
      id: slug,
      name,
      description,
      theme,
    });

    await newCategory.save();

    revalidatePath('/');
    revalidatePath('/admin/categories');
    revalidatePath('/admin/products');
    revalidatePath('/admin/products/new');
    revalidatePath('/admin/dashboard');

    return { success: 'Category created successfully!' };
  } catch (error: unknown) {
    console.error('Error creating category:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to create category: ${msg}` };
  }
}

export async function updateCategoryAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized: Please log in again.' };

  const oldId = (formData.get('oldId') as string)?.trim();
  const newId = slugify((formData.get('id') as string)?.trim() || '');
  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const theme = (formData.get('theme') as string)?.trim() || 'sage';

  if (!oldId) return { error: 'Original category ID is missing.' };
  if (!name) return { error: 'Category name is required.' };
  if (!description) return { error: 'Category description is required.' };

  const targetId = newId || oldId;

  try {
    await dbConnect();

    // If ID changed, check if target ID is already taken by another category
    if (targetId !== oldId) {
      const existing = await Category.findOne({ id: targetId });
      if (existing) {
        return { error: `Category ID "${targetId}" already exists. Please use a unique ID.` };
      }
    }

    await Category.findOneAndUpdate(
      { id: oldId },
      {
        id: targetId,
        name,
        description,
        theme,
      },
      { returnDocument: 'after' }
    );

    // If category ID changed, migrate all existing products to the new category ID
    if (targetId !== oldId) {
      await Product.updateMany(
        { categoryId: oldId },
        { $set: { categoryId: targetId } }
      );
    }

    revalidatePath('/');
    revalidatePath('/admin/categories');
    revalidatePath('/admin/products');
    revalidatePath('/admin/products/new');
    revalidatePath('/admin/dashboard');

    return { success: 'Category updated successfully!' };
  } catch (error: unknown) {
    console.error('Error updating category:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to update category: ${msg}` };
  }
}

export async function deleteCategoryAction(
  id: string,
  reassignToCategoryId?: string
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  if (!id) return { error: 'Category ID is missing.' };

  try {
    await dbConnect();

    // Check if products exist under this category
    const productCount = await Product.countDocuments({ categoryId: id });

    if (productCount > 0) {
      if (!reassignToCategoryId) {
        return {
          error: `Cannot delete category: ${productCount} product(s) are currently assigned to it. Please select a category to reassign them to.`,
        };
      }

      // Verify reassignment target exists
      const targetCategory = await Category.findOne({ id: reassignToCategoryId });
      if (!targetCategory) {
        return { error: `Reassignment target category "${reassignToCategoryId}" does not exist.` };
      }

      // Reassign products to the target category
      await Product.updateMany(
        { categoryId: id },
        { $set: { categoryId: reassignToCategoryId } }
      );
    }

    // Delete the category document
    await Category.findOneAndDelete({ id });

    revalidatePath('/');
    revalidatePath('/admin/categories');
    revalidatePath('/admin/products');
    revalidatePath('/admin/products/new');
    revalidatePath('/admin/dashboard');

    return {
      success: `Category deleted successfully${
        productCount > 0 ? ` and ${productCount} product(s) reassigned to "${reassignToCategoryId}"` : ''
      }!`,
    };
  } catch (error: unknown) {
    console.error('Error deleting category:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to delete category: ${msg}` };
  }
}
