import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Empty } from 'antd-mobile';
import { mockWithdrawals } from '@/mocks';
import './WithdrawalRecords.css';

const WithdrawalRecords: React.FC = () => {
  const navigate = useNavigate();

  // 状态标签配置
  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { text: string; color: string }> = {
      pending: { text: '处理中', color: 'warning' },
      completed: { text: '已完成', color: 'success' },
      failed: { text: '失败', color: 'danger' },
    };
    const config = statusConfig[status] || { text: '未知', color: 'default' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div className="withdrawal-records-page">
      <NavBar onBack={() => navigate(-1)}>提现记录</NavBar>

      <div className="records-list">
        {mockWithdrawals.length === 0 ? (
          <Empty description="暂无提现记录" />
        ) : (
          mockWithdrawals.map((record) => (
            <Card key={record.id} className="record-card">
              <div className="record-header">
                <div className="record-amount">¥{record.amount.toFixed(2)}</div>
                {getStatusTag(record.status)}
              </div>

              <div className="record-info">
                <div className="record-info-row">
                  <span className="record-label">手续费：</span>
                  <span className="record-value">
                    ¥{record.fee.toFixed(2)}
                  </span>
                </div>
                <div className="record-info-row">
                  <span className="record-label">实际到账：</span>
                  <span className="record-value record-actual-amount">
                    ¥{record.actualAmount.toFixed(2)}
                  </span>
                </div>
                <div className="record-info-row">
                  <span className="record-label">申请时间：</span>
                  <span className="record-value">
                    {new Date(record.createdAt).toLocaleString()}
                  </span>
                </div>
                {record.completedAt && (
                  <div className="record-info-row">
                    <span className="record-label">完成时间：</span>
                    <span className="record-value">
                      {new Date(record.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {record.failedReason && (
                  <div className="record-fail-reason">
                    <span className="fail-label">失败原因：</span>
                    <span className="fail-text">{record.failedReason}</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WithdrawalRecords;

