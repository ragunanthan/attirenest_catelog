export const MOCK_CATEGORIES = [
  { id: 'everyday', name: 'Everyday Organic', description: 'GOTS cotton, buttery soft, for daily giggles', theme: 'sage' },
  { id: 'play', name: 'Play & Co-ords', description: 'Gender-neutral, movement-friendly', theme: 'blush' },
  { id: 'festive', name: 'Festive Ethnic', description: 'Pongal, Diwali & family weddings', theme: 'lav' },
  { id: 'party', name: 'Party Sparkle', description: 'Low-itch shimmer, high comfort', theme: 'blush' },
  { id: 'night', name: 'Nightwear', description: 'Breathable, tag-free, sleep-safe', theme: 'sage' }
];

export const MOCK_PRODUCTS = [
  // Everyday Organic
  { id: 1, categoryId: 'everyday', name: 'Cloud Cotton Tee', features: 'GOTS organic • pastel mint', description: 'Feather-light for Chennai summers', basePrice: 599, badge: 'ORGANIC', badgeBg: '#A8C3A5', badgeColor: '#fff', images: ['https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&w=400&q=80'], variants: [{year: 2, price: 599, stock: 10}, {year: 3, price: 599, stock: 10}, {year: 4, price: 649, stock: 10}] },
  { id: 2, categoryId: 'everyday', name: 'Everyday Jogger Set', features: 'Organic cotton blend', description: 'School to park, zero fuss', basePrice: 899, images: ['https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=400&q=80'], variants: [{year: 4, price: 899, stock: 5}, {year: 5, price: 899, stock: 5}, {year: 6, price: 949, stock: 5}] },
  
  // Play & Co-ords
  { id: 3, categoryId: 'play', name: 'Sage Co-ord Set', features: 'gender-neutral • sage green', description: 'Mix-match, playground approved', basePrice: 1199, badge: 'UNISEX', badgeBg: '#E6D9F0', badgeColor: '#5d4a7a', images: ['https://images.unsplash.com/photo-1522771930-78848d926053?auto=format&fit=crop&w=400&q=80'], variants: [{year: 3, price: 1199, stock: 8}, {year: 4, price: 1199, stock: 8}, {year: 5, price: 1249, stock: 8}] },
  { id: 4, categoryId: 'play', name: 'Blush Ribbed Play Suit', features: 'Stretch rib knit', description: 'Crawl, climb, nap – repeat', basePrice: 799, images: ['https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=400&q=80'], variants: [{year: 1, price: 799, stock: 12}, {year: 2, price: 799, stock: 12}] },
  { id: 5, categoryId: 'play', name: 'Denim Adventure Shorts', features: 'Soft-wash organic denim', description: 'Two deep pockets, endless treasures', basePrice: 699, images: ['https://images.unsplash.com/photo-1625890838933-728b17b6dcfa?auto=format&fit=crop&w=400&q=80'], variants: [{year: 6, price: 699, stock: 15}, {year: 7, price: 699, stock: 15}, {year: 8, price: 749, stock: 15}] },

  // Festive Ethnic
  { id: 6, categoryId: 'festive', name: 'Teal Kurta Pyjama', features: 'Boys • handloom cotton', description: 'Mandarin collar, comfy pyjama', basePrice: 1299, images: ['https://images.unsplash.com/photo-1600086827875-a63b01f1335c?auto=format&fit=crop&w=400&q=80'], variants: [{year: 2, price: 1299, stock: 6}, {year: 4, price: 1349, stock: 6}, {year: 6, price: 1399, stock: 6}] },
  { id: 7, categoryId: 'festive', name: 'Marigold Lehenga Choli', features: 'Paithani border • marigold', description: 'Silk-cotton, twirl-ready', basePrice: 1899, badge: 'PAITHANI', badgeBg: '#f5c76e', badgeColor: '#7a5a1e', images: ['https://images.unsplash.com/photo-1596450514735-111a2fe02935?auto=format&fit=crop&w=400&q=80'], variants: [{year: 3, price: 1899, stock: 4}, {year: 5, price: 1949, stock: 4}, {year: 7, price: 1999, stock: 4}] },
  { id: 8, categoryId: 'festive', name: 'Lavender Anarkali Mini', features: 'Soft rayon • gota details', description: 'Light, breezy, photo-perfect', basePrice: 1649, images: ['https://images.unsplash.com/photo-1605648916319-cf082f7524a1?auto=format&fit=crop&w=400&q=80'], variants: [{year: 4, price: 1649, stock: 7}, {year: 6, price: 1699, stock: 7}, {year: 8, price: 1749, stock: 7}] },

  // Party Sparkle
  { id: 9, categoryId: 'party', name: 'Sequined Peplum Skirt Set', features: 'Subtle shimmer • fully lined', description: 'Birthday twirls, no scratch', basePrice: 1499, images: ['https://images.unsplash.com/photo-1516081198592-3bc3a7ba2b8c?auto=format&fit=crop&w=400&q=80'], variants: [{year: 5, price: 1499, stock: 5}, {year: 7, price: 1549, stock: 5}, {year: 9, price: 1599, stock: 5}] },
  { id: 10, categoryId: 'party', name: 'Festive Bandhani Kurta', features: 'Boys • Jaipur bandhani', description: 'Organic cotton, Jaipur craft', basePrice: 1399, images: ['https://images.unsplash.com/photo-1595932821360-1e52dbb097b6?auto=format&fit=crop&w=400&q=80'], variants: [{year: 3, price: 1399, stock: 9}, {year: 4, price: 1399, stock: 9}, {year: 6, price: 1449, stock: 9}] },

  // Nightwear
  { id: 11, categoryId: 'night', name: 'Animal Print Pajama Set', features: 'breathable cotton', description: 'Tag-free neck, all-night ease', basePrice: 749, images: ['https://images.unsplash.com/photo-1540304675574-d4ff5a7f920f?auto=format&fit=crop&w=400&q=80'], variants: [{year: 2, price: 749, stock: 20}, {year: 3, price: 749, stock: 20}, {year: 5, price: 799, stock: 20}] },
  { id: 12, categoryId: 'night', name: 'Starry Night Sleepsuit', features: 'Zero-irritation seams', description: 'Two-way zip for midnight changes', basePrice: 649, images: ['https://images.unsplash.com/photo-1560613271-927bb8622f67?auto=format&fit=crop&w=400&q=80'], variants: [{year: 0, price: 649, stock: 15}, {year: 1, price: 649, stock: 15}, {year: 2, price: 699, stock: 15}] }
];
