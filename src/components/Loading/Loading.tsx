import React from 'react';
import { DotLoading, SpinLoading } from 'antd-mobile';
import './Loading.css';

interface LoadingProps {
  type?: 'dot' | 'spin';
  text?: string;
  fullScreen?: boolean;
  style?: React.CSSProperties;
}

export const Loading: React.FC<LoadingProps> = ({ 
  type = 'spin',
  text = '加载中...',
  fullScreen = false,
  style 
}) => {
  const content = (
    <div className="loading-content" style={style}>
      {type === 'dot' ? (
        <DotLoading color="primary" />
      ) : (
        <SpinLoading color="primary" style={{ '--size': '48px' }} />
      )}
      {text && <div className="loading-text">{text}</div>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-container loading-fullscreen">
        {content}
      </div>
    );
  }

  return (
    <div className="loading-container">
      {content}
    </div>
  );
};

