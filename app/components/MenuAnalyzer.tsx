'use client';

import { useState, useRef } from 'react';
import { analyzeMenu, MenuItem } from '../lib/api';
import MenuItemCard from './MenuItemCard';

// Icons
const UploadIcon = () => (
  <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// Goal options with icons
const GOALS = [
  { value: 'weight loss', label: 'Weight Loss', icon: '🔥' },
  { value: 'muscle gain', label: 'Muscle Gain', icon: '💪' },
  { value: 'maintenance', label: 'Maintenance', icon: '⚖️' },
  { value: 'healthy eating', label: 'Healthy Eating', icon: '🥗' },
];

// Time of day options with icons
const TIMES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍿' },
];

// Skeleton loader component
const SkeletonCard = () => (
  <div className="skeleton-card animate-fade-in">
    <div className="flex justify-between items-start mb-4">
      <div className="skeleton h-6 w-32" />
      <div className="skeleton h-6 w-16" />
    </div>
    <div className="skeleton h-5 w-24 mb-4" />
    <div className="grid grid-cols-5 gap-2 mb-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton h-12" />
      ))}
    </div>
    <div className="skeleton h-10 w-full" />
  </div>
);

export default function MenuAnalyzer() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userGoal, setUserGoal] = useState('weight loss');
  const [timeOfDay, setTimeOfDay] = useState('lunch');
  const [foodConsumed, setFoodConsumed] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setItems([]);

    try {
      const userFoodData = foodConsumed.trim()
        ? foodConsumed.split(',').map(f => f.trim()).filter(Boolean)
        : undefined;

      const response = await analyzeMenu({
        image: file,
        userGoal,
        timeOfDay,
        userFoodData,
      });

      if (response.success) {
        setItems(response.items);
        if (response.items.length === 0) {
          setError('No menu items could be identified. Try a clearer image.');
        }
      } else {
        setError(response.error || 'Failed to analyze menu');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
      }
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearImage = () => {
    setImagePreview(null);
    setItems([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const recommendedItems = items.filter(i => i.category === 'recommended');
  const goodItems = items.filter(i => i.category === 'good');
  const notRecommendedItems = items.filter(i => i.category === 'not recommended');

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Upload Section */}
      <div className="glass-card p-6 md:p-8 mb-8 animate-fade-in-up">
        <h2 className="text-xl md:text-2xl font-bold mb-6 gradient-text">
          Upload Menu Image
        </h2>

        {/* Image Drop Zone */}
        <div
          className={`upload-zone mb-6 ${isDragging ? 'border-[#f97316]' : ''} ${imagePreview ? 'has-image' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !imagePreview && fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <div className="relative w-full">
              <img
                src={imagePreview}
                alt="Menu preview"
                className="max-h-72 mx-auto rounded-lg object-contain"
              />
              <button
                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                aria-label="Remove image"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <UploadIcon />
              <p className="text-lg font-medium text-[#f5f0e8] mb-1">
                Drop your menu image here
              </p>
              <p className="text-sm text-[#a39e93]">
                or click to browse • JPEG, PNG, WebP up to 5MB
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            className="hidden"
            aria-label="Upload menu image"
          />
        </div>

        {/* User Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Goal Selector */}
          <div>
            <label className="field-label">Your Goal</label>
            <select
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              className="input-field"
              aria-label="Select your health goal"
            >
              {GOALS.map(goal => (
                <option key={goal.value} value={goal.value}>
                  {goal.icon} {goal.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time of Day Selector */}
          <div>
            <label className="field-label">Time of Day</label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="input-field"
              aria-label="Select time of day"
            >
              {TIMES.map(time => (
                <option key={time.value} value={time.value}>
                  {time.icon} {time.label}
                </option>
              ))}
            </select>
          </div>

          {/* Already Eaten Input */}
          <div>
            <label className="field-label">Already Eaten Today</label>
            <input
              type="text"
              value={foodConsumed}
              onChange={(e) => setFoodConsumed(e.target.value)}
              placeholder="e.g., 2 eggs, toast, coffee"
              className="input-field"
              aria-label="What have you eaten today"
            />
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !imagePreview}
          className="btn-primary w-full"
          aria-label={isLoading ? 'Analyzing menu' : 'Analyze menu'}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <SpinnerIcon />
                Analyzing Menu...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Analyze Menu
              </>
            )}
          </span>
        </button>

        {/* Error Message */}
        {error && (
          <div className="error-message mt-4 animate-fade-in">
            <ErrorIcon />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="stat-card">
                <div className="skeleton h-8 w-12 mx-auto mb-2" />
                <div className="skeleton h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      {!isLoading && items.length > 0 && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            <div className="stat-card stat-success col-span-1">
              <div className="stat-value">{recommendedItems.length}</div>
              <div className="stat-label">Recommended</div>
            </div>
            <div className="stat-card stat-warning col-span-1">
              <div className="stat-value">{goodItems.length}</div>
              <div className="stat-label">Good</div>
            </div>
            <div className="stat-card stat-danger col-span-1">
              <div className="stat-value">{notRecommendedItems.length}</div>
              <div className="stat-label">Avoid</div>
            </div>
            <div className="stat-card col-span-1 hidden md:block">
              <div className="stat-value text-[#f5f0e8]">{items.length}</div>
              <div className="stat-label">Total Items</div>
            </div>
            <div className="stat-card col-span-1 hidden md:block">
              <div className="stat-value text-[#f97316]">
                {Math.round(items.reduce((acc, item) => acc + item.nutrition.calories, 0) / items.length)}
              </div>
              <div className="stat-label">Avg Calories</div>
            </div>
          </div>

          {/* Recommended Items */}
          {recommendedItems.length > 0 && (
            <section>
              <div className="section-header">
                <span className="section-indicator recommended" />
                <h3 className="section-title text-[#34d399]">Recommended for You</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedItems.map((item, index) => (
                  <MenuItemCard key={`recommended-${index}`} item={item} index={index} />
                ))}
              </div>
            </section>
          )}

          {/* Good Items */}
          {goodItems.length > 0 && (
            <section>
              <div className="section-header">
                <span className="section-indicator good" />
                <h3 className="section-title text-[#fbbf24]">Good Options</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goodItems.map((item, index) => (
                  <MenuItemCard key={`good-${index}`} item={item} index={index} />
                ))}
              </div>
            </section>
          )}

          {/* Not Recommended Items */}
          {notRecommendedItems.length > 0 && (
            <section>
              <div className="section-header">
                <span className="section-indicator not-recommended" />
                <h3 className="section-title text-[#fb7185]">Not Recommended</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notRecommendedItems.map((item, index) => (
                  <MenuItemCard key={`not-recommended-${index}`} item={item} index={index} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
