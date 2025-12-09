import api from './api';
import { API_ENDPOINTS } from '@/constants/api';
import type { IEarningRecord, IWithdrawRecord } from '@/types';

export interface EarningListParams {
  page?: number;
  pageSize?: number;
}

export interface EarningListResponse {
  list: IEarningRecord[];
  total: number;
  totalEarnings: number;
  availableBalance: number;
  todayEarnings: number;
}

export interface WithdrawalData {
  amount: number;
  method: 'bank' | 'wechat' | 'alipay';
  accountInfo: string;
}

export const earningService = {
  /**
   * 获取收益列表和统计
   */
  getEarnings: async (params: EarningListParams = {}): Promise<EarningListResponse> => {
    const response = await api.get<EarningListResponse>(API_ENDPOINTS.EARNINGS_DETAIL, { params });
    return response.data;
  },

  /**
   * 提现
   */
  withdraw: async (data: WithdrawalData): Promise<IWithdrawRecord> => {
    const response = await api.post<IWithdrawRecord>(API_ENDPOINTS.EARNINGS_WITHDRAW, data);
    return response.data;
  },
};





