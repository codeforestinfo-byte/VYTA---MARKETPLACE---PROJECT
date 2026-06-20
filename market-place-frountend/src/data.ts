import { Product, Vendor, Registry } from './types';

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vendor_1',
    storeName: 'PureFuel BioTech',
    email: 'info@purefuel.com',
    logo: 'PF',
    description: 'Gold-standard whey isolates, pure creatine monohydrates, and organic plant proteins. Informed-choice certified.',
    region: 'Germany',
    earnings: 14250.00,
    rating: 4.9
  },
  {
    id: 'vendor_2',
    storeName: 'MuscleLab Nutrition',
    email: 'hello@musclelab.com',
    logo: 'ML',
    description: 'Premium sports nutrition with cutting-edge formulations. BCAA blends, mass gainers, and recovery complexes.',
    region: 'United States',
    earnings: 9810.00,
    rating: 4.7
  },
  {
    id: 'vendor_3',
    storeName: 'VeganPro Supplements',
    email: 'support@veganpro.com',
    logo: 'VP',
    description: '100% plant-based protein powders, vegan BCAAs, and organic superfood blends. Cruelty-free certified.',
    region: 'United Kingdom',
    earnings: 7350.00,
    rating: 4.8
  },
  {
    id: 'vendor_4',
    storeName: 'Elite Athlete Series',
    email: 'sales@eliteathlete.com',
    logo: 'EA',
    description: 'Advanced performance nutrition for professional athletes. Medical-grade ingredients, third-party tested.',
    region: 'Sri Lanka',
    earnings: 4500.50,
    rating: 4.6
  }
];

export const PROTEIN_CATEGORIES = [
  { id: 'all', name: 'All Proteins' },
  { id: 'whey', name: 'Whey Protein' },
  { id: 'plant', name: 'Plant Protein' },
  { id: 'creatine', name: 'Creatine' },
  { id: 'bcaa', name: 'BCAAs & Aminos' },
  { id: 'preworkout', name: 'Pre-Workout' },
  { id: 'mass', name: 'Mass Gainers' },
  { id: 'recovery', name: 'Recovery' },
];

export const INITIAL_PRODUCTS: Product[] = [
  // WHEY PROTEIN
  {
    id: 'p_1',
    vendorId: 'vendor_1',
    vendorName: 'PureFuel BioTech',
    title: 'PureFuel Gold Standard Whey Isolate (2.2kg)',
    price: 64.99,
    originalPrice: 79.99,
    rating: 4.9,
    reviewsCount: 512,
    category: 'Whey Protein',
    image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=800',
    description: 'Engineered for rapid absolute workout recovery. Packs 25g of pure isolate protein, 5.5g of pure organic BCAAs, and 4g of recovery glutamine per scoop. Lactose and gluten-free with double chocolate richness.',
    features: [
      '25g Pure Grass-Fed protein blend per serving',
      'Zero added sugars, artificial dyes, or redundant thickeners',
      'Banned-substance tested under rigorous third-party audits'
    ],
    stock: 120,
    isDeal: true
  },
  {
    id: 'p_2',
    vendorId: 'vendor_2',
    vendorName: 'MuscleLab Nutrition',
    title: 'MuscleLab Hydrolyzed Whey (1.8kg)',
    price: 54.99,
    originalPrice: 69.99,
    rating: 4.8,
    reviewsCount: 342,
    category: 'Whey Protein',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2c1cf?auto=format&fit=crop&q=80&w=800',
    description: 'Fast-absorbing hydrolyzed whey peptides for immediate post-workout muscle repair. Ultra-filtered for maximum purity.',
    features: [
      'Hydrolyzed for rapid absorption within 15 minutes',
      '26g protein per serving with zero lactose',
      'Enhanced with digestive enzymes for gut comfort'
    ],
    stock: 85,
    isDeal: true
  },
  {
    id: 'p_3',
    vendorId: 'vendor_1',
    vendorName: 'PureFuel BioTech',
    title: 'PureFuel Micronized Creatine Powder (500g)',
    price: 32.00,
    originalPrice: 39.99,
    rating: 4.9,
    reviewsCount: 389,
    category: 'Creatine',
    image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&q=80&w=800',
    description: '100% molecularly pure Creapure creatine monohydrate. Micronized to dissolve instantly in any recovery shakes, promoting significant increases in lean athletic mass.',
    features: [
      'Made strictly with certified 100% fine micronized creatine powder',
      'Tasteless, odorless formula mixes completely without sandy residues',
      'Boosts cellular hydration and overall energetic explosive power output'
    ],
    stock: 95,
    isDeal: false
  },
  // PLANT PROTEIN
  {
    id: 'p_4',
    vendorId: 'vendor_3',
    vendorName: 'VeganPro Supplements',
    title: 'VeganPro Organic Pea & Rice Protein (2kg)',
    price: 48.99,
    originalPrice: 58.99,
    rating: 4.7,
    reviewsCount: 215,
    category: 'Plant Protein',
    image: 'https://images.unsplash.com/photo-1622485831022-f0babf1b3a7a?auto=format&fit=crop&q=80&w=800',
    description: 'Complete plant-based protein blend with 24g per serving. Non-GMO, soy-free, and sweetened with stevia.',
    features: [
      'Organic yellow pea + brown rice complete amino profile',
      '24g protein, 4g fiber, zero artificial sweeteners',
      'Smooth texture, mixes easily with water or plant milk'
    ],
    stock: 60,
    isDeal: true
  },
  {
    id: 'p_5',
    vendorId: 'vendor_3',
    vendorName: 'VeganPro Supplements',
    title: 'VeganPro Hemp Protein Powder (1kg)',
    price: 36.50,
    originalPrice: 42.00,
    rating: 4.5,
    reviewsCount: 128,
    category: 'Plant Protein',
    image: 'https://images.unsplash.com/photo-1622485831022-f0ba1b3a7abf?auto=format&fit=crop&q=80&w=800',
    description: 'Cold-pressed organic hemp protein rich in Omega-3s and fiber. Perfect for plant-based athletes.',
    features: [
      '50% protein content with all 9 essential amino acids',
      'Naturally rich in Omega-3 and Omega-6 fatty acids',
      'High fiber content supports digestive health'
    ],
    stock: 45,
    isDeal: false
  },
  // BCAAs & AMINOS
  {
    id: 'p_6',
    vendorId: 'vendor_2',
    vendorName: 'MuscleLab Nutrition',
    title: 'MuscleLab BCAA 2:1:1 Recovery (400g)',
    price: 28.99,
    originalPrice: 34.99,
    rating: 4.6,
    reviewsCount: 276,
    category: 'BCAAs & Aminos',
    image: 'https://images.unsplash.com/photo-1579722820308-d74e5715c1d5?auto=format&fit=crop&q=80&w=800',
    description: 'Optimal 2:1:1 ratio of leucine, isoleucine, and valine for muscle protein synthesis and reduced exercise fatigue.',
    features: [
      'Clinically studied 2:1:1 ratio for maximum absorption',
      'Zero sugar, zero carbs, zero calories per serving',
      'Refreshing fruit punch flavor with natural sweeteners'
    ],
    stock: 110,
    isDeal: true
  },
  {
    id: 'p_7',
    vendorId: 'vendor_4',
    vendorName: 'Elite Athlete Series',
    title: 'Elite Series EAA Complete (300g)',
    price: 39.99,
    originalPrice: 49.99,
    rating: 4.8,
    reviewsCount: 94,
    category: 'BCAAs & Aminos',
    image: 'https://images.unsplash.com/photo-1567599759827-2e9e4c1c1a1b?auto=format&fit=crop&q=80&w=800',
    description: 'All 9 essential amino acids in precise clinical ratios. Hospital-grade ingredients for professional athletes.',
    features: [
      'Complete EAA profile with enhanced leucine dosage',
      'Third-party tested for banned substances',
      'Fast-dissolving formula with natural flavors'
    ],
    stock: 35,
    isDeal: false
  },
  // PRE-WORKOUT
  {
    id: 'p_8',
    vendorId: 'vendor_4',
    vendorName: 'Elite Athlete Series',
    title: 'Elite Series Pre-Workout Ignite (300g)',
    price: 44.99,
    originalPrice: 54.99,
    rating: 4.7,
    reviewsCount: 189,
    category: 'Pre-Workout',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800',
    description: 'Premium pre-workout with citrulline malate, beta-alanine, and natural caffeine for explosive energy without jitters.',
    features: [
      '6g citrulline malate for insane pumps',
      'Natural caffeine from green tea and coffee bean',
      'No artificial dyes or proprietary blends'
    ],
    stock: 75,
    isDeal: true
  },
  {
    id: 'p_9',
    vendorId: 'vendor_2',
    vendorName: 'MuscleLab Nutrition',
    title: 'MuscleLab Stim-Free Pump (250g)',
    price: 32.99,
    originalPrice: 38.99,
    rating: 4.5,
    reviewsCount: 67,
    category: 'Pre-Workout',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2c1cf?auto=format&fit=crop&q=80&w=800',
    description: 'Stimulant-free pre-workout for evening training sessions. Massive pumps with zero caffeine.',
    features: [
      'Stim-free formula for late-night workouts',
      'Glycerol-based hydration and muscle volumization',
      'Enhanced with l-citrulline and l-arginine'
    ],
    stock: 55,
    isDeal: false
  },
  // MASS GAINERS
  {
    id: 'p_10',
    vendorId: 'vendor_1',
    vendorName: 'PureFuel BioTech',
    title: 'PureFuel Mass Gainer Pro (5kg)',
    price: 79.99,
    originalPrice: 94.99,
    rating: 4.6,
    reviewsCount: 143,
    category: 'Mass Gainers',
    image: 'https://images.unsplash.com/photo-1579722820308-d74e5715c1d5?auto=format&fit=crop&q=80&w=800',
    description: 'High-calorie mass gainer with 50g protein and 1200 calories per serving. Clean carbs from oats and sweet potatoes.',
    features: [
      '50g multi-source protein blend per serving',
      'Clean carbohydrate complex from oats and yams',
      'Enriched with digestive enzymes and probiotics'
    ],
    stock: 40,
    isDeal: true
  },
  // RECOVERY
  {
    id: 'p_11',
    vendorId: 'vendor_4',
    vendorName: 'Elite Athlete Series',
    title: 'Elite Series Night Recovery Casein (1.8kg)',
    price: 58.99,
    originalPrice: 68.99,
    rating: 4.8,
    reviewsCount: 88,
    category: 'Recovery',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2c1cf?auto=format&fit=crop&q=80&w=800',
    description: 'Slow-digesting micellar casein for overnight muscle repair. Releases amino acids gradually over 8 hours.',
    features: [
      'Micellar casein for timed-release amino delivery',
      '24g protein per serving with added glutamine',
      'Thick, creamy texture perfect before bed'
    ],
    stock: 30,
    isDeal: false
  },
  {
    id: 'p_12',
    vendorId: 'vendor_3',
    vendorName: 'VeganPro Supplements',
    title: 'VeganPro Recovery Plant Blend (1kg)',
    price: 42.99,
    originalPrice: 49.99,
    rating: 4.6,
    reviewsCount: 104,
    category: 'Recovery',
    image: 'https://images.unsplash.com/photo-1622485831022-f0ba1b3a7abf?auto=format&fit=crop&q=80&w=800',
    description: 'Plant-powered recovery blend with turmeric, tart cherry, and plant protein for inflammation reduction.',
    features: [
      'Organic tart cherry for natural anti-inflammatory support',
      'Turmeric root extract with bioperine for absorption',
      '22g organic plant protein per serving'
    ],
    stock: 50,
    isDeal: false
  }
];

export const REGISTRY_INSPIRATIONS = [
  {
    id: 'reg_1',
    title: 'Complete Protein Stack Blueprint',
    description: 'Essential whey, casein, and plant proteins for a full amino acid profile year-round.',
    image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=600',
    type: 'Home Gym Project'
  },
  {
    id: 'reg_2',
    title: 'Elite Supplement Starter Kit',
    description: 'Creatine, BCAAs, and pre-workout essentials for peak athletic performance.',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2c1cf?auto=format&fit=crop&q=80&w=600',
    type: 'Commercial Fitness Studio'
  },
  {
    id: 'reg_3',
    title: 'Vegan Athlete Nutrition Pack',
    description: 'Complete plant-based protein, EAA, and recovery stack for plant-powered athletes.',
    image: 'https://images.unsplash.com/photo-1622485831022-f0ba1b3a7abf?auto=format&fit=crop&q=80&w=600',
    type: 'Strength Mastery Dream'
  }
];

export const GIFT_CARDS = [
  { id: 'gc_1', title: 'Protein Starter Bundle Card', value: '$50.00', bg: 'bg-[#1b4332] text-white', theme: 'Classic Nutrition' },
  { id: 'gc_2', title: 'Premium Supplement Card', value: '$100.00', bg: 'bg-[#2d6a4f] text-white', theme: 'Elite Athlete' },
  { id: 'gc_3', title: 'Coach Tribute Gold Card', value: '$75.00', bg: 'bg-emerald-950 text-emerald-400', theme: 'Premium Trainer Gold' },
  { id: 'gc_4', title: 'Fitness Goal Achieved Visa', value: '$150.00', bg: 'bg-zinc-900 text-zinc-100', theme: 'Ultra Matte Steel' },
  { id: 'gc_5', title: 'Ultimate Supps & Protein Card', value: '$25.00', bg: 'bg-[#52b788] text-white', theme: 'Bright Lime Active' },
  { id: 'gc_6', title: 'Dream Supplement Startup', value: 'Custom', bg: 'bg-slate-200 text-slate-800', theme: 'Minimalist Clean' }
];
