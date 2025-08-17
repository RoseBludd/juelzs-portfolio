"use client";

import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number; // Current rating (0-5, can be decimal for display)
  onRate?: (rating: number) => void; // Callback when user rates (makes it interactive)
  size?: number; // Size of stars
  readonly?: boolean; // Whether stars are readonly (for display only)
  showText?: boolean; // Whether to show rating text
  totalRatings?: number; // Number of total ratings for display
  className?: string;
}

export function StarRating({ 
  rating, 
  onRate, 
  size = 16, 
  readonly = false,
  showText = false,
  totalRatings,
  className = ""
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const isInteractive = !readonly && onRate;
  const displayRating = isInteractive ? (hoverRating || rating) : rating;
  
  const handleClick = (starRating: number) => {
    if (onRate && !readonly) {
      onRate(starRating);
    }
  };

  const handleMouseEnter = (starRating: number) => {
    if (isInteractive) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverRating(0);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(displayRating);
          const isHalfFilled = star === Math.ceil(displayRating) && displayRating % 1 !== 0;
          
          return (
            <button
              key={star}
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={`relative transition-colors ${
                isInteractive 
                  ? 'cursor-pointer hover:scale-110 transform transition-transform' 
                  : 'cursor-default'
              }`}
            >
              {isFilled ? (
                <IconStarFilled 
                  size={size} 
                  className={`${
                    isInteractive && hoverRating >= star
                      ? 'text-yellow-400' 
                      : 'text-yellow-500'
                  }`}
                />
              ) : isHalfFilled ? (
                <div className="relative">
                  <IconStar size={size} className="text-gray-300" />
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${(displayRating % 1) * 100}%` }}
                  >
                    <IconStarFilled size={size} className="text-yellow-500" />
                  </div>
                </div>
              ) : (
                <IconStar 
                  size={size} 
                  className={`${
                    isInteractive && hoverRating >= star
                      ? 'text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {showText && (
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-600">
            {rating > 0 ? rating.toFixed(1) : '0.0'}
          </span>
          {totalRatings !== undefined && (
            <span className="text-gray-500">
              ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
            </span>
          )}
        </div>
      )}
    </div>
  );
} 