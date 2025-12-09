import { useState, useEffect } from 'react';
import { videoService } from '@/services/videoService';
import type { IVideo, VideoCategory } from '@/types';

/**
 * 获取视频列表的Hook
 */
export const useVideoList = (category?: VideoCategory, keyword?: string) => {
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchVideos = async (reset: boolean = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await videoService.getVideoList({
        category,
        keyword,
        page: currentPage,
        pageSize: 20,
      });
      
      if (reset) {
        setVideos(response.list);
        setPage(2);
      } else {
        setVideos((prev) => [...prev, ...response.list]);
        setPage((prev) => prev + 1);
      }
      
      setHasMore(response.list.length === 20);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取视频列表失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(true);
  }, [category, keyword]);

  const refresh = async () => {
    await fetchVideos(true);
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchVideos(false);
    }
  };

  return { videos, loading, error, hasMore, refresh, loadMore };
};

/**
 * 获取视频详情的Hook
 */
export const useVideoDetail = (id: string) => {
  const [video, setVideo] = useState<IVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const data = await videoService.getVideoDetail(id);
        setVideo(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('获取视频详情失败'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVideo();
    }
  }, [id]);

  return { video, loading, error };
};





