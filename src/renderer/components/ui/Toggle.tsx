import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`form-control ${className}`}>
      <label className="label cursor-pointer">
        {label && <span className="label-text">{label}</span>}
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="toggle toggle-primary"
          {...props}
        />
      </label>
    </div>
  );
};

export default Toggle;