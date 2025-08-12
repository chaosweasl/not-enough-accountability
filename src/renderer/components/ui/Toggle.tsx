import React from 'react';
import { cn } from '../../utils';
import { ToggleProps } from '../../types';

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  ...props
}) => {
  const sizes = {
    sm: {
      button: 'h-4 w-7',
      thumb: 'h-3 w-3',
      translate: 'translate-x-3',
    },
    md: {
      button: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5',
    },
    lg: {
      button: 'h-8 w-14',
      thumb: 'h-6 w-6',
      translate: 'translate-x-6',
    },
  };

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
          sizes[size].button
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
            checked ? sizes[size].translate : 'translate-x-0',
            sizes[size].thumb
          )}
        />
      </button>
      {label && (
        <span
          className={cn(
            'text-sm font-medium',
            disabled
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default Toggle;