/**
 * 谷歌广告自动刷新脚本（blog.axiaoxin.com）
 */
(function () {
  // 可配置参数
  const CONFIG = Object.assign(
    {
      minRefreshInterval: 30000, // 最小刷新间隔（毫秒）
      maxRefreshInterval: 60000, // 最大刷新间隔（毫秒）
      maxRefreshCount: 20, // 每个广告最多刷新次数
      viewportThreshold: 0.45, // 元素需要在视口中显示的比例才触发刷新
      containerSelector: ".auto-refresh-gad", // 广告容器选择器，可以使用逗号分隔多个选择器，如".ad1, .ad2, #special-ad"
      debug: true, // 是否启用调试日志
      requireUserInteraction: false, // 是否需要用户交互后才初始化
      initializationDelay: 5000, // 无交互时初始化延迟（毫秒）
      logLevel: "info", // 'error', 'warn', 'info'
    },
    window.CONFIG || {}
  );

  const LOG_LEVELS = {
    'error': 0,
    'warn': 1,
    'info': 2
  };

  // 日志工具
  const Logger = {
    info: (message) => {
      if (CONFIG.debug && LOG_LEVELS[CONFIG.logLevel] >= 2)
        console.log(`✅ ${new Date().toLocaleTimeString()} - ${message}`);
    },
    warn: (message) => {
      if (CONFIG.debug && LOG_LEVELS[CONFIG.logLevel] >= 1) 
        console.warn(`⚠️ ${message}`);
    },
    error: (message, err) => {
      if (CONFIG.debug) console.error(`❌ ${message}`, err || "");
    },
  };

  // 验证配置
  if (CONFIG.minRefreshInterval > CONFIG.maxRefreshInterval) {
    Logger.error("配置错误: minRefreshInterval 不能大于 maxRefreshInterval");
    CONFIG.minRefreshInterval = CONFIG.maxRefreshInterval;
  }

  let refreshTimeout = null;
  let isInitialized = false;
  let remainingTime = 0;

  // 使用Intersection Observer替代手动视口检测
  const observers = new Map(); // 存储每个广告容器的观察者

  // 检查是否支持Intersection Observer
  if (!('IntersectionObserver' in window)) {
    Logger.warn("您的浏览器不支持Intersection Observer API，将使用传统方法检测广告可见性");
  }

  // 创建并启动元素的交叉观察
  function observeAdVisibility(container) {
    if (observers.has(container)) return; // 已经在观察中
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // 更新元素的可见状态
          const wasVisible = entry.target.dataset.wasVisible === "true";
          const isVisible = entry.intersectionRatio >= CONFIG.viewportThreshold;
          
          // 当元素离开视口时，标记为不可见
          if (!isVisible && wasVisible) {
            entry.target.dataset.wasVisible = "false";
            Logger.info(`广告容器离开视口`);
            
            // 添加短暂延迟，避免快速滚动导致的频繁取消/重启
            setTimeout(() => {
              checkVisibleAdsAndSchedule();
            }, 200); // 200毫秒延迟
          }
          
          // 当元素进入视口时，重置刷新计数并标记为可见
          if (isVisible && !wasVisible) {
            entry.target.dataset.wasVisible = "true";
            entry.target.dataset.refreshCount = "0";
            
            // 如果当前没有计划的刷新，立即启动一个
            if (!refreshTimeout && isInitialized) {
              const hasVisibleAds = Array.from(document.querySelectorAll(CONFIG.containerSelector)).some(
                container => container.dataset.wasVisible === "true"
              );
              if (hasVisibleAds) {
                Logger.info(`广告容器进入视口，重置刷新计数`);
                scheduleNextRefresh(true);
              }
            } else if (window._nextRefreshTime) {
              // 如果已有计划中的刷新，显示现有的下次刷新时间
              const nextRefreshTime = new Date(window._nextRefreshTime);
              const formattedTime = nextRefreshTime.toLocaleTimeString();
              const secondsRemaining = Math.round((window._nextRefreshTime - Date.now()) / 1000);
              
              Logger.info(`广告容器进入视口，重置刷新计数，将在已计划的刷新中处理 (${formattedTime}，剩余 ${secondsRemaining} 秒)`);
            }
          }
        });
      },
      {
        threshold: [CONFIG.viewportThreshold],
        rootMargin: "0px"
      }
    );
    
    observer.observe(container);
    observers.set(container, observer);
  }

  // 检查是否有可见的广告单元并相应地调度刷新
  function checkVisibleAdsAndSchedule() {
    // 检查是否有可刷新的广告容器（考虑视口可见性）
    const adContainers = document.querySelectorAll(CONFIG.containerSelector);
    const hasVisibleAds = Array.from(adContainers).some(container => 
      container.dataset.wasVisible === "true"
    );
    
    // 如果没有可见的广告单元，取消当前计划的刷新
    if (!hasVisibleAds && refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
      Logger.info("所有广告容器离开视口，暂停刷新");
    } 
    // 如果有可见的广告单元但没有计划的刷新，启动一个
    else if (hasVisibleAds && !refreshTimeout && isInitialized) {
      scheduleNextRefresh(true);
    }
  }

  // 初始化所有广告容器的观察
  function initAdObservers() {
    const adContainers = document.querySelectorAll(CONFIG.containerSelector);
    adContainers.forEach(container => {
      observeAdVisibility(container);
    });
  }

  // 判断元素是否足够比例地出现在视口中
  // 保留此函数用于兼容性，但主要依赖Observer
  function isElementVisibleEnough(el) {
    if (!el) return false;
    
    // 如果已经由Observer设置了可见状态，直接使用
    if (el.dataset.wasVisible !== undefined) {
      return el.dataset.wasVisible === "true";
    }
    
    // 降级方案：手动计算
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
    // 检查刷新次数是否已达上限（-1表示无限制）
    const refreshCount = parseInt(container.dataset.refreshCount || "0", 10);
    if (CONFIG.maxRefreshCount !== -1 && refreshCount >= CONFIG.maxRefreshCount) return false;

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
          }, 2000);

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
    if (adContainers.length === 0) {
      Logger.warn(`未找到匹配选择器"${CONFIG.containerSelector}"的广告容器`);
      return;
    }

    let refreshedCount = 0;
    let visibleNotRefreshed = false;
    let refreshDetails = [];

    adContainers.forEach((container) => {
      // 检查是否在视口中足够可见
      const isVisible = isElementVisibleEnough(container);
      
      // 更新容器可见状态
      container.dataset.wasVisible = isVisible.toString();
      
      // 如果广告在视口中可见但还未达到最大刷新次数（或无限制）
      const refreshCount = parseInt(container.dataset.refreshCount || "0", 10);
      if (isVisible && (CONFIG.maxRefreshCount === -1 || refreshCount < CONFIG.maxRefreshCount)) {
        if (canRefreshAd(container)) {
          if (refreshAdContainer(container)) {
            refreshedCount++;
            // 记录刷新详情
            const currentCount = parseInt(container.dataset.refreshCount || "0", 10);
            const remainingCount = CONFIG.maxRefreshCount === -1 ? "无限" : (CONFIG.maxRefreshCount - currentCount);
            const adSlot = container.querySelector("ins.adsbygoogle")?.getAttribute("data-ad-slot") || "";
            const containerId = container.id || (adSlot ? `广告槽${adSlot}` : `广告${refreshedCount}`);
            refreshDetails.push(`${containerId}(第${currentCount}次，剩余${remainingCount}次)`);
          }
        } else {
          // 记录有可见但未刷新的广告
          visibleNotRefreshed = true;
        }
      }
    });

    if (refreshedCount > 0) {
      Logger.info(`成功刷新 ${refreshedCount} 个广告容器: ${refreshDetails.join(", ")}`);
    } else {
      Logger.warn("本轮没有广告容器需要刷新");
    }

    scheduleNextRefresh(!!visibleNotRefreshed);

    if (!visibleNotRefreshed) {
      checkVisibleAdsAndSchedule();
    }
  }

  // 页面可见性变化处理
  function handleVisibilityChange() {
    if (document.hidden) {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
        
        // 计算并记录当前计时器的剩余时间
        const nextRefreshTime = parseInt(window._nextRefreshTime || "0", 10);
        remainingTime = nextRefreshTime ? Math.max(0, nextRefreshTime - Date.now()) : 0;
        
        Logger.info("页面不可见，暂停广告刷新计时");
      }
    } else {
      if (!refreshTimeout && isInitialized) {
        Logger.info("页面重新可见，恢复广告刷新计时");
        scheduleNextRefresh();
      }
    }
  }

  // 安排下一次刷新
  function scheduleNextRefresh(forceSchedule) {
    if (refreshTimeout) clearTimeout(refreshTimeout);

    // 检查是否有可刷新的广告容器（考虑视口可见性）
    const adContainers = document.querySelectorAll(CONFIG.containerSelector);
    const visibleContainers = Array.from(adContainers).filter(container => {
      const isVisible = container.dataset.wasVisible === "true";
      const refreshCount = parseInt(container.dataset.refreshCount || "0", 10);
      return isVisible && (CONFIG.maxRefreshCount === -1 || refreshCount < CONFIG.maxRefreshCount);
    });
    
    // 如果没有可见的广告单元且不是强制调度，则不安排刷新
    if (visibleContainers.length === 0 && !forceSchedule) {
      Logger.info("没有可刷新的广告容器在视口中，暂停刷新");
      return;
    }

    // 使用剩余时间或计算新的随机间隔
    let interval = remainingTime > 0 ? remainingTime : (
      Math.floor(
        Math.random() *
          (CONFIG.maxRefreshInterval - CONFIG.minRefreshInterval + 1)
      ) + CONFIG.minRefreshInterval
    );
    
    remainingTime = 0;
    
    // 记录下次刷新的时间点，用于计算剩余时间
    window._nextRefreshTime = Date.now() + interval;

    refreshTimeout = setTimeout(refreshAds, interval);
    
    // 计算下次刷新的具体时间
    const nextRefreshTime = new Date(window._nextRefreshTime);
    const formattedTime = nextRefreshTime.toLocaleTimeString();
    
    Logger.info(`下一次广告刷新将在 ${Math.round(interval / 1000)} 秒后 (${formattedTime})`);
  }

  // 初始化刷新逻辑
  function initAdRefresh() {
    if (isInitialized) return;

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // 初始化广告容器观察者
    if ('IntersectionObserver' in window) {
      initAdObservers();
      
      // 监听DOM变化，处理动态添加的广告容器
      const mutationObserver = new MutationObserver((mutations) => {
        let needsCheck = false;
        
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            needsCheck = true;
          }
        });
        
        if (needsCheck) {
          // 检查新添加的广告容器
          const adContainers = document.querySelectorAll(CONFIG.containerSelector);
          adContainers.forEach(container => {
            if (!observers.has(container)) {
              observeAdVisibility(container);
            }
          });
        }
      });
      
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

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

  // 初始化广告刷新逻辑
  function waitForUserInteraction() {
    if (!CONFIG.requireUserInteraction) {
      // 无需用户交互，直接使用配置的延迟初始化
      Logger.info(`无需用户交互，将在 ${Math.round(CONFIG.initializationDelay / 1000)} 秒后初始化广告刷新逻辑`);
      setTimeout(() => {
        initAdRefresh();
      }, CONFIG.initializationDelay);
      return;
    }
    
    // 需要用户交互，监听滚动和点击事件
    function onInteractOnce() {
      window.removeEventListener("scroll", onInteractOnce);
      window.removeEventListener("click", onInteractOnce);
      Logger.info("检测到用户交互，初始化广告刷新逻辑");
      initAdRefresh();
    }

    window.addEventListener("scroll", onInteractOnce, { once: true });
    window.addEventListener("click", onInteractOnce, { once: true });
  }

  // 根据页面加载状态启动监听
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForUserInteraction);
  } else {
    waitForUserInteraction();
  }

  // 添加页面卸载事件处理
  window.addEventListener('beforeunload', () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    
    // 清理所有观察者
    observers.forEach(observer => {
      observer.disconnect();
    });
    observers.clear();
  });
})();
