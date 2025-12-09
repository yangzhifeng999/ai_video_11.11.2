import { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  onSpeedChange?: (speed: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoplay = false,
  muted = false,
  playsInline = true,
  preload = 'auto',
  onSpeedChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const playbackRates = [
    { rate: 0.75, label: '0.75x' },
    { rate: 1, label: '1x（正常）' },
    { rate: 1.25, label: '1.25x' },
    { rate: 1.5, label: '1.5x' },
    { rate: 2, label: '2x' },
  ];

  // 处理速度改变
  const handleSpeedChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      onSpeedChange?.(rate);
      setShowSpeedMenu(false);
    }
  };

  // 监听容器外点击，关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };

    if (showSpeedMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showSpeedMenu]);

  return (
    <div className="video-player-container" ref={containerRef}>
      <video
        ref={videoRef}
        className="video-player"
        controls
        controlsList="nodownload"
        autoPlay={autoplay}
        muted={muted}
        playsInline={playsInline}
        poster={poster}
        preload={preload}
      >
        <source src={src} type="video/mp4" />
        您的浏览器不支持视频播放
      </video>

      {/* 自定义播放速度控制 */}
      <div className="video-speed-control">
        <button
          className="speed-button"
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          title="播放速度"
        >
          速度
        </button>
        {showSpeedMenu && (
          <div className="speed-menu">
            {playbackRates.map(({ rate, label }) => (
              <div
                key={rate}
                className="speed-option"
                onClick={() => handleSpeedChange(rate)}
              >
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

