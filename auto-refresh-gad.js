/**
 * 谷歌广告自动刷新脚本（blog.axiaoxin.com）
 */
(function () {
  // 可配置参数
  const CONFIG = Object.assign(
    {
      minRefreshInterval: 120000, // 最小刷新间隔（毫秒）
      maxRefreshInterval: 180000, // 最大刷新间隔（毫秒）
      maxRefreshCount: 5, // 每个广告最多刷新次数
      viewportThreshold: 0.7, // 元素需要在视口中显示的比例才触发刷新
      containerSelector: ".auto-refresh-gad", // 广告容器选择器
      stabilizationDelay: 2000, // 广告加载后稳定化延迟（毫秒）
      debug: false, // 是否启用调试日志
    },
    window.CONFIG || {}
  );

  let refreshTimeout = null;
  let isInitialized = false;

  // 日志工具
  const Logger = {
    info: (message) => {
      if (CONFIG.debug)
        console.log(`✅ ${new Date().toLocaleTimeString()} - ${message}`);
    },
    warn: (message) => {
      if (CONFIG.debug) console.warn(`⚠️ ${message}`);
    },
    error: (message, err) => {
      if (CONFIG.debug) console.error(`❌ ${message}`, err || "");
    },
  };

  // 判断元素是否足够比例地出现在视口中
  function isElementVisibleEnough(el) {
    if (!el) return false;

    try {
      const rect = el.getBoundingClientRect();
      if (rect.height === 0) return false;

      const windowHeight = window.innerHeight;
      const visibleHeight =
        Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
      const visibleRatio = visibleHeight / rect.height;

      return visibleRatio >= CONFIG.viewportThreshold;
    } catch (e) {
      Logger.error("视口检测失败", e);
      return false;
    }
  }

  // 检查是否可以刷新广告
  function canRefreshAd(container) {
    // 检查刷新次数是否已达上限
    const refreshCount = parseInt(container.dataset.refreshCount || "0", 10);
    if (refreshCount >= CONFIG.maxRefreshCount) return false;

    // 检查上次刷新时间是否满足间隔要求
    const lastRefreshTime = parseInt(container.dataset.lastRefresh || "0", 10);
    const now = Date.now();
    if (lastRefreshTime && now - lastRefreshTime < CONFIG.minRefreshInterval)
      return false;

    // 检查是否在视口中足够可见
    if (!isElementVisibleEnough(container)) return false;

    return true;
  }

  // 刷新单个广告容器
  function refreshAdContainer(container) {
    try {
      const existingAd = container.querySelector("ins.adsbygoogle");
      if (!existingAd) return false;

      // 保存容器高度和广告属性
      const containerHeight = container.offsetHeight;
      if (containerHeight > 0) {
        container.style.minHeight = `${containerHeight}px`;
      }

      // 提取原有广告属性
      const adProps = {
        client: existingAd.getAttribute("data-ad-client"),
        slot: existingAd.getAttribute("data-ad-slot"),
        format: existingAd.getAttribute("data-ad-format"),
        responsive: existingAd.getAttribute("data-full-width-responsive"),
        display: existingAd.style.display || "block",
      };

      // 清空容器并创建新广告
      container.innerHTML = "";
      const newAd = document.createElement("ins");
      newAd.className = "adsbygoogle";
      newAd.style.display = adProps.display;
      newAd.setAttribute("data-ad-client", adProps.client);
      newAd.setAttribute("data-ad-slot", adProps.slot);
      if (adProps.format) newAd.setAttribute("data-ad-format", adProps.format);
      if (adProps.responsive)
        newAd.setAttribute("data-full-width-responsive", adProps.responsive);

      container.appendChild(newAd);

      // 安全地推送新广告
      if (window.adsbygoogle !== undefined) {
        try {
          (adsbygoogle = window.adsbygoogle || []).push({});

          // 更新容器状态数据
          const currentCount = parseInt(
            container.dataset.refreshCount || "0",
            10
          );
          container.dataset.refreshCount = currentCount + 1;
          container.dataset.lastRefresh = Date.now().toString();

          // 广告加载后清除最小高度
          setTimeout(() => {
            container.style.minHeight = "";

            // 检查是否成功加载
            if (newAd.offsetHeight === 0 && newAd.clientHeight === 0) {
              Logger.warn(
                `广告容器 ID:${container.id || "未知"} 刷新后可能未成功加载`
              );
            }
          }, CONFIG.stabilizationDelay);

          return true;
        } catch (e) {
          Logger.error("推送广告失败", e);
          return false;
        }
      } else {
        Logger.warn("AdSense未就绪，无法刷新广告");
        return false;
      }
    } catch (error) {
      Logger.error(`广告容器刷新失败`, error);
      return false;
    }
  }

  // 执行广告刷新
  function refreshAds() {
    if (document.hidden) {
      Logger.info("页面不可见，暂停广告刷新");
      return;
    }

    const adContainers = document.querySelectorAll(CONFIG.containerSelector);
    let refreshedCount = 0;

    adContainers.forEach((container) => {
      if (canRefreshAd(container)) {
        if (refreshAdContainer(container)) {
          refreshedCount++;
        }
      }
    });

    if (refreshedCount > 0) {
      Logger.info(`成功刷新 ${refreshedCount} 个广告容器`);
    } else {
      Logger.warn("本轮没有广告容器需要刷新");
    }

    scheduleNextRefresh();
  }

  // 安排下一次刷新
  function scheduleNextRefresh() {
    if (refreshTimeout) clearTimeout(refreshTimeout);

    // 检查是否有可刷新的广告容器
    const adContainers = document.querySelectorAll(CONFIG.containerSelector);
    const hasRefreshable = Array.from(adContainers).some((container) => {
      const refreshCount = parseInt(container.dataset.refreshCount || "0", 10);
      return refreshCount < CONFIG.maxRefreshCount;
    });

    if (!hasRefreshable) {
      Logger.info("所有广告容器均已刷新完毕，停止刷新");
      return;
    }

    // 随机刷新间隔
    const interval =
      Math.floor(
        Math.random() *
          (CONFIG.maxRefreshInterval - CONFIG.minRefreshInterval + 1)
      ) + CONFIG.minRefreshInterval;

    refreshTimeout = setTimeout(refreshAds, interval);
    Logger.info(`下一次广告刷新将在 ${Math.round(interval / 1000)} 秒后`);
  }

  // 页面可见性变化处理
  function handleVisibilityChange() {
    if (document.hidden) {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
      }
      Logger.info("页面不可见，暂停广告刷新计时");
    } else {
      if (!refreshTimeout && isInitialized) {
        Logger.info("页面重新可见，恢复广告刷新计时");
        scheduleNextRefresh();
      }
    }
  }

  // 初始化刷新逻辑
  function initAdRefresh() {
    if (isInitialized) return;

    document.addEventListener("visibilitychange", handleVisibilityChange);

    function checkAdsenseAndInitialize() {
      if (typeof window.adsbygoogle !== "undefined") {
        Logger.info("AdSense 已加载，开始广告刷新");
        isInitialized = true;
        scheduleNextRefresh();
      } else {
        Logger.info("等待 AdSense 加载...");
        setTimeout(checkAdsenseAndInitialize, 1000);
      }
    }

    checkAdsenseAndInitialize();
  }

  // 监听滚动事件，用户滚动后初始化
  function waitForUserInteraction() {
    // 同时监听滚动和点击事件，任一触发都初始化
    function onInteractOnce() {
      window.removeEventListener("scroll", onInteractOnce);
      window.removeEventListener("click", onInteractOnce);
      Logger.info("检测到用户交互，初始化广告刷新逻辑");
      initAdRefresh();
    }

    window.addEventListener("scroll", onInteractOnce, { once: true });
    window.addEventListener("click", onInteractOnce, { once: true });

    // 如果用户长时间不交互，也初始化（30秒后）
    setTimeout(() => {
      if (!isInitialized) {
        Logger.info("用户长时间无交互，自动初始化广告刷新逻辑");
        initAdRefresh();
      }
    }, 30000);
  }

  // 根据页面加载状态启动监听
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForUserInteraction);
  } else {
    waitForUserInteraction();
  }
})();
