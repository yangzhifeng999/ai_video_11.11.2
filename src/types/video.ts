export type VideoCategory = 'comprehensive' | 'mother_baby' | 'clothing' | 'general_merchandise' | 'other';

export type VideoStatus = 'pending' | 'approved' | 'rejected' | 'offline';

// 上传项类型
export type UploadItemType = 'face' | 'ingredient' | 'object' | 'scene' | 'other';

// 上传项配置
export interface IUploadItem {
  id: string;                    // 唯一标识
  type: UploadItemType;          // 类型：人脸/食材/物品/场景等
  label: string;                 // 显示标签（如："胡萝卜"、"人物A"、"正面照"）
  description?: string;          // 说明文字
  required: boolean;             // 是否必填
  validation?: {
    maxSize?: number;            // 最大文件大小（字节）
    allowedTypes?: string[];     // 允许的文件类型
  };
  exampleImageUrl?: string;      // 示例图片URL
}

// 视频上传配置
export interface IVideoUploadConfig {
  title?: string;                // 上传页面标题
  description?: string;          // 页面说明
  items: IUploadItem[];          // 上传项列表
  submitButtonText?: string;     // 提交按钮文字
}

export interface IVideo {
  id: string;
  title: string;
  description?: string;
  category: VideoCategory;
  price: number;
  videoUrl: string;
  coverUrl?: string;
  comparisonVideoUrl?: string; // AI换脸前后对比视频URL
  duration?: number;
  status: VideoStatus;
  creatorId: string;
  creator?: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  collectCount: number;
  createdAt: string;
  updatedAt: string;
  uploadConfig?: IVideoUploadConfig; // 上传配置
}

export interface IVideoUploadData {
  title: string;
  description?: string;
  category: VideoCategory;
  price: number;
  file: File;
}





