import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import { MOCK_CATEGORIES } from '@/lib/seedData';

export async function GET() {
  try {
    await dbConnect();
    
    let categories = await Category.find({});
    
    // Seed database if empty
    if (categories.length === 0) {
      await Category.insertMany(MOCK_CATEGORIES);
      categories = await Category.find({});
    }
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
