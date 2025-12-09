/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_COS_SECRET_ID: string;
  readonly VITE_COS_SECRET_KEY: string;
  readonly VITE_COS_BUCKET: string;
  readonly VITE_COS_REGION: string;
  readonly VITE_TENCENT_VOD_SECRET_ID: string;
  readonly VITE_TENCENT_VOD_SECRET_KEY: string;
  readonly VITE_WECHAT_PAY_APP_ID: string;
  readonly VITE_ALIPAY_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

