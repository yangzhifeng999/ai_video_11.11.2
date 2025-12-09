import type { IVideo, VideoCategory, IVideoUploadConfig } from '@/types';
import type { IOrder, OrderStatus } from '@/types/order';

// 预定义的上传配置模板
const uploadConfigs: Record<string, IVideoUploadConfig> = {
  // 单人照片上传（默认）
  singleFace: {
    title: '上传你的照片',
    description: 'AI将自动替换视频中的人物',
    items: [
      {
        id: 'face-1',
        type: 'face',
        label: '正面照片',
        description: '请上传一张清晰的正面照片，五官需清晰可见',
        required: true,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
      },
    ],
  },
  
  // 多人物上传（家庭合影等）
  multiPerson: {
    title: '上传人物照片',
    description: '请分别上传每个人物的照片',
    items: [
      {
        id: 'person-1',
        type: 'face',
        label: '人物A',
        description: '第一个人物的正面清晰照片',
        required: true,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
      },
      {
        id: 'person-2',
        type: 'face',
        label: '人物B',
        description: '第二个人物的正面清晰照片',
        required: true,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
      },
      {
        id: 'person-3',
        type: 'face',
        label: '人物C（可选）',
        description: '第三个人物的正面清晰照片',
        required: false,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
      },
    ],
  },
  
  // 食材上传（烹饪视频）
  ingredients: {
    title: '上传食材照片',
    description: '请上传以下食材的清晰照片，AI将生成烹饪效果',
    items: [
      {
        id: 'ingredient-1',
        type: 'ingredient',
        label: '主料',
        description: '请上传主要食材的照片（如肉类、海鲜等）',
        required: true,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
        exampleImageUrl: 'https://picsum.photos/seed/meat/100/100',
      },
      {
        id: 'ingredient-2',
        type: 'ingredient',
        label: '配料1',
        description: '请上传第一种配料的照片（如蔬菜）',
        required: true,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
        exampleImageUrl: 'https://picsum.photos/seed/veggie1/100/100',
      },
      {
        id: 'ingredient-3',
        type: 'ingredient',
        label: '配料2（可选）',
        description: '请上传第二种配料的照片',
        required: false,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
      },
    ],
  },
  
  // 产品展示（模特+产品）
  productShowcase: {
    title: '上传展示素材',
    description: '请上传模特照片和产品照片',
    items: [
      {
        id: 'model-1',
        type: 'face',
        label: '模特照片',
        description: '请上传模特的正面清晰照片',
        required: true,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
      },
      {
        id: 'product-1',
        type: 'object',
        label: '产品照片',
        description: '请上传产品的清晰照片',
        required: true,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
        exampleImageUrl: 'https://picsum.photos/seed/product/100/100',
      },
    ],
  },
  
  // 宠物+主人
  petAndOwner: {
    title: '上传照片',
    description: '请上传您和宠物的照片',
    items: [
      {
        id: 'owner-1',
        type: 'face',
        label: '主人照片',
        description: '请上传主人的正面清晰照片',
        required: true,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
      },
      {
        id: 'pet-1',
        type: 'other',
        label: '宠物照片',
        description: '请上传宠物的正面清晰照片',
        required: true,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
        exampleImageUrl: 'https://picsum.photos/seed/pet/100/100',
      },
    ],
  },
  
  // 场景替换
  sceneReplace: {
    title: '上传素材',
    description: '请上传人物照片和背景场景',
    items: [
      {
        id: 'person-1',
        type: 'face',
        label: '人物照片',
        description: '请上传要出现在视频中的人物照片',
        required: true,
        validation: {
          maxSize: 10 * 1024 * 1024,
        },
      },
      {
        id: 'scene-1',
        type: 'scene',
        label: '背景场景',
        description: '请上传想要的背景场景图片',
        required: false,
        validation: {
          maxSize: 15 * 1024 * 1024,
        },
        exampleImageUrl: 'https://picsum.photos/seed/scene/100/100',
      },
    ],
  },
};

// 使用真实的视频资源（示例视频URL）- 只使用确认可用的URL
const videoUrls = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  // 重复使用可用的视频URL以增加数量
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
];

// 创建视频数据的辅助函数
const createVideo = (
  id: string,
  title: string,
  category: VideoCategory,
  videoUrlIndex: number,
  coverSeed: number,
  uploadConfigKey?: keyof typeof uploadConfigs
): IVideo => {
  const price = Math.floor(Math.random() * 50) + 10; // 确保price是有效数字
  return {
    id,
    title,
    description: `${title}的详细描述`,
    videoUrl: videoUrls[videoUrlIndex],
    coverUrl: `https://picsum.photos/seed/${coverSeed}/300/200`,
    // AI换脸前后对比视频URL（竖版视频）- 使用不同的视频作为对比示例
    comparisonVideoUrl: videoUrls[(videoUrlIndex + 1) % videoUrls.length],
    price,
    category,
    creatorId: 'creator-1',
    status: 'approved',
    creator: {
      id: 'creator-1',
      nickname: '创作者' + Math.floor(Math.random() * 100),
      avatar: `https://picsum.photos/seed/avatar${Math.floor(Math.random() * 100)}/50/50`,
    },
    viewCount: Math.floor(Math.random() * 10000),
    likeCount: Math.floor(Math.random() * 1000),
    dislikeCount: Math.floor(Math.random() * 200),
    collectCount: Math.floor(Math.random() * 500),
    duration: Math.floor(Math.random() * 300) + 60, // 1-5分钟
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // 使用指定的上传配置，或默认使用单人人脸配置
    uploadConfig: uploadConfigKey ? uploadConfigs[uploadConfigKey] : uploadConfigs.singleFace,
  };
};

// Mock视频数据 - 每个分类15条视频，使用不同的上传配置
export const mockVideos: IVideo[] = [
  // 综合分类 - 15条（增加更多内容确保可滚动）
  // 使用不同的上传配置来测试各种场景
  createVideo('1', '个人形象视频', 'comprehensive', 0, 1, 'singleFace'),           // 单人人脸
  createVideo('2', '家庭合影视频', 'comprehensive', 1, 2, 'multiPerson'),          // 多人物
  createVideo('3', '美食烹饪教程', 'comprehensive', 2, 3, 'ingredients'),          // 食材
  createVideo('4', '产品展示视频', 'comprehensive', 3, 4, 'productShowcase'),      // 产品展示
  createVideo('5', '宠物萌宠视频', 'comprehensive', 4, 5, 'petAndOwner'),          // 宠物+主人
  createVideo('6', '旅行风景视频', 'comprehensive', 5, 6, 'sceneReplace'),         // 场景替换
  createVideo('7', '个人舞蹈视频', 'comprehensive', 6, 7, 'singleFace'),
  createVideo('8', '双人舞蹈视频', 'comprehensive', 7, 8, 'multiPerson'),
  createVideo('9', '综合视频9', 'comprehensive', 8, 9, 'singleFace'),
  createVideo('10', '综合视频10', 'comprehensive', 9, 10, 'singleFace'),
  createVideo('11', '综合视频11', 'comprehensive', 10, 11, 'singleFace'),
  createVideo('12', '综合视频12', 'comprehensive', 11, 12, 'singleFace'),
  createVideo('13', '综合视频13', 'comprehensive', 12, 13, 'singleFace'),
  createVideo('14', '综合视频14', 'comprehensive', 13, 14, 'singleFace'),
  createVideo('15', '综合视频15', 'comprehensive', 14, 15, 'singleFace'),

  // 母婴分类 - 15条
  createVideo('mb-1', '亲子互动视频', 'mother_baby', 15, 16, 'multiPerson'),       // 多人物（亲子）
  createVideo('mb-2', '宝宝写真视频', 'mother_baby', 16, 17, 'singleFace'),
  createVideo('mb-3', '育儿辅食教程', 'mother_baby', 17, 18, 'ingredients'),       // 食材（辅食）
  createVideo('mb-4', '母婴产品展示', 'mother_baby', 0, 19, 'productShowcase'),
  createVideo('mb-5', '母婴视频5', 'mother_baby', 1, 20, 'singleFace'),
  createVideo('mb-6', '母婴视频6', 'mother_baby', 2, 21, 'singleFace'),
  createVideo('mb-7', '母婴视频7', 'mother_baby', 3, 22, 'singleFace'),
  createVideo('mb-8', '母婴视频8', 'mother_baby', 4, 23, 'singleFace'),
  createVideo('mb-9', '母婴视频9', 'mother_baby', 5, 24, 'singleFace'),
  createVideo('mb-10', '母婴视频10', 'mother_baby', 6, 25, 'singleFace'),
  createVideo('mb-11', '母婴视频11', 'mother_baby', 7, 26, 'singleFace'),
  createVideo('mb-12', '母婴视频12', 'mother_baby', 8, 27, 'singleFace'),
  createVideo('mb-13', '母婴视频13', 'mother_baby', 9, 28, 'singleFace'),
  createVideo('mb-14', '母婴视频14', 'mother_baby', 10, 29, 'singleFace'),
  createVideo('mb-15', '母婴视频15', 'mother_baby', 11, 30, 'singleFace'),

  // 服装分类 - 15条
  createVideo('cl-1', '时尚穿搭展示', 'clothing', 12, 31, 'productShowcase'),      // 模特+产品
  createVideo('cl-2', '情侣穿搭视频', 'clothing', 13, 32, 'multiPerson'),          // 多人物
  createVideo('cl-3', '服装视频3', 'clothing', 14, 33, 'singleFace'),
  createVideo('cl-4', '服装视频4', 'clothing', 15, 34, 'singleFace'),
  createVideo('cl-5', '服装视频5', 'clothing', 16, 35, 'singleFace'),
  createVideo('cl-6', '服装视频6', 'clothing', 17, 36, 'singleFace'),
  createVideo('cl-7', '服装视频7', 'clothing', 0, 37, 'singleFace'),
  createVideo('cl-8', '服装视频8', 'clothing', 1, 38, 'singleFace'),
  createVideo('cl-9', '服装视频9', 'clothing', 2, 39, 'singleFace'),
  createVideo('cl-10', '服装视频10', 'clothing', 3, 40, 'singleFace'),
  createVideo('cl-11', '服装视频11', 'clothing', 4, 41, 'singleFace'),
  createVideo('cl-12', '服装视频12', 'clothing', 5, 42, 'singleFace'),
  createVideo('cl-13', '服装视频13', 'clothing', 6, 43, 'singleFace'),
  createVideo('cl-14', '服装视频14', 'clothing', 7, 44, 'singleFace'),
  createVideo('cl-15', '服装视频15', 'clothing', 8, 45, 'singleFace'),

  // 百货分类 - 15条
  createVideo('gm-1', '居家好物展示', 'general_merchandise', 9, 46, 'productShowcase'),
  createVideo('gm-2', '美食制作分享', 'general_merchandise', 10, 47, 'ingredients'),  // 食材
  createVideo('gm-3', '宠物用品展示', 'general_merchandise', 11, 48, 'petAndOwner'),
  createVideo('gm-4', '百货视频4', 'general_merchandise', 12, 49, 'singleFace'),
  createVideo('gm-5', '百货视频5', 'general_merchandise', 13, 50, 'singleFace'),
  createVideo('gm-6', '百货视频6', 'general_merchandise', 14, 51, 'singleFace'),
  createVideo('gm-7', '百货视频7', 'general_merchandise', 15, 52, 'singleFace'),
  createVideo('gm-8', '百货视频8', 'general_merchandise', 16, 53, 'singleFace'),
  createVideo('gm-9', '百货视频9', 'general_merchandise', 17, 54, 'singleFace'),
  createVideo('gm-10', '百货视频10', 'general_merchandise', 0, 55, 'singleFace'),
  createVideo('gm-11', '百货视频11', 'general_merchandise', 1, 56, 'singleFace'),
  createVideo('gm-12', '百货视频12', 'general_merchandise', 2, 57, 'singleFace'),
  createVideo('gm-13', '百货视频13', 'general_merchandise', 3, 58, 'singleFace'),
  createVideo('gm-14', '百货视频14', 'general_merchandise', 4, 59, 'singleFace'),
  createVideo('gm-15', '百货视频15', 'general_merchandise', 5, 60, 'singleFace'),
];

// 创建订单数据的辅助函数
const createOrder = (
  id: string,
  status: OrderStatus,
  itemTitle: string,
  price: number,
  paymentMethod: 'wechat' | 'alipay' | 'points',
  progress?: number,
  estimatedTime?: string,
  refundReason?: string
): IOrder => {
  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // 最近7天内
  
  return {
    id,
    userId: 'user-1',
    type: 'ai_video',
    status,
    itemId: mockVideos[Math.floor(Math.random() * mockVideos.length)].id,
    itemTitle,
    itemCover: `https://picsum.photos/seed/order${id}/300/400`,
    price,
    paymentMethod,
    paymentStatus: status === 'pending' ? 'unpaid' : 'paid',
    paidAt: status === 'pending' ? undefined : createdAt.toISOString(),
    progress,
    estimatedTime,
    refundReason,
    refundAmount: status === 'refunded' ? price : undefined,
    resultUrl: status === 'completed' ? videoUrls[Math.floor(Math.random() * videoUrls.length)] : undefined,
    resultVideoUrl: status === 'completed' ? videoUrls[Math.floor(Math.random() * videoUrls.length)] : undefined,
    resultVideoId: status === 'completed' ? mockVideos[0].id : undefined,
    createdAt: createdAt.toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Mock订单数据
export const mockOrders: IOrder[] = [
  // 制作中订单（混合支付方式）
  createOrder('order-1', 'processing', '综合视频1 - AI换脸', 9.90, 'wechat', 45, '15分钟'),
  createOrder('order-2', 'processing', '母婴视频3 - AI换脸', 1250, 'points', 78, '8分钟'), // 积分支付
  createOrder('order-3', 'processing', '服装视频2 - AI换脸', 15.00, 'alipay', 23, '25分钟'),
  
  // 已完成订单（混合支付方式）
  createOrder('order-4', 'completed', '综合视频5 - AI换脸', 9.90, 'wechat'),
  createOrder('order-5', 'completed', '百货视频1 - AI换脸', 1180, 'points'), // 积分支付
  createOrder('order-6', 'completed', '母婴视频7 - AI换脸', 13.50, 'alipay'),
  createOrder('order-7', 'completed', '服装视频9 - AI换脸', 1420, 'points'), // 积分支付
  createOrder('order-8', 'completed', '综合视频12 - AI换脸', 10.50, 'wechat'),
  
  // 已退款订单（混合支付方式）
  createOrder('order-9', 'refunded', '综合视频8 - AI换脸', 9.90, 'wechat', undefined, undefined, '照片质量不符合要求，系统自动退款'),
  createOrder('order-10', 'refunded', '母婴视频4 - AI换脸', 1200, 'points', undefined, undefined, '视频处理超时'), // 积分支付
  
  // 失败订单（混合支付方式）
  createOrder('order-11', 'failed', '服装视频6 - AI换脸', 13.50, 'alipay', undefined, undefined, '照片处理失败，请使用更清晰的照片'),
  createOrder('order-12', 'failed', '百货视频3 - AI换脸', 1100, 'points', undefined, undefined, '视频源文件损坏'), // 积分支付
];
