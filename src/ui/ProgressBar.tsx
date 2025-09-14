import React from 'react';

export const ProgressBar: React.FC<{value:number;color?:string}> = ({ value, color }) => {
  return (
    <div className="progress-bar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="fill" style={{ width: `${value}%`, background: color || 'var(--color-accent)' }} />
    </div>
  );
};
