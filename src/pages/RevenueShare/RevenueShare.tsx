import { useNavigate } from 'react-router-dom';
import { NavBar } from '@/components/NavBar';
import { ROUTES } from '@/constants/routes';
import './RevenueShare.css';

export const RevenueShare: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    // 返回到首页（创作弹窗在首页）
    navigate(ROUTES.HOME);
  };

  return (
    <div className="revenue-share-page">
      <NavBar 
        title="创作分成说明" 
        onBack={handleBack} 
      />

      <div className="revenue-share-content">
        {/* 分成比例卡片 */}
        <div className="share-ratio-card">
          <div className="share-ratio-header">
            <div className="share-ratio-icon">💰</div>
            <div className="share-ratio-title">平台分成比例</div>
          </div>
          <div className="share-ratio-body">
            <div className="share-ratio-item creator">
              <div className="ratio-label">创作者收益</div>
              <div className="ratio-value">70%</div>
              <div className="ratio-desc">每笔销售您将获得</div>
            </div>
            <div className="share-ratio-divider">:</div>
            <div className="share-ratio-item platform">
              <div className="ratio-label">平台服务费</div>
              <div className="ratio-value">30%</div>
              <div className="ratio-desc">用于平台运营维护</div>
            </div>
          </div>
        </div>

        {/* 分成规则说明 */}
        <div className="rules-section">
          <div className="rules-header">
            <span className="rules-icon">📋</span>
            <span className="rules-title">分成规则详细说明</span>
          </div>

          <div className="rule-block">
            <h3 className="rule-title">一、收益分成标准</h3>
            <div className="rule-content">
              <p className="rule-text">
                1. 创作者每成功销售一次视频作品，将获得销售价格的 <strong>70%</strong> 作为创作收益。
              </p>
              <p className="rule-text">
                2. 平台收取 <strong>30%</strong> 作为服务费，用于平台运营、技术支持、内容审核、服务器维护等。
              </p>
              <p className="rule-text">
                3. 分成比例固定不变，不因销售数量、时间等因素而改变。
              </p>
            </div>
          </div>

          <div className="rule-block">
            <h3 className="rule-title">二、收益结算周期</h3>
            <div className="rule-content">
              <p className="rule-text">
                1. <strong>结算周期：</strong>每月1日自动结算上月收益。
              </p>
              <p className="rule-text">
                2. <strong>到账时间：</strong>结算后3-5个工作日内到账。
              </p>
              <p className="rule-text">
                3. <strong>最低提现：</strong>账户余额满 ¥50 即可申请提现。
              </p>
              <p className="rule-text">
                4. <strong>提现方式：</strong>支持微信、支付宝、银行卡提现。
              </p>
            </div>
          </div>

          <div className="rule-block">
            <h3 className="rule-title">三、收益计算方式</h3>
            <div className="rule-content">
              <p className="rule-text">
                1. <strong>单次销售收益 = 视频定价 × 70%</strong>
              </p>
              <p className="rule-text">
                2. 例如：视频定价 ¥80，每次销售您将获得 ¥56。
              </p>
              <p className="rule-text">
                3. 销售10次，累计收益 ¥560；销售100次，累计收益 ¥5,600。
              </p>
              <p className="rule-text">
                4. 收益无上限，销售越多收益越高。
              </p>
            </div>
          </div>

          <div className="rule-block">
            <h3 className="rule-title">四、税费说明</h3>
            <div className="rule-content">
              <p className="rule-text">
                1. 根据国家税法规定，创作者需自行承担个人所得税。
              </p>
              <p className="rule-text">
                2. 月收益超过 ¥800 的部分需缴纳个人所得税。
              </p>
              <p className="rule-text">
                3. 平台可协助代扣代缴，具体税率按照国家规定执行。
              </p>
              <p className="rule-text">
                4. 平台会提供完整的收益明细和税务凭证。
              </p>
            </div>
          </div>

          <div className="rule-block">
            <h3 className="rule-title">五、特殊情况处理</h3>
            <div className="rule-content">
              <p className="rule-text">
                1. <strong>退款处理：</strong>如用户申请退款且审核通过，该笔收益将从您的账户中扣除。
              </p>
              <p className="rule-text">
                2. <strong>违规处理：</strong>如作品被投诉并确认违规，平台有权冻结相关收益。
              </p>
              <p className="rule-text">
                3. <strong>争议处理：</strong>如发生收益争议，平台将根据实际情况公正处理。
              </p>
            </div>
          </div>

          <div className="rule-block">
            <h3 className="rule-title">六、收益查询</h3>
            <div className="rule-content">
              <p className="rule-text">
                1. 您可以在"我的"→"收益管理"中查看详细的收益明细。
              </p>
              <p className="rule-text">
                2. 收益明细包括：销售时间、购买用户、销售金额、分成收益等。
              </p>
              <p className="rule-text">
                3. 支持按时间、作品、状态等条件筛选查询。
              </p>
              <p className="rule-text">
                4. 所有收益数据实时更新，确保透明公开。
              </p>
            </div>
          </div>

          <div className="rule-block">
            <h3 className="rule-title">七、激励政策</h3>
            <div className="rule-content">
              <p className="rule-text">
                1. <strong>新人扶持：</strong>新创作者前3个作品审核费减免50%。
              </p>
              <p className="rule-text">
                2. <strong>优质创作：</strong>月销售额前10名的创作者可获得额外5%的奖励。
              </p>
              <p className="rule-text">
                3. <strong>推荐奖励：</strong>推荐新创作者加入，可获得其首月收益的10%作为推荐奖励。
              </p>
              <p className="rule-text">
                4. 平台会不定期推出各类激励活动，请关注平台公告。
              </p>
            </div>
          </div>
        </div>

        {/* 联系客服 */}
        <div className="contact-card">
          <div className="contact-header">
            <span className="contact-icon">💬</span>
            <span className="contact-title">有疑问？联系我们</span>
          </div>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-label">客服邮箱：</span>
              <span className="contact-value">support@aivideoplatform.com</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">客服电话：</span>
              <span className="contact-value">400-888-8888</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">服务时间：</span>
              <span className="contact-value">周一至周日 9:00-21:00</span>
            </div>
          </div>
        </div>

        {/* 温馨提示 */}
        <div className="warm-tip">
          <span className="tip-icon">💡</span>
          <span className="tip-text">
            本分成规则最终解释权归平台所有，如有调整将提前30天通知创作者。
          </span>
        </div>
      </div>
    </div>
  );
};
