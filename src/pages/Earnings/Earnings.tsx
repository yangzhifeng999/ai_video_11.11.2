import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Button, DatePicker, List, Tag, Empty, Toast, Dialog } from 'antd-mobile';
import { RightOutline } from 'antd-mobile-icons';
import { mockEarnings, mockWithdrawals } from '@/mocks';
import './Earnings.css';

const Earnings: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 计算总收益
  const totalEarnings = mockEarnings.reduce((sum, item) => sum + item.amount, 0);

  // 计算可提现金额（总收益 - 已提现）
  const totalWithdrawn = mockWithdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, item) => sum + item.amount, 0);
  const availableBalance = totalEarnings - totalWithdrawn;

  // 筛选当前月份的收益记录
  const filteredEarnings = mockEarnings.filter(item => {
    const itemDate = new Date(item.createdAt);
    return (
      itemDate.getFullYear() === selectedMonth.getFullYear() &&
      itemDate.getMonth() === selectedMonth.getMonth()
    );
  });

  // 当前月份收益总额
  const monthlyEarnings = filteredEarnings.reduce((sum, item) => sum + item.amount, 0);

  // 处理提现
  const handleWithdraw = () => {
    if (availableBalance < 100) {
      Toast.show({
        content: '提现金额不能低于100元',
        icon: 'fail',
      });
      return;
    }

    Dialog.confirm({
      content: (
        <div>
          <p>提现金额：¥{availableBalance.toFixed(2)}</p>
          <p style={{ color: '#999', fontSize: '14px' }}>
            手续费（3%）：¥{(availableBalance * 0.03).toFixed(2)}
          </p>
          <p style={{ color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
            实际到账：¥{(availableBalance * 0.97).toFixed(2)}
          </p>
        </div>
      ),
      confirmText: '确认提现',
      cancelText: '取消',
      onConfirm: async () => {
        Toast.show({
          content: '提现申请已提交，预计3个工作日到账',
          icon: 'success',
        });
      },
    });
  };

  // 查看提现记录
  const handleViewWithdrawals = () => {
    navigate('/earnings/withdrawals');
  };

  // 格式化日期
  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  // 收益类型标签
  const getEarningTypeTag = (type: string) => {
    const typeConfig: Record<string, { text: string; color: string }> = {
      sale: { text: '作品销售', color: 'primary' },
      reward: { text: '打赏收入', color: 'success' },
      refund: { text: '退款', color: 'danger' },
    };
    const config = typeConfig[type] || { text: '其他', color: 'default' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div className="earnings-page">
      <NavBar onBack={() => navigate(-1)}>收益与提现</NavBar>

      {/* 收益概览卡片 */}
      <Card className="earnings-overview-card">
        <div className="overview-item">
          <div className="overview-label">累计收益</div>
          <div className="overview-value total">¥{totalEarnings.toFixed(2)}</div>
        </div>
        <div className="overview-divider" />
        <div className="overview-item">
          <div className="overview-label">可提现金额</div>
          <div className="overview-value available">¥{availableBalance.toFixed(2)}</div>
        </div>
      </Card>

      {/* 提现按钮 */}
      <div className="withdraw-button-container">
        <Button
          color="primary"
          size="large"
          block
          onClick={handleWithdraw}
          disabled={availableBalance < 100}
        >
          立即提现
        </Button>
        <div className="withdraw-hint">
          最低提现金额100元，手续费3%，预计3个工作日到账
        </div>
      </div>

      {/* 提现记录入口 */}
      <List className="earnings-list">
        <List.Item
          onClick={handleViewWithdrawals}
          arrow={<RightOutline />}
        >
          <div className="list-item-content">
            <span>提现记录</span>
            <span className="list-item-count">
              {mockWithdrawals.length}条
            </span>
          </div>
        </List.Item>
      </List>

      {/* 月份选择 */}
      <div className="month-selector">
        <Button
          onClick={() => setShowDatePicker(true)}
          fill="outline"
          size="small"
        >
          {formatMonth(selectedMonth)} ▼
        </Button>
        <div className="month-earnings">
          本月收益：¥{monthlyEarnings.toFixed(2)}
        </div>
      </div>

      {/* 收益明细列表 */}
      <div className="earnings-detail-list">
        {filteredEarnings.length === 0 ? (
          <Empty description="本月暂无收益记录" />
        ) : (
          filteredEarnings.map((item) => (
            <Card key={item.id} className="earning-item-card">
              <div className="earning-item-header">
                <div className="earning-item-title">{item.workTitle}</div>
                {getEarningTypeTag(item.type)}
              </div>
              <div className="earning-item-info">
                <div className="earning-item-time">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
                <div className="earning-item-amount">
                  +¥{item.amount.toFixed(2)}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 日期选择器 */}
      <DatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        precision="month"
        value={selectedMonth}
        onConfirm={(date) => {
          setSelectedMonth(date);
          setShowDatePicker(false);
        }}
        max={new Date()}
      />
    </div>
  );
};

export default Earnings;
