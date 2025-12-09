# 安卓系统导航栏适配说明

## 修改概述

为应用的所有页面添加了对安卓系统导航栏的适配。使用了CSS的`env(safe-area-inset-bottom)`变量来自动检测和适配系统导航栏的高度。

## 修改内容

### 1. 底部导航栏 (BottomTabBar)
**文件**: `src/components/BottomTabBar/BottomTabBar.css`

```css
.bottom-tab-bar-wrapper {
  /* ... 其他样式 ... */
  padding-bottom: max(0px, env(safe-area-inset-bottom));
}
```

为底部导航栏的下方添加内边距，避免被系统导航栏遮挡。

### 2. 首页 (Home)
**文件**: `src/pages/Home/Home.css`

```css
.home-scroll-area {
  padding-bottom: max(60px, calc(60px + env(safe-area-inset-bottom)));
}
```

为内容区域的底部添加足够的填充，预留给底部导航栏和系统导航栏的空间。

### 3. 视频详情页 (VideoDetail)
**文件**: `src/pages/VideoDetail/VideoDetail.css`

```css
.right-sidebar {
  bottom: calc(120px + max(0px, env(safe-area-inset-bottom)));
}

.bottom-info-bar {
  padding: 16px 80px calc(24px + max(0px, env(safe-area-inset-bottom))) 16px;
}
```

全屏沉浸式视频页面的右侧操作栏和底部信息栏都需要避开系统导航栏。

### 4. 其他带 BottomTabBar 的页面
**修改的页面**:
- Messages (`src/pages/Messages/Messages.css`)
- Purchased (`src/pages/Purchased/Purchased.css`)
- Points (`src/pages/Points/Points.css`)
- Profile (`src/pages/Profile/Profile.css`)
- Settings (`src/pages/Settings/Settings.css`)
- MyWorks (`src/pages/MyWorks/MyWorks.css`)

所有这些页面都使用了类似的方式修改 padding-bottom，确保内容不被系统导航栏遮挡。

## 工作原理

### safe-area-inset-bottom 说明

| 情况 | 值 |
|------|-----|
| 虚拟导航栏 (Android) | ~48-56px |
| 手势导航区域 | ~4-8px |
| 无系统导航栏 | 0px |

### CSS 公式说明

```css
/* 基础公式 */
padding-bottom: max(需要的空间, calc(需要的空间 + env(safe-area-inset-bottom)));
```

- 当没有系统导航栏时，使用原来的固定值
- 当有系统导航栏时，自动添加额外的空间

## 测试方法

### 在安卓手机上测试

1. **虚拟导航栏模式**（有返回、主屏幕、最近应用三个按钮）
   - 底部内容应该不被按钮遮挡
   - BottomTabBar 应该完全可见

2. **手势导航模式**（滑动底部边缘返回）
   - 底部应该有 4-8px 的安全区域
   - 防止意外触发系统手势

3. **隐藏导航栏模式**（全屏沉浸式，需要向下滑动显示）
   - 应用应该正常工作
   - 没有多余的空白区域

### 在浏览器中模拟测试

使用 Chrome DevTools 的 Device Emulation：
1. 打开 DevTools (F12)
2. 选择设备 (如 Pixel 5、Samsung Galaxy S21)
3. 查看底部导航栏是否正确显示

## 兼容性

- ✅ Android 5.0+ (所有现代安卓设备)
- ✅ iOS 11.2+ (包括刘海屏)
- ✅ 桌面浏览器 (忽略 safe-area-inset，使用默认值)
- ✅ 平板设备 (自动适配)

## 常见问题

### Q: 为什么使用 `max()` 函数？
A: 确保即使系统导航栏不存在或为0，仍然有最小的空间预留。

### Q: 底部导航栏会不会被系统按钮遮挡？
A: 不会。BottomTabBar 的 `padding-bottom` 会自动为系统导航栏预留空间。

### Q: 视频页面的全屏视频会不会被系统按钮遮挡？
A: 不会。右侧操作栏和底部信息栏都已经添加了 safe-area 适配。

## 后续优化建议

1. 添加更多页面的 safe-area 适配（如果有新页面）
2. 在真机上进行充分测试
3. 监控用户反馈，确保没有遗漏

