'use server';

import { redirect } from 'next/navigation';
import { createSession, getSession, deleteSession } from '@/lib/session';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { revalidatePath } from 'next/cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loginAction(prevState: { error?: string } | any, formData: FormData) {
  const username = formData.get('username');
  const password = formData.get('password');

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'password123';

  if (username === adminUser && password === adminPass) {
    await createSession(adminUser);
    redirect('/admin/dashboard');
  } else {
    return { error: 'Invalid credentials' };
  }
}

export async function logoutAction() {
  await deleteSession();
  redirect('/admin');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addProductAction(prevState: { error?: string; success?: string } | any, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  const name = formData.get('name') as string;
  const categoryId = formData.get('categoryId') as string;
  const features = formData.get('features') as string;
  const description = formData.get('description') as string;
  const basePrice = Number(formData.get('basePrice'));
  const image = formData.get('image') as string;
  const badge = formData.get('badge') as string;
  const badgeBg = formData.get('badgeBg') as string;
  const badgeColor = formData.get('badgeColor') as string;
  const variantsJson = formData.get('variantsJson') as string;
  const variants = JSON.parse(variantsJson || '[]');

  try {
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
      image,
      badge: badge || undefined,
      badgeBg: badgeBg || undefined,
      badgeColor: badgeColor || undefined,
      variants,
    });

    await newProduct.save();
    revalidatePath('/');
    return { success: 'Product added successfully!' };
  } catch (error: any) {
    console.error('Error adding product:', error);
    return { error: `Failed to add product: ${error.message || 'Unknown error'}` };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProductAction(prevState: { error?: string; success?: string } | any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const categoryId = formData.get('categoryId') as string;
  const features = formData.get('features') as string;
  const description = formData.get('description') as string;
  const basePrice = Number(formData.get('basePrice'));
  const image = formData.get('image') as string;
  const badge = formData.get('badge') as string;
  const badgeBg = formData.get('badgeBg') as string;
  const badgeColor = formData.get('badgeColor') as string;
  const variantsJson = formData.get('variantsJson') as string;
  const variants = JSON.parse(variantsJson || '[]');

  try {
    await dbConnect();
    await Product.findOneAndUpdate({ id }, {
      name,
      categoryId,
      features,
      description,
      basePrice,
      image,
      badge: badge || undefined,
      badgeBg: badgeBg || undefined,
      badgeColor: badgeColor || undefined,
      variants,
    });
    revalidatePath('/');
    return { success: 'Product updated successfully!' };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return { error: `Failed to update product: ${error.message || 'Unknown error'}` };
  }
}

export async function deleteProductAction(id: number) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    await dbConnect();
    await Product.findOneAndDelete({ id });
    revalidatePath('/');
    return { success: 'Product deleted successfully!' };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { error: 'Failed to delete product.' };
  }
}
