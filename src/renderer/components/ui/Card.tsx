import React from 'react';
import { cn } from '../../utils';
import { CardProps } from '../../types';

const Card: React.FC<CardProps> = ({
  children,
  title,
  className,
  padding = 'md',
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {title && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;