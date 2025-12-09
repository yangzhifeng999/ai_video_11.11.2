import { useState, useEffect } from 'react';
import { Card, List } from 'antd-mobile';
import { NavBar } from '@/components/NavBar';
import { BottomTabBar } from '@/components/BottomTabBar';
import { Empty } from '@/components/Empty';
import { formatDate } from '@/utils';
import { mockUserStats } from '@/mocks';
import { useUserStore } from '@/store/userStore';
import './Points.css';

// 生成10条虚拟积分明细数据（只有每日登录）
const generateMockPointsList = () => {
  let balance = 1230;
  const list = [];
  
  // 只生成每日登录记录，每条都是100积分
  for (let i = 0; i < 10; i++) {
    balance += 100;
    
    list.push({
      id: String(i + 1),
      reason: '每日登录',
      amount: 100,
      balance: balance,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }
  
  return list;
};

const mockPointsList = generateMockPointsList();

export const Points: React.FC = () => {
  const { user, setUser, isAuthenticated } = useUserStore();
  const [points, setPoints] = useState(user?.points || mockUserStats.points);

  // 检查登录状态，如果已登录且今天未增加积分，则自动增加100积分
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const lastLoginDate = localStorage.getItem('lastLoginDate');
    const today = new Date().toDateString();
    
    // 如果今天还没有登录过，增加100积分
    if (lastLoginDate !== today) {
      const newPoints = (user.points || 0) + 100;
      setPoints(newPoints);
      
      // 更新用户状态
      setUser({
        ...user,
        points: newPoints,
      });
      
      // 记录今天的登录日期
      localStorage.setItem('lastLoginDate', today);
    } else {
      // 如果今天已经登录过，使用用户当前的积分
      setPoints(user.points || 0);
    }
  }, [isAuthenticated, user, setUser]);

  return (
    <div className="points-page">
      <NavBar title="积分中心" />
      <div className="points-content">
        <Card className="points-overview">
          <div className="points-total">
            <div className="points-total-label">当前积分</div>
            <div className="points-total-value">{points}</div>
            <div className="points-total-tip">每天登录，可获100积分</div>
          </div>
        </Card>

        <Card className="points-list">
          <div className="points-list-title">积分明细</div>
          <List>
            {mockPointsList.length === 0 ? (
              <Empty description="暂无积分记录" />
            ) : (
              mockPointsList.map((item) => (
                <List.Item
                  key={item.id}
                  title={item.reason}
                  description={formatDate(item.createdAt)}
                  extra={
                    <div className="points-item-amount">
                      <span className={item.amount > 0 ? 'points-income' : 'points-expense'}>
                        {item.amount > 0 ? '+' : ''}{item.amount}
                      </span>
                      <div className="points-balance">余额: {item.balance}</div>
                    </div>
                  }
                />
              ))
            )}
          </List>
        </Card>
      </div>
      
      {/* 底部导航栏 */}
      <BottomTabBar />
    </div>
  );
};
