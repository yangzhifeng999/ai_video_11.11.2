import { z } from 'zod';

/**
 * 视频分类验证
 */
export const videoCategorySchema = z.enum(['comprehensive', 'mother_baby', 'clothing', 'general_merchandise']);

/**
 * 视频上传表单验证
 */
export const videoUploadSchema = z.object({
  title: z.string().min(2, '标题至少2个字符').max(100, '标题最多100个字符'),
  description: z.string().max(500, '描述最多500个字符').optional(),
  category: videoCategorySchema,
  price: z.number().min(0.01, '价格必须大于0').max(9999.99, '价格不能超过9999.99元'),
});

/**
 * 文案上传表单验证
 */
export const textUploadSchema = z.object({
  type: z.enum(['article', 'script', 'copywriting', 'other']),
  title: z.string().min(2, '标题至少2个字符').max(100, '标题最多100个字符'),
  content: z.string().min(10, '正文至少10个字符').max(10000, '正文最多10000个字符'),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().max(200, '目标受众描述最多200个字符').optional(),
  price: z.number().min(0.01, '价格必须大于0').max(9999.99, '价格不能超过9999.99元'),
  usageRights: z.string().min(1, '请选择使用权限'),
});

/**
 * 用户资料更新验证
 */
export const userProfileSchema = z.object({
  nickname: z.string().min(2, '昵称至少2个字符').max(20, '昵称最多20个字符'),
  gender: z.enum(['male', 'female', 'secret']).optional(),
  bio: z.string().max(200, '个人简介最多200个字符').optional(),
});

/**
 * 邮箱验证
 */
export const emailSchema = z.string().email('请输入有效的邮箱地址');

/**
 * 手机号验证
 */
export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号');





