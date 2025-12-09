import React from 'react';
import './Empty.css';

interface EmptyProps {
  image?: string;
  icon?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Empty: React.FC<EmptyProps> = ({ 
  image, 
  icon = '📭',
  description = '暂无数据',
  action,
  style 
}) => {
  return (
    <div className="empty-container" style={style}>
      <div className="empty-image">
        {image ? (
          <img src={image} alt="empty" />
        ) : (
          <div className="empty-icon">{icon}</div>
        )}
      </div>
      <div className="empty-description">
        {description}
      </div>
      {action && (
        <div className="empty-action">
          {action}
        </div>
      )}
    </div>
  );
};

