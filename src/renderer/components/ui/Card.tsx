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
        'card bg-base-100 shadow-lg border border-base-200',
        className
      )}
      {...props}
    >
      <div className={cn('card-body', paddingClasses[padding])}>
        {title && (
          <h2 className="card-title text-base-content mb-2">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

export default Card;