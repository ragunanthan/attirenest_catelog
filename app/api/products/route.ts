import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { MOCK_PRODUCTS } from '@/lib/seedData';

export async function GET() {
  try {
    await dbConnect();
    
    let products = await Product.find({}).sort({ id: 1 });
    
    // Seed database if empty
    if (products.length === 0) {
      await Product.insertMany(MOCK_PRODUCTS);
      products = await Product.find({}).sort({ id: 1 });
    }
    
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
