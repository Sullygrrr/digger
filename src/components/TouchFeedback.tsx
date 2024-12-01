import React, { useState } from 'react';

interface TouchFeedbackProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  onClick,
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    onClick?.();
  };

  return (
    <div
      className={`transition-transform duration-150 ${
        isPressed ? 'scale-95' : 'scale-100'
      } ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};