export interface IComment {
  id: string;
  videoId: string;
  userId: string;
  user: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  content: string;
  likeCount: number;
  replyToId?: string;
  replyToUser?: {
    id: string;
    nickname: string;
  };
  createdAt: string;
}





