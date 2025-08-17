"use client";

import { IconX, IconStar } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { StarRating } from './StarRating';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: {
    id: string;
    name: string;
    module_type: string;
  };
  currentUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  onRatingSubmitted: (newRating: number, totalRatings: number) => void;
}

export function RatingModal({ 
  isOpen, 
  onClose, 
  module, 
  currentUser,
  onRatingSubmitted 
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<{rating: number, review: string} | null>(null);
  const [ratingStats, setRatingStats] = useState<any>(null);

  // Load existing rating when modal opens
  useEffect(() => {
    if (isOpen && currentUser && module.id) {
      loadExistingRating();
    }
  }, [isOpen, currentUser, module.id]);

  const loadExistingRating = async () => {
    try {
      const response = await fetch(
        `/api/registry/rate?moduleId=${module.id}&developerId=${currentUser?.id}`
      );
      const data = await response.json();
      
      if (data.userRating) {
        setExistingRating(data.userRating);
        setRating(data.userRating.rating);
        setReview(data.userRating.review || '');
      }
      
      setRatingStats(data.stats);
    } catch (error) {
      console.error('Error loading rating:', error);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error('Please log in to rate modules');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/registry/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          developerId: currentUser.id,
          rating,
          review: review.trim() || null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        onRatingSubmitted(result.avgRating, result.totalRatings);
        onClose();
      } else {
        toast.error(result.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    setExistingRating(null);
    setRatingStats(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <IconStar size={24} className="text-yellow-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Rate Module</h2>
              <p className="text-sm text-gray-400">{module.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IconX size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentUser ? (
            <div className="text-center py-8">
              <IconStar size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Login Required</h3>
              <p className="text-gray-400">Please log in to rate this module</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current User Info */}
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <p className="text-blue-300 font-medium">Rating as:</p>
                    <p className="text-blue-200">{currentUser.name}</p>
                  </div>
                </div>
              </div>

              {/* Existing Rating Notice */}
              {existingRating && (
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm">
                    You've already rated this module. Submitting will update your existing rating.
                  </p>
                </div>
              )}

              {/* Current Module Stats */}
              {ratingStats && (
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Current Ratings</h4>
                  <div className="flex items-center justify-between">
                    <StarRating 
                      rating={parseFloat(ratingStats.avg_rating) || 0}
                      readonly
                      showText
                      totalRatings={parseInt(ratingStats.total_ratings) || 0}
                      className="text-gray-300"
                    />
                  </div>
                  
                  {/* Rating breakdown */}
                  {parseInt(ratingStats.total_ratings) > 0 && (
                    <div className="mt-3 space-y-1">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = parseInt(ratingStats[`${['five', 'four', 'three', 'two', 'one'][5 - star]}_star`]) || 0;
                        const percentage = parseInt(ratingStats.total_ratings) > 0 ? (count / parseInt(ratingStats.total_ratings)) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 w-2">{star}</span>
                            <div className="flex-1 bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-gray-400 w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Rating Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Your Rating *
                </label>
                <div className="flex items-center gap-2">
                  <StarRating 
                    rating={rating}
                    onRate={setRating}
                    size={32}
                    className="justify-center"
                  />
                  {rating > 0 && (
                    <span className="text-yellow-400 font-medium ml-2">
                      {rating} star{rating !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Review Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Review (Optional)
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience with this module..."
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {review.length}/500 characters
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentUser && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <IconStar size={16} />
                  {existingRating ? 'Update Rating' : 'Submit Rating'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 