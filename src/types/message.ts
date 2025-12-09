export type MessageType = 'comment' | 'like' | 'follower' | 'system';

export interface IMessage {
  id: string;
  userId: string;
  type: MessageType;
  title: string;
  content: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}





