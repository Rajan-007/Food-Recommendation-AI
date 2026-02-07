'use client';

import { useState } from 'react';
import { MenuItem } from '../lib/api';

interface MenuItemCardProps {
  item: MenuItem;
  index?: number;
}

export default function MenuItemCard({ item, index = 0 }: MenuItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryClass = () => {
    switch (item.category) {
      case 'recommended':
        return 'menu-card recommended';
      case 'good':
        return 'menu-card good';
      case 'not recommended':
        return 'menu-card not-recommended';
      default:
        return 'menu-card';
    }
  };

  const getBadgeClass = () => {
    switch (item.category) {
      case 'recommended':
        return 'badge badge-recommended';
      case 'good':
        return 'badge badge-good';
      case 'not recommended':
        return 'badge badge-not-recommended';
      default:
        return 'badge';
    }
  };

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'recommended':
        return '✓';
      case 'good':
        return '○';
      case 'not recommended':
        return '✕';
      default:
        return '•';
    }
  };

  // Calculate calorie intensity for visual indicator
  const getCalorieIntensity = () => {
    if (item.nutrition.calories < 300) return 'Low';
    if (item.nutrition.calories < 600) return 'Medium';
    return 'High';
  };

  return (
    <div 
      className={`${getCategoryClass()} animate-fade-in-up`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-lg text-[#f5f0e8] leading-tight pr-3">
          {item.name}
        </h4>
        <span className="text-xl font-bold gradient-text whitespace-nowrap">
          ₹{item.price}
        </span>
      </div>

      {/* Category Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={getBadgeClass()}>
          <span>{getCategoryIcon()}</span>
          <span>{item.category}</span>
        </span>
        <span className="text-xs text-[#a39e93] px-2 py-1 rounded-full bg-white/5">
          {getCalorieIntensity()} cal
        </span>
      </div>

      {/* Nutrition Grid */}
      <div className="nutrition-grid mb-4">
        <div className="nutrition-item nutrition-calories">
          <div className="nutrition-value">{item.nutrition.calories}</div>
          <div className="nutrition-label">kcal</div>
        </div>
        <div className="nutrition-item nutrition-protein">
          <div className="nutrition-value">{item.nutrition.protein}g</div>
          <div className="nutrition-label">protein</div>
        </div>
        <div className="nutrition-item nutrition-carbs">
          <div className="nutrition-value">{item.nutrition.carbs}g</div>
          <div className="nutrition-label">carbs</div>
        </div>
        <div className="nutrition-item nutrition-fats">
          <div className="nutrition-value">{item.nutrition.fats}g</div>
          <div className="nutrition-label">fats</div>
        </div>
        <div className="nutrition-item nutrition-fiber">
          <div className="nutrition-value">{item.nutrition.fiber}g</div>
          <div className="nutrition-label">fiber</div>
        </div>
      </div>

      {/* Macros Visual Bar */}
      <div className="h-1.5 rounded-full bg-white/5 mb-4 overflow-hidden flex">
        <div 
          className="h-full bg-[#60a5fa] transition-all duration-500"
          style={{ width: `${(item.nutrition.protein / (item.nutrition.protein + item.nutrition.carbs + item.nutrition.fats)) * 100}%` }}
          title={`Protein: ${item.nutrition.protein}g`}
        />
        <div 
          className="h-full bg-[#a78bfa] transition-all duration-500"
          style={{ width: `${(item.nutrition.carbs / (item.nutrition.protein + item.nutrition.carbs + item.nutrition.fats)) * 100}%` }}
          title={`Carbs: ${item.nutrition.carbs}g`}
        />
        <div 
          className="h-full bg-[#fbbf24] transition-all duration-500"
          style={{ width: `${(item.nutrition.fats / (item.nutrition.protein + item.nutrition.carbs + item.nutrition.fats)) * 100}%` }}
          title={`Fats: ${item.nutrition.fats}g`}
        />
      </div>

      {/* Recommendation */}
      <div className="relative">
        <p 
          className={`text-sm text-[#a39e93] leading-relaxed ${!isExpanded && item.recommendation.length > 100 ? 'line-clamp-2' : ''}`}
        >
          &ldquo;{item.recommendation}&rdquo;
        </p>
        
        {item.recommendation.length > 100 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-[#f97316] hover:text-[#fbbf24] font-medium mt-1 transition-colors"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
}
