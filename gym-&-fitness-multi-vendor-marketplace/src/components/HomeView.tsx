import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, Award, ArrowRight, ShieldCheck, Heart, Sparkles, Flame } from 'lucide-react';
import { Product, Vendor } from '../types';
import { GIFT_CARDS } from '../data';
import ProductCard from './ProductCard';

interface HomeViewProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  selectedCategory: string;
  onSetSelectedCategory: (cat: string) => void;
  searchQuery: string;
  onOpenRegistry: () => void;
}

export default function HomeView({
  products,
  onViewProduct,
  onAddToCart,
  selectedCategory,
  onSetSelectedCategory,
  searchQuery,
  onOpenRegistry,
}: HomeViewProps) {
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  const heroSlides = [
    {
      title: 'Premium Whey Isolates for Elite Recovery',
      subtitle: 'Gold standard grass-fed whey protein isolates with 25g pure protein per serving. Cold-filtered, lactose-free, and third-party tested for banned substances.',
      cta: 'Explore Whey Proteins',
      image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=1200',
      category: 'Whey Protein',
      bgGradient: 'from-[#003d1c] via-[#132836] to-[#003d1c]'
    },
    {
      title: 'Plant-Powered Performance Proteins',
      subtitle: 'Organic pea, rice, and hemp protein blends crafted for vegan athletes. Complete amino profiles with zero compromise on taste or texture.',
      cta: 'Browse Plant Proteins',
      image: 'https://images.unsplash.com/photo-1622485831022-f0babf1b3a7a?auto=format&fit=crop&q=80&w=1200',
      category: 'Plant Protein',
      bgGradient: 'from-[#003d1c] via-[#1c3d52] to-[#003d1c]'
    },
    {
      title: 'Scientifically Formulated Pre-Workouts',
      subtitle: 'Clean energy complexes with citrulline malate, beta-alanine, and natural caffeine. Zero jitters, maximum focus, explosive pumps.',
      cta: 'Shop Pre-Workout',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=1200',
      category: 'Pre-Workout',
      bgGradient: 'from-[#002d15] via-[#132836] to-[#002515]'
    }
  ];

  useEffect(() => {
    const handle = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(handle);
  }, [heroSlides.length]);

  const handleNextHero = () => {
    setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevHero = () => {
    setCurrentHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const filteredProducts = products.filter((p) => {
    const categoryMatch = selectedCategory === 'All Departments' || p.category === selectedCategory;
    const searchMatch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const dealsProducts = products.filter((p) => p.isDeal);

  return (
    <div className="bg-[#f7f7f7] text-gray-850 pb-12" id="homepage-root">
      
      {/* Hero Slider Banner */}
      <div className="relative w-full h-[320px] sm:h-[420px] overflow-hidden shadow-inner" id="homepage-hero-slider">
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full flex flex-col justify-center transition-all duration-700 ease-in-out ${
              idx === currentHeroSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none'
            }`}
            id={`hero-slide-${idx}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-90`} />
            <img
              src={slide.image}
              alt={slide.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay flex-shrink-0"
            />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f7f7f7] to-transparent z-10" />

            <div className="relative max-w-5xl mx-auto px-6 w-full text-left font-sans text-white z-20 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold max-w-2xl font-display leading-tight drop-shadow">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base max-w-xl text-gray-250 leading-relaxed font-light">
                {slide.subtitle}
              </p>
              <button
                onClick={() => onSetSelectedCategory(slide.category)}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1b73b3] hover:bg-[#145a8a] text-white text-xs font-extrabold uppercase rounded shadow transition cursor-pointer"
                id={`hero-slide-cta-${idx}`}
              >
                <span>{slide.cta}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={handlePrevHero}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/45 hover:bg-black/65 text-white p-2.5 rounded-full z-20 transition cursor-pointer select-none"
          aria-label="Previous Slide"
          id="hero-left-arrow"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={handleNextHero}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/45 hover:bg-black/65 text-white p-2.5 rounded-full z-20 transition cursor-pointer select-none"
          aria-label="Next Slide"
          id="hero-right-arrow"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-20 space-y-8" id="homepage-content-grid">
        
        {selectedCategory === 'All Departments' && !searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-16" id="homepage-category-boxes">
            
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col justify-between text-left">
              <div>
                <h3 className="font-display font-extrabold text-base text-gray-900 mb-3 leading-tight">
                  Premium Whey & Isolates
                </h3>
                <div className="aspect-11/8 bg-gray-50 rounded-md overflow-hidden mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=400"
                    alt="Whey Protein"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  Grass-fed whey isolates, hydrolysates, and concentrates. Cold-filtered for maximum purity.
                </p>
              </div>
              <button
                onClick={() => onSetSelectedCategory('Whey Protein')}
                className="text-xs text-[#132836] hover:text-black font-bold hover:underline transition text-left mt-4"
              >
                Shop Whey Proteins
              </button>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col justify-between text-left">
              <div>
                <h3 className="font-display font-extrabold text-base text-gray-900 mb-3 leading-tight">
                  Plant-Based Proteins
                </h3>
                <div className="aspect-11/8 bg-gray-50 rounded-md overflow-hidden mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1622485831022-f0babf1b3a7a?auto=format&fit=crop&q=80&w=400"
                    alt="Plant Protein"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  Organic pea, rice, and hemp proteins. Complete amino profiles, zero animal products.
                </p>
              </div>
              <button
                onClick={() => onSetSelectedCategory('Plant Protein')}
                className="text-xs text-[#132836] hover:text-black font-bold hover:underline transition text-left mt-4"
              >
                Explore Plant Proteins
              </button>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col justify-between text-left">
              <div>
                <h3 className="font-display font-extrabold text-base text-gray-900 mb-3 leading-tight">
                  Creatine & Performance
                </h3>
                <div className="aspect-11/8 bg-gray-50 rounded-md overflow-hidden mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&q=80&w=400"
                    alt="Creatine"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  Pure micronized creatine monohydrate, BCAAs, and essential amino acid complexes.
                </p>
              </div>
              <button
                onClick={() => onSetSelectedCategory('Creatine')}
                className="text-xs text-[#132836] hover:text-black font-bold hover:underline transition text-left mt-4"
              >
                Shop Performance
              </button>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col justify-between text-left">
              <div>
                <h3 className="font-display font-extrabold text-base text-gray-900 mb-3 leading-tight">
                  Start Your Supplement Registry
                </h3>
                <div className="aspect-11/8 bg-[#1c3d52]/10 rounded-md p-4 mb-3 flex flex-col justify-center text-center items-center">
                  <Dumbbell className="h-10 w-10 text-[#1c3d52] animate-pulse mb-2" />
                  <p className="text-xs font-bold text-[#132836] leading-tight">Wedding, Studio, or personal supplement registries.</p>
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  Register with VYTA to compile your favorite proteins & supplements. Share easily with friends!
                </p>
              </div>
              <button
                onClick={onOpenRegistry}
                className="text-xs text-[#132836] hover:text-black font-bold hover:underline transition text-left mt-4"
              >
                Create Supplement Registry
              </button>
            </div>

          </div>
        )}

        {/* Dynamic Catalog Section */}
        <div className={`text-left ${selectedCategory === 'Strength Equipment' ? 'mt-16' : ''}`} id="active-catalog-display">
          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-2 border-b border-gray-200 pb-2 mb-6">
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 font-display flex items-center gap-1.5">
              <Flame className="h-5 w-5 text-[#1b73b3]" />
              {selectedCategory !== 'All Departments' ? selectedCategory : 'Premium Sports Nutrition'}
            </h3>
            {searchQuery && (
              <span className="text-xs text-gray-500 font-medium">
                Showing results matching: <strong className="text-[#132836]">"{searchQuery}"</strong>
              </span>
            )}
            {selectedCategory !== 'All Departments' && (
              <button
                onClick={() => onSetSelectedCategory('All Departments')}
                className="text-xs text-[#132836] hover:underline font-bold"
              >
                Clear selection
              </button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center max-w-md mx-auto">
              <Dumbbell className="h-12 w-12 text-gray-300 mx-auto rotate-45 mb-3" />
              <h5 className="font-bold text-gray-800 text-sm">No products match your search.</h5>
              <p className="text-xs text-gray-500 mt-1">Try different categories like whey, plant protein, or creatine.</p>
              <button
                onClick={() => onSetSelectedCategory('All Departments')}
                className="mt-4 px-4 py-1.5 bg-[#1b73b3] text-white font-extrabold text-xs rounded transition duration-150 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="catalog-products-grid">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onViewProduct={onViewProduct}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Best Deals Horizontal Carousel */}
        {dealsProducts.length > 0 && (
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm text-left" id="homepage-deals-carousel">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
              <h3 className="text-sm sm:text-base font-extrabold text-red-650 flex items-center gap-1.5 uppercase tracking-wide">
                Protein Deals — Up to 30% Off
              </h3>
              <span className="text-xs text-gray-400 font-bold select-none italic">
                Limited time offers
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
              {dealsProducts.map((deal) => (
                <div key={deal.id} className="min-w-[200px] sm:min-w-[240px] max-w-[240px] snap-start">
                  <ProductCard
                    product={deal}
                    onViewProduct={onViewProduct}
                    onAddToCart={onAddToCart}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Assurance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-8" id="homepage-quality-assurance">
          <div className="bg-white rounded-lg p-4 text-center border border-[#1c3d52]/20 flex items-center gap-3">
            <ShieldCheck className="h-10 w-10 text-[#1c3d52] shrink-0" />
            <div className="text-left leading-snug">
              <h5 className="font-bold text-xs text-gray-900">Third-Party Lab Tested</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Every batch is independently verified for purity, potency, and banned substance screening.</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-[#1c3d52]/20 flex items-center gap-3">
            <Award className="h-10 w-10 text-[#1c3d52] shrink-0" />
            <div className="text-left leading-snug">
              <h5 className="font-bold text-xs text-gray-900">Multi-Vendor Marketplace</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Multiple trusted supplement brands compete on quality and price. You get the best deal.</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-[#1c3d52]/20 flex items-center gap-3">
            <Heart className="h-10 w-10 text-[#1c3d52] shrink-0" />
            <div className="text-left leading-snug">
              <h5 className="font-bold text-xs text-gray-900">Satisfaction Guaranteed</h5>
              <p className="text-[10px] text-gray-500 mt-0.5">Not satisfied? Return within 30 days. Our vendor partners stand behind every product.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
