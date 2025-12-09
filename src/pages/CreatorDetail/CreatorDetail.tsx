import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Image, Tabs, Toast } from 'antd-mobile';
import { NavBar } from '@/components/NavBar';
import { Loading } from '@/components/Loading';
import { VideoCard } from '@/components/VideoCard';
import type { IVideo } from '@/types';
import { mockVideos } from '@/utils/mockData';
import { USE_MOCK_DATA } from '@/constants/api';
import './CreatorDetail.css';

interface Creator {
  id: string;
  nickname: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  videosCount: number;
  totalLikes: number;
  coverImage?: string;
}

export const CreatorDetail: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [followed, setFollowed] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    loadCreatorData();
  }, [creatorId]);

  const loadCreatorData = async () => {
    try {
      setLoading(true);
      
      if (USE_MOCK_DATA) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 创建Mock创作者数据
        const mockCreator: Creator = {
          id: creatorId || 'creator-1',
          nickname: `创作者${Math.floor(Math.random() * 100)}`,
          avatar: `https://picsum.photos/seed/creator-${creatorId}/200/200`,
          bio: '专注于AI视频创作，致力于分享有趣的视频内容。喜欢用科技改变生活，让每个人都能轻松制作精彩视频。',
          followersCount: Math.floor(Math.random() * 10000) + 1000,
          videosCount: Math.floor(Math.random() * 50) + 10,
          totalLikes: Math.floor(Math.random() * 50000) + 5000,
          coverImage: `https://picsum.photos/seed/cover-${creatorId}/800/300`,
        };
        
        // 筛选该创作者的视频
        const creatorVideos = mockVideos.filter(v => v.creatorId === creatorId).slice(0, 12);
        
        setCreator(mockCreator);
        setVideos(creatorVideos);
      } else {
        // TODO: 调用真实API
        // const response = await api.get(`/creators/${creatorId}`);
        // setCreator(response.data.creator);
        // setVideos(response.data.videos);
      }
    } catch (error) {
      Toast.show({ content: '加载失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (USE_MOCK_DATA) {
        setFollowed(!followed);
        Toast.show({ content: followed ? '已取消关注' : '关注成功' });
        
        // 更新粉丝数
        if (creator) {
          setCreator({
            ...creator,
            followersCount: creator.followersCount + (followed ? -1 : 1),
          });
        }
        return;
      }
      
      // TODO: 调用真实API
      // await api.post(`/creators/${creatorId}/follow`);
      setFollowed(!followed);
      Toast.show({ content: followed ? '已取消关注' : '关注成功' });
    } catch (error) {
      Toast.show({ content: '操作失败' });
    }
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  if (loading) {
    return <Loading text="加载中..." />;
  }

  if (!creator) {
    return (
      <div className="creator-detail-error">
        <div className="creator-detail-error-text">创作者不存在</div>
        <Button color="primary" onClick={() => navigate(-1)}>返回</Button>
      </div>
    );
  }

  return (
    <div className="creator-detail-page">
      <NavBar title="创作者主页" />
      
      {/* 可滚动内容区域 */}
      <div className="creator-detail-scroll-area">
        {/* 创作者头部信息 */}
        <div className="creator-detail-header">
        {/* 背景封面 */}
        {creator.coverImage && (
          <div className="creator-detail-cover">
            <Image
              src={creator.coverImage}
              alt="封面"
              fit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}
        
        {/* 创作者信息卡片 */}
        <div className="creator-detail-info">
          <div className="creator-detail-avatar-wrapper">
            <Image
              src={creator.avatar || 'https://via.placeholder.com/100'}
              alt={creator.nickname}
              fit="cover"
              className="creator-detail-avatar"
            />
          </div>
          
          <div className="creator-detail-basic">
            <h1 className="creator-detail-nickname">{creator.nickname}</h1>
            {creator.bio && (
              <p className="creator-detail-bio">{creator.bio}</p>
            )}
          </div>
          
          {/* 统计数据 */}
          <div className="creator-detail-stats">
            <div className="creator-detail-stat-item">
              <div className="creator-detail-stat-value">{creator.videosCount}</div>
              <div className="creator-detail-stat-label">作品</div>
            </div>
            <div className="creator-detail-stat-item">
              <div className="creator-detail-stat-value">
                {creator.followersCount >= 10000
                  ? `${(creator.followersCount / 10000).toFixed(1)}w`
                  : creator.followersCount}
              </div>
              <div className="creator-detail-stat-label">粉丝</div>
            </div>
            <div className="creator-detail-stat-item">
              <div className="creator-detail-stat-value">
                {creator.totalLikes >= 10000
                  ? `${(creator.totalLikes / 10000).toFixed(1)}w`
                  : creator.totalLikes}
              </div>
              <div className="creator-detail-stat-label">获赞</div>
            </div>
          </div>
          
          {/* 关注按钮 */}
          <div className="creator-detail-actions">
            <Button
              color={followed ? 'default' : 'primary'}
              size="large"
              block
              onClick={handleFollow}
              className="creator-detail-follow-button"
            >
              {followed ? '已关注' : '+ 关注'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* 标签页 */}
      <div className="creator-detail-tabs">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ '--active-line-color': '#1677ff' }}
        >
          <Tabs.Tab title="作品" key="videos">
            {videos.length > 0 ? (
              <div className="creator-detail-videos">
                {videos.map(video => (
                  <div key={video.id} className="creator-detail-video-item" onClick={() => handleVideoClick(video.id)}>
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="creator-detail-empty">
                <div className="creator-detail-empty-text">暂无作品</div>
              </div>
            )}
          </Tabs.Tab>
          
          <Tabs.Tab title="动态" key="posts">
            <div className="creator-detail-empty">
              <div className="creator-detail-empty-text">暂无动态</div>
            </div>
          </Tabs.Tab>
        </Tabs>
      </div>
      </div>
    </div>
  );
};

