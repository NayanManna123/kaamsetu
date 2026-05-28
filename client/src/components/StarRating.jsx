import { Star } from 'lucide-react';
import { useState } from 'react';

/**
 * Interactive Star Rating component
 */
const StarRating = ({ rating = 0, maxStars = 5, size = 'md', interactive = false, onChange }) => {
  const [hovered, setHovered] = useState(0);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = interactive ? i < (hovered || rating) : i < rating;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={`transition-transform duration-150 ${interactive ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
            onMouseEnter={() => interactive && setHovered(i + 1)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onChange?.(i + 1)}
          >
            <Star
              className={`${sizes[size]} ${
                filled ? 'text-warning-500' : 'text-surface-200'
              } transition-colors`}
              fill={filled ? '#F59E0B' : 'none'}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
