> [View this README in English](./README_EN.md)

# auto-refresh-gad.js - Google AdSense（谷歌广告）自动刷新广告单元脚本

`auto-refresh-gad.js` 是一个轻量级的 JavaScript 脚本，用于在符合谷歌 AdSense 政策的前提下，实现网页广告的智能自动刷新功能。

该脚本适用于一些希望在单页面应用（SPA）中维护广告展示完整性的场景，例如广告加载失败后的容错刷新，但**不推荐用于提升广告曝光量的目的**。请务必结合自身实际需求使用。

脚本会在用户与页面交互后，智能判断广告是否可见，并在设定的时间范围内进行有限次数的刷新操作，用于提升广告填充率。

> 原创作者：[阿小信](https://blog.axiaoxin.com)  
> 项目地址：<https://github.com/axiaoxin/auto-refresh-gad.js>

## 免责声明（请务必阅读）

**请在使用本脚本前仔细阅读以下免责声明：**

1. 本脚本仅为技术演示用途，作者不鼓励、不建议将其用于任何违反 Google AdSense 政策的行为。使用者应自行了解并遵守谷歌 AdSense 的相关政策。
2. **使用本脚本存在被判定为违规流量的风险**，可能导致账号警告、广告暂停、广告收入冻结、甚至封号处理。
3. 本项目仅供参考学习用途，**作者不承担任何因使用该脚本所引发的广告异常、账号风险、收益损失或其他连带责任**，一切后果由使用者自行承担。
4. 每个网站的具体情况不同，使用者应根据自身情况调整参数并进行充分测试。

如果你在商业环境中部署，请务必：

- 阅读并理解 [Google AdSense 程序政策](https://support.google.com/adsense/answer/48182?hl=zh-Hans)
- 根据自身情况咨询专业建议
- 谨慎评估使用行为是否合规

**使用本脚本即表示您已完全理解并同意上述免责条款。**

## 谷歌 AdSense 合规性说明与风险提示

Google AdSense 政策明文禁止以下行为：

- 人为制造虚假展示（包括自动刷新广告请求）
- 操作脚本干预广告展示行为
- 任何形式的欺诈性流量生成或伪造用户行为

虽然 `auto-refresh-gad.js` 设计上避免了点击欺诈、强制刷新等行为，但**Google 使用高度自动化的风控系统**，可识别包括重复加载、可疑刷新节奏等“非自然行为”，因此你仍有以下风险：

> ⚠️ 使用本脚本可能会：
>
> - 被判定为无效流量（invalid traffic）
> - 导致广告不再展示或收益清零
> - 被暂停、限制、或永久封停 AdSense 账号

本脚本仅供技术研究和学习使用，**并不保证符合 Google AdSense 的官方政策**。

## 功能特性

- 符合 AdSense 政策要求的安全设计
- 智能视口检测，只刷新可视区域内广告
- 可配置的随机刷新间隔
- 刷新次数限制机制，防止过度刷新的限制机制
- 配置灵活，参数可自定义
- 轻量级，对网站性能影响小
- 易于集成，支持调试模式（debug: true）

## 快速使用指南：如何自动刷新谷歌广告单元？

### 步骤 1: 准备广告容器

给你想自动刷新的广告容器添加类名（默认是 `.auto-refresh-gad`），确保您的广告容器有正确的 CSS 类名。

```html
<div class="auto-refresh-gad">
  <!-- 这里是您的AdSense广告代码 -->
  <ins
    class="adsbygoogle"
    style="display:block"
    data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
    data-ad-slot="XXXXXXXXXX"
    data-ad-format="auto"
    data-full-width-responsive="true"
  ></ins>
  <script>
    (adsbygoogle = window.adsbygoogle || []).push({});
  </script>
</div>
```

### 步骤 2: 添加刷新脚本

将脚本添加到您网站的 HTML 中，在`</body>`标签前：

```html
<script src="path/to/auto-refresh-gad.js"></script>
```

或者直接内嵌脚本：

```html
<script>
  // 这里粘贴完整的auto-refresh-gad.js代码
</script>
```

### 步骤 3: 配置脚本参数（可选）

默认参数已经设置为安全的值。如需自定义，可以根据您的需求调整脚本中的配置参数。最重要的参数有：

```javascript
const CONFIG = {
  minRefreshInterval: 120000, // 最小刷新间隔（毫秒）
  maxRefreshInterval: 180000, // 最大刷新间隔（毫秒）
  maxRefreshCount: 10, // 每个广告最多刷新次数
  viewportThreshold: 0.6, // 元素需要在视口中显示的比例才触发刷新
  containerSelector: ".auto-refresh-gad", // 广告容器选择器
  stabilizationDelay: 2000, // 广告加载后稳定化延迟（毫秒）
  debug: true, // 是否启用调试日志
};
```

如果您使用了不同的类名作为广告容器，请务必修改`containerSelector`参数。

### 步骤 4: 测试与验证

1. 打开您的网站
2. 打开浏览器开发者工具（按 F12）
3. 切换到"Console"标签页
4. 滚动页面或点击页面以触发脚本初始化
5. 在控制台中应该能看到类似这样的日志：
   - "检测到用户交互，初始化广告刷新逻辑"
   - "AdSense 已加载，开始广告刷新"
   - "下一次广告刷新将在 XX 秒后"

### 步骤 5: 生产环境调整

在确认一切正常工作后，为生产环境进行以下调整：

1. 将`debug`参数设置为`false`，关闭控制台日志：
   ```javascript
   debug: false; // 关闭调试日志
   ```
2. 如果需要，提高视口阈值以确保更好的可见性：
   ```javascript
   viewportThreshold: 0.7, // 增加到70%可见度
   ```

## 最佳实践

为最大化合规性和广告效果，推荐以下设置：

1. **更长的间隔时间**：将最小刷新间隔设置为 180000（3 分钟）或更长
2. **更高的视口阈值**：将`viewportThreshold`设置为 0.7 或更高，确保广告充分可见
3. **限制刷新次数**：设置合理的`maxRefreshCount`，如 5-8 次
4. **生产环境关闭调试**：将`debug`设置为`false`

## 再次强调

> **本脚本不保证合规，使用这个脚本是您自己的选择和责任，所有使用行为由使用者自负。不当使用可能导致您的 AdSense 账户问题。**
