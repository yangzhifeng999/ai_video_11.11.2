/**
 * 视频封面组件
 * 自动从视频URL截取首帧作为封面
 * 支持缓存，避免重复截取
 */

import React, { useState, useEffect, useRef } from 'react';
import { captureVideoFrame, DEFAULT_VIDEO_COVER } from '@/utils/videoUtils';
import './VideoCover.css';

// 封面缓存（内存缓存 + localStorage）
const coverCache = new Map<string, string>();
const CACHE_KEY_PREFIX = 'video_cover_';

// 生成安全的缓存键（处理中文URL）
const generateCacheKey = (videoUrl: string): string => {
  try {
    // 使用简单的哈希函数生成缓存键
    let hash = 0;
    for (let i = 0; i < videoUrl.length; i++) {
      const char = videoUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return CACHE_KEY_PREFIX + Math.abs(hash).toString(36);
  } catch (e) {
    // 降级方案：使用URL长度和前几个字符
    return CACHE_KEY_PREFIX + videoUrl.length + '_' + videoUrl.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '');
  }
};

// 从 localStorage 获取缓存的封面
const getCachedCover = (videoUrl: string): string | null => {
  // 先检查内存缓存
  if (coverCache.has(videoUrl)) {
    return coverCache.get(videoUrl) || null;
  }
  
  // 再检查 localStorage（最多缓存100个）
  try {
    const cacheKey = generateCacheKey(videoUrl);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      coverCache.set(videoUrl, cached);
      return cached;
    }
  } catch (e) {
    // localStorage 可能不可用或已满
  }
  
  return null;
};

// 缓存封面
const setCachedCover = (videoUrl: string, coverDataUrl: string) => {
  coverCache.set(videoUrl, coverDataUrl);
  
  try {
    const cacheKey = generateCacheKey(videoUrl);
    localStorage.setItem(cacheKey, coverDataUrl);
  } catch (e) {
    // localStorage 已满，清理旧缓存
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX));
      if (keys.length > 50) {
        keys.slice(0, 20).forEach(k => localStorage.removeItem(k));
      }
    } catch (e2) {
      // 忽略
    }
  }
};

interface VideoCoverProps {
  /** 视频URL */
  videoUrl?: string;
  /** 已有的封面URL（优先使用） */
  coverUrl?: string;
  /** 图片alt文本 */
  alt?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 截取时间点（秒） */
  seekTime?: number;
  /** 封面加载完成回调 */
  onLoad?: (coverUrl: string) => void;
  /** 封面加载失败回调 */
  onError?: () => void;
}

export const VideoCover: React.FC<VideoCoverProps> = ({
  videoUrl,
  coverUrl,
  alt = '视频封面',
  style,
  className,
  seekTime = 0.1,
  onLoad,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(coverUrl || '');
  const [loading, setLoading] = useState(!coverUrl);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // 如果有现成的封面URL，直接使用
    if (coverUrl) {
      setImageSrc(coverUrl);
      setLoading(false);
      return;
    }

    // 如果没有视频URL，显示默认封面
    if (!videoUrl) {
      setImageSrc(DEFAULT_VIDEO_COVER);
      setLoading(false);
      return;
    }

    // 检查缓存
    const cached = getCachedCover(videoUrl);
    if (cached) {
      setImageSrc(cached);
      setLoading(false);
      onLoad?.(cached);
      return;
    }

    // 从视频截取首帧
    setLoading(true);
    setError(false);

    captureVideoFrame(videoUrl, seekTime)
      .then((dataUrl) => {
        if (!mountedRef.current) return;
        
        setCachedCover(videoUrl, dataUrl);
        setImageSrc(dataUrl);
        setLoading(false);
        onLoad?.(dataUrl);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        
        console.warn('视频封面截取失败:', err);
        setImageSrc(DEFAULT_VIDEO_COVER);
        setLoading(false);
        setError(true);
        onError?.();
      });
  }, [videoUrl, coverUrl, seekTime, onLoad, onError]);

  // 图片加载失败时的处理
  const handleImageError = () => {
    if (imageSrc !== DEFAULT_VIDEO_COVER) {
      setImageSrc(DEFAULT_VIDEO_COVER);
      setError(true);
      onError?.();
    }
  };

  return (
    <div className={`video-cover-container ${className || ''}`} style={style}>
      {loading ? (
        <div className="video-cover-loading">
          <div className="video-cover-spinner" />
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          className="video-cover-image"
          onError={handleImageError}
        />
      )}
      {error && !loading && (
        <div className="video-cover-error-badge" title="封面加载失败">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
      )}
    </div>
  );
};

export default VideoCover;

