import { useNavigate, useLocation } from 'react-router-dom';
import { NavBar } from '@/components/NavBar';
import { ROUTES } from '@/constants/routes';
import './TextServiceAgreement.css';

export const TextServiceAgreement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // 返回到付款页面（如果有来源信息）
    if (location.state?.from) {
      navigate(location.state.from, { state: location.state.uploadData });
    } else {
      navigate(ROUTES.UPLOAD_TEXT_REVIEW);
    }
  };

  return (
    <div className="text-service-agreement-page">
      <NavBar title="文案制作服务协议" onBack={handleBack} />

      <div className="agreement-content">
        <div className="agreement-section">
          <h2 className="section-title">一、协议概述</h2>
          <p className="section-text">
            本协议是您（以下简称"用户"或"甲方"）与本平台（以下简称"平台"或"乙方"）之间关于文案制作服务的法律协议。
            在使用本平台文案制作服务前，请您仔细阅读并充分理解本协议的全部内容，特别是免除或限制责任的条款。
          </p>
        </div>

        <div className="agreement-section">
          <h2 className="section-title">二、服务内容</h2>
          <h3 className="subsection-title">2.1 服务范围</h3>
          <p className="section-text">
            平台为用户提供专业的文案创作服务，包括但不限于：
          </p>
          <ul className="section-list">
            <li>视频脚本创作</li>
            <li>产品文案撰写</li>
            <li>营销方案策划</li>
            <li>其他创意文案服务</li>
          </ul>

          <h3 className="subsection-title">2.2 服务流程</h3>
          <ol className="section-list ordered">
            <li>用户提交创意需求和相关资料</li>
            <li>平台在24小时内完成审核并给出报价</li>
            <li>用户确认报价并完成付款</li>
            <li>平台专业团队开始制作文案</li>
            <li>初稿完成后通过站内消息通知用户</li>
            <li>用户可提出修改意见（1次免费修改）</li>
            <li>最终稿交付，服务完成</li>
          </ol>
        </div>

        <div className="agreement-section">
          <h2 className="section-title">三、用户权利与义务</h2>
          <h3 className="subsection-title">3.1 用户权利</h3>
          <ul className="section-list">
            <li>有权获得专业、高质量的文案制作服务</li>
            <li>有权在付款前了解详细的报价信息</li>
            <li>有权对初稿提出1次免费修改要求</li>
            <li>有权获得及时的客服支持和沟通</li>
            <li>有权对服务质量进行评价</li>
          </ul>

          <h3 className="subsection-title">3.2 用户义务</h3>
          <ul className="section-list">
            <li>应提供真实、准确、完整的需求信息</li>
            <li>应按照约定的价格和时间完成付款</li>
            <li>应尊重平台创作人员的劳动成果</li>
            <li>不得将文案用于违法违规用途</li>
            <li>不得恶意投诉或诋毁平台声誉</li>
          </ul>
        </div>

        <div className="agreement-section">
          <h2 className="section-title">四、平台权利与义务</h2>
          <h3 className="subsection-title">4.1 平台权利</h3>
          <ul className="section-list">
            <li>有权根据需求复杂度合理定价</li>
            <li>有权拒绝违法违规的文案需求</li>
            <li>有权对恶意用户采取限制措施</li>
            <li>有权在必要时调整服务条款</li>
          </ul>

          <h3 className="subsection-title">4.2 平台义务</h3>
          <ul className="section-list">
            <li>应在承诺时间内完成文案制作</li>
            <li>应保证文案内容的原创性和质量</li>
            <li>应保护用户的隐私和商业机密</li>
            <li>应提供1次免费修改服务</li>
            <li>应及时响应用户的咨询和反馈</li>
          </ul>
        </div>

        <div className="agreement-section">
          <h2 className="section-title">五、费用与支付</h2>
          <h3 className="subsection-title">5.1 定价原则</h3>
          <p className="section-text">
            平台根据文案的类型、难度、字数、交付时间等因素综合评估后给出报价。
            用户提供的预算仅供参考，最终价格以平台报价为准。
          </p>

          <h3 className="subsection-title">5.2 支付方式</h3>
          <p className="section-text">
            平台支持微信支付、支付宝等主流支付方式。用户需在确认报价后完成付款，平台才会开始制作。
          </p>

          <h3 className="subsection-title">5.3 退款政策</h3>
          <p className="section-text">
            <strong>付款前：</strong>用户可随时取消订单，无需支付任何费用。<br/>
            <strong>付款后、制作前：</strong>如平台尚未开始制作，用户可申请退款，扣除10%手续费。<br/>
            <strong>制作中：</strong>如因平台原因无法完成，全额退款；如因用户原因取消，不予退款。<br/>
            <strong>已交付：</strong>如用户对最终稿不满意，可申请修改（1次免费），但不支持退款。
          </p>
        </div>

        <div className="agreement-section">
          <h2 className="section-title">六、知识产权</h2>
          <h3 className="subsection-title">6.1 版权归属</h3>
          <p className="section-text">
            用户付款后，平台交付的文案著作权归用户所有。用户有权在任何场景下使用该文案，
            包括但不限于商业推广、产品宣传、内容发布等。
          </p>

          <h3 className="subsection-title">6.2 原创保证</h3>
          <p className="section-text">
            平台保证交付的文案为原创内容，不侵犯任何第三方的知识产权。
            如因文案内容引发知识产权纠纷，平台承担相应责任。
          </p>

          <h3 className="subsection-title">6.3 使用限制</h3>
          <p className="section-text">
            用户不得将文案用于违法违规用途，不得用于侵犯他人合法权益。
            如因用户不当使用导致的法律责任，由用户自行承担。
          </p>
        </div>

        <div className="agreement-section">
          <h2 className="section-title">七、保密条款</h2>
          <p className="section-text">
            双方应对在服务过程中获知的对方商业秘密、用户信息、创意内容等保密信息严格保密，
            未经对方书面同意，不得向任何第三方披露或用于本协议以外的目的。
          </p>
          <p className="section-text">
            保密义务在本协议终止后继续有效，期限为<strong>3年</strong>。
          </p>
        </div>

        <div className="agreement-section">
          <h2 className="section-title">八、免责条款</h2>
          <ul className="section-list">
            <li>因不可抗力（如自然灾害、战争、政府行为等）导致无法履行协议的，双方互不承担责任</li>
            <li>因用户提供的信息不准确、不完整导致的文案偏差，平台不承担责任</li>
            <li>因用户自身原因（如账号被盗、支付失败等）导致的损失，平台不承担责任</li>
            <li>因第三方平台（如支付平台、通信服务商）故障导致的服务中断，平台不承担责任</li>
          </ul>
        </div>

        <div className="agreement-section">
          <h2 className="section-title">九、违约责任</h2>
          <h3 className="subsection-title">9.1 用户违约</h3>
          <p className="section-text">
            如用户存在以下行为，视为违约：
          </p>
          <ul className="section-list">
            <li>提供虚假信息或恶意欺诈</li>
            <li>拒不支付已确认的费用</li>
            <li>恶意投诉或诋毁平台</li>
            <li>将文案用于违法违规用途</li>
          </ul>
          <p className="section-text">
            平台有权终止服务，并要求用户赔偿损失。
          </p>

          <h3 className="subsection-title">9.2 平台违约</h3>
          <p className="section-text">
            如平台存在以下行为，视为违约：
          </p>
          <ul className="section-list">
            <li>未在承诺时间内交付文案</li>
            <li>文案质量严重不符合要求</li>
            <li>泄露用户的保密信息</li>
            <li>文案存在抄袭或侵权问题</li>
          </ul>
          <p className="section-text">
            用户有权要求退款，并要求平台赔偿损失。
          </p>
        </div>

        <div className="agreement-section">
          <h2 className="section-title">十、争议解决</h2>
          <p className="section-text">
            双方在履行本协议过程中发生争议，应首先通过友好协商解决。
            协商不成的，任何一方均可向平台所在地人民法院提起诉讼。
          </p>
        </div>

        <div className="agreement-section">
          <h2 className="section-title">十一、其他条款</h2>
          <h3 className="subsection-title">11.1 协议生效</h3>
          <p className="section-text">
            用户点击"我已阅读并同意《文案制作服务协议》"并完成付款，即表示接受本协议的全部内容，
            本协议自用户付款之日起生效。
          </p>

          <h3 className="subsection-title">11.2 协议修改</h3>
          <p className="section-text">
            平台有权根据业务发展需要修改本协议。修改后的协议将在平台上公布，
            用户继续使用服务即视为接受修改后的协议。
          </p>

          <h3 className="subsection-title">11.3 联系方式</h3>
          <p className="section-text">
            如对本协议有任何疑问，请联系平台客服：<br/>
            客服电话：<strong>400-888-8888</strong><br/>
            服务时间：<strong>9:00-21:00</strong><br/>
            客服邮箱：<strong>service@platform.com</strong>
          </p>
        </div>

        <div className="agreement-footer">
          <p className="footer-text">本协议最终解释权归平台所有</p>
          <p className="footer-text">协议更新日期：2024年1月</p>
        </div>
      </div>
    </div>
  );
};



