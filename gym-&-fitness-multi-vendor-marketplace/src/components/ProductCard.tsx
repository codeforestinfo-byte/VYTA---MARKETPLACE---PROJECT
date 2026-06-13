import React from 'react';
import { starRating } from './ProductDetailsModal'; // We can write a quick custom star renderer or define it locally
import { Star, Shield, HelpCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function renderStars(rating: number) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <Star key={i} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span key={i} className="relative inline-block overflow-hidden h-3.5 w-3.5">
          <Star className="h-3.5 w-3.5 text-gray-300 absolute top-0 left-0" />
          <span className="absolute top-0 left-0 w-1/2 overflow-hidden h-full">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
          </span>
        </span>
      );
    } else {
      stars.push(
        <Star key={i} className="h-3.5 w-3.5 text-gray-300" />
      );
    }
  }
  return stars;
}

export default function ProductCard({ product, onViewProduct, onAddToCart }: ProductCardProps) {
  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1);
  };

  return (
    <div 
      onClick={() => onViewProduct(product)}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#132836] transition-all duration-200 cursor-pointer flex flex-col justify-between p-3 h-full group"
      id={`product-card-${product.id}`}
    >
      <div>
        {/* Badge & Image */}
        <div className="relative aspect-square w-full bg-gray-50 rounded-md overflow-hidden mb-2 flex items-center justify-center">
          {product.isDeal && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-sm tracking-wide z-10 animate-pulse">
              Deal of Day
            </span>
          )}
          {product.stock <= 5 && (
            <span className="absolute top-2 right-2 bg-amber-500 text-amber-950 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-sm z-10">
              Only {product.stock} Left
            </span>
          )}

          <img
            src={product.image}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-300"
            id={`product-image-${product.id}`}
          />
        </div>

        {/* Vendor info tag */}
        <div className="text-[10px] uppercase font-bold tracking-wider text-[#1c3d52] mb-1 flex items-center gap-1">
          <Shield className="h-3 w-3 text-[#1c3d52]" />
          <span>{product.vendorName}</span>
        </div>

        {/* Title */}
          <h3 className="text-xs font-semibold text-gray-900 group-hover:text-[#132836] transition line-clamp-2 leading-snug mb-1">
          {product.title}
        </h3>

        {/* Ratings block */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-0.5">
            {renderStars(product.rating)}
          </div>
          <span className="text-[10px] text-amber-600 font-bold hover:underline">
            {product.reviewsCount}
          </span>
        </div>
      </div>

      <div>
        {/* Pricing Layout */}
        <div className="flex items-baseline gap-1.5 mb-2.5">
          <span className="text-lg font-extrabold text-gray-900 font-display">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-xs text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
              <span className="text-[10px] font-bold text-red-600">
                ({discountPercent}% OFF)
              </span>
            </>
          )}
        </div>

        {/* Delivery speed badge */}
        <p className="text-[10px] text-gray-500 mb-2 truncate">
          Get it by <span className="font-bold text-gray-800">Friday, June 5</span>
        </p>

        {/* CTA Double Interaction Row */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-gray-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProduct(product);
            }}
            className="py-1.5 border border-[#1c3d52] hover:bg-[#1c3d52]/10 text-gray-800 font-semibold text-[10px] rounded transition cursor-pointer text-center"
            id={`product-view-btn-${product.id}`}
          >
            Details
          </button>
          <button
            onClick={handleAddToCartClick}
            className="py-1.5 bg-[#1b73b3] hover:bg-[#145a8a] text-white font-extrabold text-[10px] rounded shadow-sm transition cursor-pointer text-center"
            id={`product-add-btn-${product.id}`}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
