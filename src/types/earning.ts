// 收益类型
export type EarningType = 'video_sale' | 'text_sale';

// 收益状态
export type EarningStatus = 'settled' | 'pending';

// 收益记录
export interface IEarningRecord {
  id: string;
  type: EarningType;
  amount: number;
  source: string;
  workId: string;
  workTitle: string;
  status: EarningStatus;
  month: string;  // 格式：'2025-11'
  createdAt: string;
}

// 提现方式
export type WithdrawMethod = 'wechat' | 'alipay' | 'bank';

// 提现状态
export type WithdrawStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 提现记录
export interface IWithdrawRecord {
  id: string;
  amount: number;          // 提现金额
  fee: number;             // 手续费（3%）
  actualAmount: number;    // 实际到账金额
  method: WithdrawMethod;
  status: WithdrawStatus;
  createdAt: string;
  completedAt?: string;
  failedReason?: string;
}

// 收益统计
export interface IEarningStats {
  totalEarnings: number;      // 累计收益
  availableBalance: number;   // 可提现余额
  monthEarnings: number;      // 本月收益
  todayEarnings: number;      // 今日收益
}

// 月度统计
export interface IMonthlyStats {
  month: string;              // '2025-11'
  totalEarnings: number;      // 本月总收益
  videoSales: number;         // 视频销售收益
  textSales: number;          // 文案销售收益
  salesCount: number;         // 销售笔数
}
