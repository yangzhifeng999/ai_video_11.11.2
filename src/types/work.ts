// 作品状态
export type WorkStatus = 
  | 'pending'    // 审核中
  | 'approved'   // 已上架
  | 'rejected'   // 审核拒绝
  | 'offline';   // 已下架

// 作品类型
export type WorkType = 'video' | 'text';

// 作品信息
export interface IWork {
  id: string;
  type: WorkType;
  title: string;
  description?: string;
  coverUrl: string;
  videoUrl?: string;
  status: WorkStatus;
  price: number;
  sales: number;
  views: number;      // 浏览量
  earnings: number;   // 收益 = sales × price × 0.97
  createdAt: string;
  updatedAt: string;
  rejectedReason?: string;  // 拒绝原因
}

// 作品统计
export interface IWorkStats {
  totalWorks: number;      // 总作品数
  approvedWorks: number;   // 已上架
  pendingWorks: number;    // 审核中
  offlineWorks: number;    // 已下架
}

