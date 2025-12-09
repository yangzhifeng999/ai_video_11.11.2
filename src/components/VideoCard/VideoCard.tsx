import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from 'antd-mobile';
import type { IVideo } from '@/types';
import './VideoCard.css';

interface VideoCardProps {
  video: IVideo;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    navigate(`/video/${video.id}`);
  };

  const handleMakeVideo = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    navigate(`/video/${video.id}`); // 导航到视频播放页面
  };

  // 使用 Intersection Observer 实现视频自动播放
  useEffect(() => {
    const videoElement = videoRef.current;
    const cardElement = cardRef.current;
    
    if (!videoElement || !cardElement) return;

    // 创建观察器
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 视频进入可视区域，先加载再播放
            if (videoElement.readyState === 0) {
              videoElement.load(); // 如果还没加载，先加载
            }
            videoElement.play().catch((error) => {
              // 自动播放失败（浏览器策略），静音后重试
              console.warn('视频自动播放失败，尝试静音播放:', error);
              videoElement.muted = true;
              videoElement.play().catch(() => {
                console.warn('视频播放失败，将显示封面图');
              });
            });
          } else {
            // 视频离开可视区域，暂停播放
            videoElement.pause();
          }
        });
      },
      {
        threshold: 0.5, // 当50%可见时触发
      }
    );

    observer.observe(cardElement);

    return () => {
      observer.disconnect();
    };
  }, [video.videoUrl]);

  return (
    <div ref={cardRef} className="video-card" onClick={handleClick}>
      <div className="video-card-cover">
        {/* 动态视频 - 自动循环播放 */}
        <video
          ref={videoRef}
          key={`${video.id}-${video.videoUrl}`}
          src={video.videoUrl}
          poster={video.coverUrl}
          muted
          loop
          playsInline
          preload="none"
          className="video-card-video"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 10
          }}
          onError={(e) => {
            // 如果视频加载失败，隐藏视频元素，显示封面图
            const target = e.target as HTMLVideoElement;
            target.style.display = 'none';
            // 静默处理错误，不打印到控制台，避免干扰用户
          }}
          onLoadStart={() => {
            // 视频开始加载时，设置preload为auto，这样可以正常加载
            const videoElement = videoRef.current;
            if (videoElement && videoElement.preload === 'none') {
              videoElement.preload = 'auto';
            }
          }}
        />
        
        {/* 做同款按钮 */}
        <div className="video-card-make-button" onClick={handleMakeVideo}>
          做同款
        </div>

        {video.duration && (
          <div className="video-card-duration">
            {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
          </div>
        )}
      </div>
      <div className="video-card-info">
        <div className="video-card-title">{video.title}</div>
        <div className="video-card-meta">
          {video.creator && (
            <div className="video-card-creator">
              {video.creator.avatar && (
                <Image
                  src={video.creator.avatar}
                  alt={video.creator.nickname}
                  fit="cover"
                  lazy
                  style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                />
              )}
              <span className="video-card-creator-name">
                {video.creator.nickname || '未知作者'}
              </span>
            </div>
          )}
          <span className="video-card-used-count">
            {video.viewCount || 0}人用过
          </span>
        </div>
      </div>
    </div>
  );
};
