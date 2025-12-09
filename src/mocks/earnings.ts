import { IEarningRecord, IEarningStats, IMonthlyStats, IWithdrawRecord } from '@/types/earning';

// 收益统计数据
export const mockEarningStats: IEarningStats = {
  totalEarnings: 1250.50,
  availableBalance: 856.50,
  monthEarnings: 192.70,
  todayEarnings: 23.50,
};

// 收益记录
export const mockEarnings: IEarningRecord[] = [
  { 
    id: 'e1', 
    type: 'video_sale', 
    amount: 56.70, 
    source: '视频销售', 
    workId: '1',
    workTitle: '精选母婴用品推荐', 
    status: 'settled', 
    month: '2025-11', 
    createdAt: '2025-11-18T10:30:00Z' 
  },
  { 
    id: 'e2', 
    type: 'text_sale', 
    amount: 34.20, 
    source: '文案销售', 
    workId: '2',
    workTitle: '时尚穿搭文案', 
    status: 'settled', 
    month: '2025-11', 
    createdAt: '2025-11-17T11:00:00Z' 
  },
  { 
    id: 'e3', 
    type: 'video_sale', 
    amount: 89.50, 
    source: '视频销售', 
    workId: '3',
    workTitle: '美食制作教程', 
    status: 'settled', 
    month: '2025-11', 
    createdAt: '2025-11-16T12:00:00Z' 
  },
  { 
    id: 'e4', 
    type: 'video_sale', 
    amount: 12.30, 
    source: '视频销售', 
    workId: '1',
    workTitle: '精选母婴用品推荐', 
    status: 'settled', 
    month: '2025-11', 
    createdAt: '2025-11-15T13:00:00Z' 
  },
  { 
    id: 'e5', 
    type: 'video_sale', 
    amount: 45.00, 
    source: '视频销售', 
    workId: '4',
    workTitle: '搞笑视频教程', 
    status: 'settled', 
    month: '2025-10', 
    createdAt: '2025-10-20T14:00:00Z' 
  },
  { 
    id: 'e6', 
    type: 'text_sale', 
    amount: 20.00, 
    source: '文案销售', 
    workId: '5',
    workTitle: '创意文案模板', 
    status: 'settled', 
    month: '2025-10', 
    createdAt: '2025-10-19T15:00:00Z' 
  },
];

// 月度统计
export const mockMonthlyStats: IMonthlyStats[] = [
  {
    month: '2025-11',
    totalEarnings: 192.70,
    videoSales: 158.50,
    textSales: 34.20,
    salesCount: 4,
  },
  {
    month: '2025-10',
    totalEarnings: 165.00,
    videoSales: 145.00,
    textSales: 20.00,
    salesCount: 2,
  },
];

// 提现记录
export const mockWithdrawals: IWithdrawRecord[] = [
  {
    id: 'w1',
    amount: 100.00,
    fee: 3.00,
    actualAmount: 97.00,
    method: 'wechat',
    status: 'completed',
    createdAt: '2025-11-10T10:00:00Z',
    completedAt: '2025-11-11T15:30:00Z',
  },
  {
    id: 'w2',
    amount: 200.00,
    fee: 6.00,
    actualAmount: 194.00,
    method: 'alipay',
    status: 'processing',
    createdAt: '2025-11-20T14:00:00Z',
  },
  {
    id: 'w3',
    amount: 50.00,
    fee: 1.50,
    actualAmount: 48.50,
    method: 'bank',
    status: 'failed',
    createdAt: '2025-11-05T09:00:00Z',
    failedReason: '银行卡信息有误',
  },
];
