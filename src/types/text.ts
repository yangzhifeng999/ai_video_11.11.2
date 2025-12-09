export type TextType = 'article' | 'script' | 'copywriting' | 'other';

export type TextStatus = 'pending' | 'approved' | 'rejected' | 'offline';

export interface IText {
  id: string;
  type: TextType;
  title: string;
  content: string;
  keywords?: string[];
  targetAudience?: string;
  price: number;
  usageRights: string;
  status: TextStatus;
  creatorId: string;
  creator?: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  viewCount: number;
  purchaseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ITextUploadData {
  type: TextType;
  title: string;
  content: string;
  keywords?: string[];
  targetAudience?: string;
  price: number;
  usageRights: string;
}





