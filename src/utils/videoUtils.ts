/**
 * 视频处理工具函数
 */

/**
 * 从视频中截取首帧作为封面图
 * @param videoUrl 视频URL
 * @param seekTime 截取时间点（秒），默认0.1秒
 * @returns Promise<string> 返回 base64 格式的图片
 */
export const captureVideoFrame = (
  videoUrl: string, 
  seekTime: number = 0.1
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous'; // 处理跨域
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      // 设置到指定时间点
      video.currentTime = Math.min(seekTime, video.duration || 0.1);
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // 清理
        video.src = '';
        video.load();
        
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    video.onerror = () => {
      reject(new Error('视频加载失败'));
    };
    
    // 设置超时
    const timeout = setTimeout(() => {
      video.src = '';
      reject(new Error('视频加载超时'));
    }, 30000);
    
    video.oncanplay = () => {
      clearTimeout(timeout);
    };
    
    video.src = videoUrl;
    video.load();
  });
};

/**
 * 从本地 File 对象截取首帧
 * @param file 视频文件
 * @param seekTime 截取时间点（秒）
 * @returns Promise<string> 返回 base64 格式的图片
 */
export const captureVideoFrameFromFile = (
  file: File,
  seekTime: number = 0.1
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    
    captureVideoFrame(url, seekTime)
      .then((dataUrl) => {
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      })
      .catch((error) => {
        URL.revokeObjectURL(url);
        reject(error);
      });
  });
};

/**
 * 默认封面占位图（当无法获取视频首帧时使用）
 * 使用 URL 编码避免 btoa 的中文字符问题
 */
export const DEFAULT_VIDEO_COVER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="14">
    视频封面
  </text>
</svg>
`);

