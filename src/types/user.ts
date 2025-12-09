export interface IUser {
  id: string;
  nickname: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'secret';
  bio?: string;
  phone?: string;
  email?: string;
  points: number;
  balance: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export interface IUserProfile extends IUser {
  followerCount: number;
  followingCount: number;
  videoCount: number;
}





