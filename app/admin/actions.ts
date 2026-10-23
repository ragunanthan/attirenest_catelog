'use server';

import { redirect } from 'next/navigation';
import { createSession, getSession, deleteSession } from '@/lib/session';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Order from '@/lib/models/Order';
import { revalidatePath } from 'next/cache';
import { uploadToR2, safeDeleteStorageImage } from '@/lib/r2';

export interface ActionResponse {
  error?: string;
  success?: string;
}

export const safeDeleteBlob = safeDeleteStorageImage;

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
        const url = await uploadToR2(file, { folder: 'products' });
        imageUrls.push(url);
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
        const url = await uploadToR2(file, { folder: 'products' });
        newImageUrls.push(url);
      }
    }

    const finalImages = [...existingImages, ...newImageUrls];

    if (finalImages.length === 0) {
      return { error: 'At least one product image is required.' };
    }

    await dbConnect();

    // Clean up any removed images from Vercel Blob storage
    const prevProduct = await Product.findOne({ id });
    if (prevProduct?.images && Array.isArray(prevProduct.images)) {
      const removedImages = prevProduct.images.filter(
        (img: string) => !finalImages.includes(img)
      );
      if (removedImages.length > 0) {
        await safeDeleteBlob(removedImages);
      }
    }

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
    const product = await Product.findOne({ id });
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      await safeDeleteBlob(product.images);
    }
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

export async function deleteProductImageAction(
  productId: number,
  imageUrl: string
): Promise<ActionResponse & { remainingImages?: string[] }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized: Please log in again.' };

  if (!productId || !imageUrl) {
    return { error: 'Product ID and Image URL are required.' };
  }

  try {
    await dbConnect();
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return { error: 'Product not found.' };
    }

    if (!product.images || product.images.length <= 1) {
      return {
        error: 'Cannot delete the only photo. A product must have at least one image. Please upload a replacement before deleting this one.',
      };
    }

    const updatedImages = product.images.filter((img: string) => img !== imageUrl);

    // Clean up from Vercel blob storage
    await safeDeleteBlob(imageUrl);

    // Update in database
    await Product.findOneAndUpdate(
      { id: productId },
      { images: updatedImages }
    );

    revalidatePath('/');
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');

    return { success: 'Image deleted successfully!', remainingImages: updatedImages };
  } catch (error: unknown) {
    console.error('Error deleting product image:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to delete image: ${msg}` };
  }
}

export async function setProductCoverImageAction(
  productId: number,
  imageUrl: string
): Promise<ActionResponse & { updatedImages?: string[] }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized: Please log in again.' };

  if (!productId || !imageUrl) {
    return { error: 'Product ID and Image URL are required.' };
  }

  try {
    await dbConnect();
    const product = await Product.findOne({ id: productId });
    if (!product) return { error: 'Product not found.' };

    const currentImages = product.images || [];
    if (!currentImages.includes(imageUrl)) {
      return { error: 'Image not found in this product.' };
    }

    // Move imageUrl to the primary index (0)
    const updatedImages = [
      imageUrl,
      ...currentImages.filter((img: string) => img !== imageUrl),
    ];

    await Product.findOneAndUpdate(
      { id: productId },
      { images: updatedImages }
    );

    revalidatePath('/');
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');

    return { success: 'Cover image updated successfully!', updatedImages };
  } catch (error: unknown) {
    console.error('Error updating cover image:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to update cover image: ${msg}` };
  }
}

export async function uploadProductImagesAction(
  productId: number,
  formData: FormData
): Promise<ActionResponse & { updatedImages?: string[] }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized: Please log in again.' };

  const imageFiles = formData.getAll('images') as File[];
  if (!imageFiles || imageFiles.length === 0) {
    return { error: 'No files provided.' };
  }

  try {
    await dbConnect();
    const product = await Product.findOne({ id: productId });
    if (!product) return { error: 'Product not found.' };

    const newUrls: string[] = [];
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const url = await uploadToR2(file, { folder: 'products' });
        newUrls.push(url);
      }
    }

    if (newUrls.length === 0) {
      return { error: 'No valid images were uploaded.' };
    }

    const updatedImages = [...(product.images || []), ...newUrls];
    await Product.findOneAndUpdate(
      { id: productId },
      { images: updatedImages }
    );

    revalidatePath('/');
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');

    return { success: 'Photos uploaded successfully!', updatedImages };
  } catch (error: unknown) {
    console.error('Error uploading product images:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to upload images: ${msg}` };
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

// ----------------------------------------------------
// ORDER ACTIONS (IN-STORE / POS & STATUS UPDATES)
// ----------------------------------------------------

export interface InStoreOrderItemInput {
  productId: number;
  name: string;
  year: string;
  price: number;
  qty: number;
}

export interface InStoreOrderInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  fulfillmentType: 'takeaway' | 'delivery';
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  items: InStoreOrderItemInput[];
  paymentMethod: 'cash' | 'upi' | 'card' | 'other';
  paymentStatus: 'paid' | 'pending';
  paymentId?: string;
  notes?: string;
  sendEmailNotification?: boolean;
}

export interface CreateInStoreOrderResponse {
  success?: boolean;
  error?: string;
  orderId?: string;
  orderNumber?: string;
}

export async function createInStoreOrderAction(
  payload: InStoreOrderInput
): Promise<CreateInStoreOrderResponse> {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized: Please log in again.' };
  }

  if (!payload.items || payload.items.length === 0) {
    return { error: 'Please add at least one product to the order.' };
  }

  // Validate item quantities and prices
  for (const item of payload.items) {
    if (!item.productId || typeof item.productId !== 'number') {
      return { error: 'Invalid product selected.' };
    }
    if (!item.year || typeof item.year !== 'string') {
      return { error: `Size/variant missing for item "${item.name}".` };
    }
    if (!item.qty || item.qty < 1) {
      return { error: `Quantity for "${item.name}" must be at least 1.` };
    }
    if (typeof item.price !== 'number' || item.price < 0) {
      return { error: `Invalid price for item "${item.name}".` };
    }
  }

  try {
    await dbConnect();

    // 1. Check stock availability for all items
    for (const item of payload.items) {
      const product = await Product.findOne({ id: item.productId });
      if (!product) {
        return { error: `Product "${item.name}" (ID #${item.productId}) not found in catalog.` };
      }

      const variant = product.variants?.find((v: { year: string; price: number; stock: number }) => v.year === item.year);
      if (!variant) {
        return { error: `Size variant "${item.year}" for "${product.name}" not found.` };
      }

      if (variant.stock < item.qty) {
        return {
          error: `Insufficient stock for "${product.name}" (${item.year}). Available: ${variant.stock}, Requested: ${item.qty}.`,
        };
      }
    }

    // 2. Generate unique human-readable order number & ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `AN-STR-${dateStr}-${randomStr}`;
    const orderId = `store_${Date.now()}_${randomStr.toLowerCase()}`;

    // 3. Atomically decrement stock for each item
    for (const item of payload.items) {
      await Product.updateOne(
        {
          id: item.productId,
          'variants.year': item.year,
        },
        {
          $inc: { 'variants.$.stock': -item.qty },
        }
      );
    }

    // 4. Calculate total amount
    const totalAmount = payload.items.reduce((sum, item) => sum + item.price * item.qty, 0);

    // 5. Structure address & customer records
    const isTakeaway = payload.fulfillmentType === 'takeaway';
    const customerName = payload.customerName?.trim() || 'Walk-in Customer';
    const customerPhone = payload.customerPhone?.trim() || '';
    const customerEmail = payload.customerEmail?.trim() || '';

    const shippingAddress = {
      fullName: customerName,
      phone: customerPhone,
      email: customerEmail,
      addressLine1: isTakeaway
        ? (payload.addressLine1?.trim() || 'In-Store Counter Pickup')
        : (payload.addressLine1?.trim() || 'In-Store Order Delivery'),
      addressLine2: payload.addressLine2?.trim() || '',
      city: isTakeaway ? (payload.city?.trim() || 'Bangalore (In-Store)') : (payload.city?.trim() || 'Bangalore'),
      state: isTakeaway ? (payload.state?.trim() || 'Karnataka') : (payload.state?.trim() || 'Karnataka'),
      pincode: payload.pincode?.trim() || '',
    };

    const paymentId =
      payload.paymentId?.trim() ||
      (payload.paymentMethod === 'cash'
        ? 'CASH'
        : `STORE-${payload.paymentMethod.toUpperCase()}`);

    // 6. Create Order record in DB
    const newOrder = await Order.create({
      orderId,
      orderNumber,
      paymentId,
      paymentMethod: payload.paymentMethod,
      amount: totalAmount,
      currency: 'INR',
      status: payload.paymentStatus || 'paid',
      orderType: 'in_store',
      notes: payload.notes?.trim() || '',
      items: payload.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        year: i.year,
        price: i.price,
        qty: i.qty,
      })),
      shippingAddress,
      customerInfo: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
    });

    // 7. Send Customer Confirmation Email asynchronously if requested and email provided
    if (payload.sendEmailNotification && customerEmail) {
      try {
        const { sendCustomerConfirmation } = await import('@/lib/email');
        await sendCustomerConfirmation(newOrder);
      } catch (emailError) {
        console.error('[In-Store Order] Failed to send email confirmation:', emailError);
      }
    }

    // 8. Revalidate cached paths
    revalidatePath('/');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/products');

    return {
      success: true,
      orderId,
      orderNumber,
    };
  } catch (error: unknown) {
    console.error('Error creating in-store order:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to create in-store order: ${msg}` };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: 'paid' | 'pending' | 'cancelled'
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  if (!orderId) return { error: 'Order ID is required.' };

  try {
    await dbConnect();

    const order = await Order.findOne({ orderId });
    if (!order) {
      return { error: `Order with ID "${orderId}" not found.` };
    }

    const previousStatus = order.status;

    // If cancelling a paid order, restock inventory items
    if (newStatus === 'cancelled' && previousStatus === 'paid') {
      for (const item of order.items) {
        await Product.updateOne(
          {
            id: item.productId,
            'variants.year': item.year,
          },
          {
            $inc: { 'variants.$.stock': item.qty },
          }
        );
      }
    } else if (previousStatus === 'cancelled' && newStatus === 'paid') {
      // If un-cancelling back to paid, deduct stock again
      for (const item of order.items) {
        await Product.updateOne(
          {
            id: item.productId,
            'variants.year': item.year,
          },
          {
            $inc: { 'variants.$.stock': -item.qty },
          }
        );
      }
    }

    order.status = newStatus;
    await order.save();

    revalidatePath('/admin/orders');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/products');

    return { success: `Order ${order.orderNumber} status updated to ${newStatus}.` };
  } catch (error: unknown) {
    console.error('Error updating order status:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to update order status: ${msg}` };
  }
}

export async function deleteOrderAction(
  orderId: string,
  restoreStock: boolean = true
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized: Please log in again.' };

  if (!orderId) return { error: 'Order ID is required.' };

  try {
    await dbConnect();

    const order = await Order.findOne({ orderId });
    if (!order) {
      return { error: `Order with ID "${orderId}" not found.` };
    }

    // If order was marked as paid and restoreStock is true, return the stock to inventory
    if (restoreStock && order.status === 'paid' && order.items && order.items.length > 0) {
      for (const item of order.items) {
        await Product.updateOne(
          {
            id: item.productId,
            'variants.year': item.year,
          },
          {
            $inc: { 'variants.$.stock': item.qty },
          }
        );
      }
    }

    // Permanently remove the order document
    await Order.deleteOne({ orderId });

    revalidatePath('/');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/products');

    return {
      success: `Order ${order.orderNumber} deleted permanently${
        restoreStock && order.status === 'paid' ? ' (inventory stock restored)' : ''
      }.`,
    };
  } catch (error: unknown) {
    console.error('Error deleting order:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to delete order: ${msg}` };
  }
}


