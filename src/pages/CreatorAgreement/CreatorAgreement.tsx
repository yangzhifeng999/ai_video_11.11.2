import { NavBar } from '@/components/NavBar';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import './CreatorAgreement.css';

export const CreatorAgreement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; uploadData?: any } | null;

  const handleBack = () => {
    // 如果有来源页面和上传数据，返回到审核与支付页面并带上数据
    if (state?.from === ROUTES.UPLOAD_VIDEO_REVIEW && state?.uploadData) {
      navigate(ROUTES.UPLOAD_VIDEO_REVIEW, {
        state: state.uploadData
      });
    } else {
      // 否则返回上一页
      navigate(-1);
    }
  };

  return (
    <div className="creator-agreement-page">
      <NavBar 
        title="创作者协议与平台规范" 
        onBack={handleBack} 
      />

      <div className="agreement-content">
        {/* 创作者协议 */}
        <section className="agreement-section">
          <h2 className="section-title">创作者协议</h2>
          <div className="section-subtitle">最后更新：2024年1月</div>

          <div className="article-block">
            <h3 className="article-title">一、总则</h3>
            <p className="article-text">
              欢迎使用 AI 视频交易平台（以下简称"平台"）。本协议是您（创作者）与平台之间关于使用平台提供的创作、上传、销售等相关服务所订立的法律协议。
              您点击同意或实际使用平台服务，即视为已阅读并同意本协议的全部内容。
            </p>
          </div>

          <div className="article-block">
            <h3 className="article-title">二、账户与安全</h3>
            <ol className="article-list">
              <li>创作者需使用本人有效手机号进行注册，并保证提交的信息真实、准确、完整。</li>
              <li>创作者应妥善保管账号和密码，不得向任何第三方泄露或转让、出租账号。</li>
              <li>因创作者保管不善造成的账号被盗、信息泄露等损失，由创作者自行承担。</li>
            </ol>
          </div>

          <div className="article-block">
            <h3 className="article-title">三、内容上传与授权</h3>
            <ol className="article-list">
              <li>创作者应保证上传的视频、文案、封面等内容具有合法权利，不侵犯任何第三方的著作权、肖像权、名誉权、隐私权等合法权益。</li>
              <li>创作者同意授予平台在全球范围内对其上传内容的非独占性使用权，包括但不限于展示、复制、推广、分发、对内容进行必要的技术处理等。</li>
              <li>除法律另有规定或双方另行约定外，作品的著作权仍归创作者所有。</li>
              <li>如因创作者上传的内容引发第三方投诉或纠纷，创作者应积极配合平台处理，并承担由此产生的全部责任与费用。</li>
            </ol>
          </div>

          <div className="article-block">
            <h3 className="article-title">四、收益结算与提现</h3>
            <ol className="article-list">
              <li>平台为创作者提供收益统计和结算服务，具体分成比例以平台公示规则或单独签署的补充协议为准。</li>
              <li>创作者可在符合提现条件时发起提现申请，平台将在合理期限内完成审核和打款。</li>
              <li>创作者应根据国家相关法律法规自行处理个人所得税等税费问题，平台可依法配合代扣代缴。</li>
            </ol>
          </div>

          <div className="article-block">
            <h3 className="article-title">五、审核与下架</h3>
            <ol className="article-list">
              <li>创作者上传的所有内容均需通过平台审核后方可上架销售。审核标准包括但不限于内容合法性、真实性、画面质量、用户体验等。</li>
              <li>如内容存在违规、侵权或不符合平台规范的情况，平台有权拒绝上架或随时下架已上架的作品。</li>
              <li>对于严重违规或多次违规的创作者，平台有权采取包括但不限于限制上传、冻结收益、封禁账号等措施。</li>
            </ol>
          </div>

          <div className="article-block">
            <h3 className="article-title">六、违约责任</h3>
            <ol className="article-list">
              <li>如因创作者违反本协议或相关法律法规，给平台或第三方造成损失的，创作者应承担全部赔偿责任。</li>
              <li>平台有权从创作者未结算收益中直接扣除相应赔偿金额，并保留继续追偿的权利。</li>
            </ol>
          </div>
        </section>

        {/* 平台规范 */}
        <section className="agreement-section">
          <h2 className="section-title">平台规范</h2>
          <div className="section-subtitle">最后更新：2024年1月</div>

          <div className="article-block">
            <h3 className="article-title">一、内容规范</h3>
            <ol className="article-list">
              <li>禁止发布任何违法、违规内容，包括但不限于涉黄、涉暴、涉毒、赌博、恐怖主义等内容。</li>
              <li>禁止发布虚假或严重夸大的宣传内容，不得误导用户消费。</li>
              <li>禁止在视频或文案中夹带恶意软件、钓鱼链接、诈骗信息等。</li>
            </ol>
          </div>

          <div className="article-block">
            <h3 className="article-title">二、技术与质量要求</h3>
            <ol className="article-list">
              <li>建议视频分辨率不低于 1080P，画面清晰、构图完整。</li>
              <li>视频时长应控制在合理范围内，避免过长或过短影响用户体验。</li>
              <li>如含有人声或配音，应确保录音清晰、无明显杂音。</li>
            </ol>
          </div>

          <div className="article-block">
            <h3 className="article-title">三、定价与促销</h3>
            <ol className="article-list">
              <li>创作者应根据作品质量、市场需求等因素合理定价，遵守平台的定价区间建议。</li>
              <li>禁止恶意抬价或明显低于正常市场价格扰乱平台秩序。</li>
              <li>促销和折扣活动需遵守平台统一的活动规则，不得虚构原价、虚假打折。</li>
            </ol>
          </div>

          <div className="article-block">
            <h3 className="article-title">四、用户体验与服务</h3>
            <ol className="article-list">
              <li>创作者应对作品质量负责，如出现严重质量问题，应积极配合平台协商退款或补偿方案。</li>
              <li>禁止以任何方式骚扰、辱骂、歧视平台用户。</li>
            </ol>
          </div>

          <div className="article-block">
            <h3 className="article-title">五、数据与隐私保护</h3>
            <ol className="article-list">
              <li>平台将依法保护创作者及用户的个人信息，未经授权不会向无关第三方披露。</li>
              <li>创作者在自有渠道收集用户信息时，应遵守相关法律法规及平台隐私政策。</li>
            </ol>
          </div>
        </section>

        {/* 联系方式 */}
        <section className="contact-section">
          <h3 className="contact-title">联系我们</h3>
          <p className="contact-text">
            如您对本协议或平台规范有任何疑问、建议或投诉，可通过以下方式与我们联系：
          </p>
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
        </section>
      </div>
    </div>
  );
};

