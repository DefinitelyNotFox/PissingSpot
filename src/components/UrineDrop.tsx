import React from 'react';

interface UrineDropProps {
  filled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const UrineDrop: React.FC<UrineDropProps> = ({
  filled = true,
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const dim = sizeMap[size] || 'w-4 h-4';

  if (!filled) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`${dim} inline-block ${className}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M12 2.5 C12 2.5 4.5 12 4.5 16.5 A7.5 7.5 0 0 0 19.5 16.5 C19.5 12 12 2.5 12 2.5 Z"
          className="stroke-black/30 dark:stroke-white/30 fill-black/5 dark:fill-white/5"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={`${dim} inline-block filter drop-shadow-sm ${className}`}
    >
      <defs>
        <linearGradient id="urineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Drop Body */}
      <path
        d="M12 2.5 C12 2.5 4.5 12 4.5 16.5 A7.5 7.5 0 0 0 19.5 16.5 C19.5 12 12 2.5 12 2.5 Z"
        fill="url(#urineGrad)"
        stroke="#000000"
        strokeWidth="1.5"
      />
      {/* Specular shine */}
      <path
        d="M8.5 14 C8 15.5 8.5 17 9.5 17.5"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
};

interface UrineRatingProps {
  rating: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (val: number) => void;
}

export const UrineRating: React.FC<UrineRatingProps> = ({
  rating,
  max = 5,
  size = 'sm',
  interactive = false,
  onRate
}) => {
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const dropIndex = i + 1;
        const isFilled = dropIndex <= Math.round(rating);

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onRate?.(dropIndex)}
              className="p-0.5 transition-transform hover:scale-125 focus:outline-none"
            >
              <UrineDrop filled={isFilled} size={size} />
            </button>
          );
        }

        return <UrineDrop key={i} filled={isFilled} size={size} />;
      })}
    </div>
  );
};

interface PuddleIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PuddleIcon: React.FC<PuddleIconProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    sm: 'w-5 h-3',
    md: 'w-7 h-4.5',
    lg: 'w-9 h-5.5'
  };
  const dim = sizeMap[size] || 'w-7 h-4.5';

  return (
    <svg
      viewBox="0 0 40 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${dim} inline-block filter drop-shadow-sm ${className}`}
    >
      <defs>
        <linearGradient id="puddleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Main puddle body */}
      <path
        d="M8 12 C 4 14, 3 17, 7 19.5 C 12 21.5, 20 22, 28 21 C 36 20, 39 17.5, 37 14.5 C 35 11.5, 30 10, 24 9 C 18 8, 11 10, 8 12 Z"
        fill="url(#puddleGrad)"
        stroke="#000000"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Surface shine / reflection */}
      <path
        d="M12 14.5 C 9 15.5, 10 17.5, 14 18 C 19 18.5, 26 18, 30 17 C 33 16, 31 15, 27 14.5 C 23 14, 15 13.5, 12 14.5 Z"
        fill="#ffffff"
        opacity="0.5"
      />
      {/* Tiny splash side droplets */}
      <ellipse cx="4.5" cy="8.5" rx="2" ry="1.4" fill="url(#puddleGrad)" stroke="#000000" strokeWidth="1.2" />
      <ellipse cx="36.5" cy="7.5" rx="1.6" ry="1.2" fill="url(#puddleGrad)" stroke="#000000" strokeWidth="1.2" />
    </svg>
  );
};
