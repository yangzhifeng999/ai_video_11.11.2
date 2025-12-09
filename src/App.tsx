import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Toast } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import { ROUTES } from '@/constants/routes';
import { Home } from '@/pages/Home';
import { VideoDetail } from '@/pages/VideoDetail';
import { CreatorDetail } from '@/pages/CreatorDetail';
import { Purchased } from '@/pages/Purchased';
import { ResultVideo } from '@/pages/ResultVideo';
import { Profile } from '@/pages/Profile';
import { ProfileEdit } from '@/pages/ProfileEdit';
import { UploadDualVideo } from '@/pages/UploadDualVideo';
import { UploadVideoReview } from '@/pages/UploadVideoReview';
import { CreatorAgreement } from '@/pages/CreatorAgreement';
import { UploadText } from '@/pages/UploadText';
import { UploadTextReview } from '@/pages/UploadTextReview';
import { TextServiceAgreement } from '@/pages/TextServiceAgreement';
import { MakeVideo } from '@/pages/MakeVideo';
import { Messages } from '@/pages/Messages';
import Earnings from '@/pages/Earnings';
import WithdrawalRecords from '@/pages/WithdrawalRecords';
import MyWorks from '@/pages/MyWorks';
import WorkDetail from '@/pages/WorkDetail';
import { Works } from '@/pages/Works';
import { Settings } from '@/pages/Settings';
import { Points } from '@/pages/Points';
import { RevenueShare } from '@/pages/RevenueShare';
import { 
  AdminLogin, 
  AdminDashboard, 
  UserManagement, 
  UserDetail, 
  ContentReview, 
  ReviewDetail, 
  VideoManagement, 
  VideoDetail as AdminVideoDetail, 
  VideoUpload as AdminVideoUpload 
} from '@/pages/Admin';
import { LoginModal } from '@/components/LoginModal';
import { useUserStore } from '@/store/userStore';
import './App.css';

function App() {
  const { loginModalVisible, setLoginModalVisible, handleWechatCallback } = useUserStore();

  // 处理微信登录回调
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const isWechatCallback = urlParams.get('wechat_callback');

    if (code && isWechatCallback) {
      // 处理微信登录回调
      handleWechatCallback(code).then(() => {
        Toast.show({
          content: '登录成功！',
          icon: 'success',
        });
      }).catch((error) => {
        console.error('微信登录回调处理失败:', error);
        Toast.show({
          content: '登录失败，请重试',
          icon: 'fail',
        });
      });
    }
  }, [handleWechatCallback]);

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.VIDEO_DETAIL} element={<VideoDetail />} />
          <Route path={ROUTES.CREATOR_DETAIL} element={<CreatorDetail />} />
          <Route path={ROUTES.PURCHASED} element={<Purchased />} />
          <Route path={ROUTES.RESULT_VIDEO} element={<ResultVideo />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />
          <Route path={ROUTES.PROFILE_EDIT} element={<ProfileEdit />} />
          <Route path={ROUTES.UPLOAD_DUAL_VIDEO} element={<UploadDualVideo />} />
          <Route path={ROUTES.UPLOAD_VIDEO_REVIEW} element={<UploadVideoReview />} />
          <Route path={ROUTES.CREATOR_AGREEMENT} element={<CreatorAgreement />} />
          <Route path={ROUTES.UPLOAD_TEXT} element={<UploadText />} />
          <Route path={ROUTES.UPLOAD_TEXT_REVIEW} element={<UploadTextReview />} />
          <Route path={ROUTES.TEXT_SERVICE_AGREEMENT} element={<TextServiceAgreement />} />
          <Route path={ROUTES.MAKE_VIDEO} element={<MakeVideo />} />
          <Route path={ROUTES.MESSAGES} element={<Messages />} />
          <Route path={ROUTES.EARNINGS} element={<Earnings />} />
          <Route path={ROUTES.EARNINGS_WITHDRAWALS} element={<WithdrawalRecords />} />
          <Route path={ROUTES.MY_WORKS} element={<MyWorks />} />
          <Route path={ROUTES.WORK_DETAIL} element={<WorkDetail />} />
          <Route path={ROUTES.WORKS} element={<Works />} />
          <Route path={ROUTES.SETTINGS} element={<Settings />} />
          <Route path={ROUTES.POINTS} element={<Points />} />
          <Route path={ROUTES.REVENUE_SHARE} element={<RevenueShare />} />
          
          {/* 管理后台路由 */}
          <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLogin />} />
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
          <Route path={ROUTES.ADMIN_USERS} element={<UserManagement />} />
          <Route path={ROUTES.ADMIN_USER_DETAIL} element={<UserDetail />} />
          {/* 内容审核 */}
          <Route path={ROUTES.ADMIN_REVIEW} element={<ContentReview />} />
          <Route path={ROUTES.ADMIN_REVIEW_DETAIL} element={<ReviewDetail />} />
          {/* 视频管理 */}
          <Route path={ROUTES.ADMIN_VIDEOS} element={<VideoManagement />} />
          <Route path={ROUTES.ADMIN_VIDEO_DETAIL} element={<AdminVideoDetail />} />
          <Route path={ROUTES.ADMIN_VIDEO_UPLOAD} element={<AdminVideoUpload />} />
          
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>

        {/* 全局登录弹窗 */}
        <LoginModal
          visible={loginModalVisible}
          onClose={() => setLoginModalVisible(false)}
        />
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;

