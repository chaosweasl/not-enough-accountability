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
    sm: 'toggle-sm',
    md: '',
    lg: 'toggle-lg',
  };

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className="form-control">
      <label className="label cursor-pointer">
        {label && (
          <span className={cn(
            "label-text",
            disabled && 'opacity-50'
          )}>
            {label}
          </span>
        )}
        <input
          type="checkbox"
          checked={checked}
          onChange={handleToggle}
          disabled={disabled}
          className={cn(
            'toggle toggle-primary',
            sizes[size]
          )}
          {...props}
        />
      </label>
    </div>
  );
};

export default Toggle;