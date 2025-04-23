// ==UserScript==
// @name               Auto Skip YouTube Ads @ Gurveer
// @name:ar            تخطي إعلانات YouTube تلقائيًا @ Gurveer
// @name:bg            Пропускане на YouTube-реклами
// @name:es            Saltar Automáticamente Anuncios De YouTube @ Gurveer
// @name:fr            Ignorer Automatiquement Les Publicités YouTube
// @name:hi            YouTube विज्ञापन स्वचालित रूप से छोड़ें
// @name:id            Lewati Otomatis Iklan YouTube
// @name:ja            YouTube 広告を自動スキップ
// @name:ko            YouTube 광고 자동 건너뛰기
// @name:nl            YouTube-Advertenties Automatisch Overslaan
// @name:pt-BR         Pular Automaticamente Anúncios Do YouTube
// @name:ru            Автоматический Пропуск Рекламы На YouTube
// @name:vi            Tự Động Bỏ Qua Quảng Cáo YouTube
// @name:zh-CN         自动跳过 YouTube 广告
// @name:zh-TW         自動跳過 YouTube 廣告
// @namespace          https://github.com/gurr-i/browser-scripts
// @version            8.0.1
// @description        Automatically skip YouTube ads instantly with minimal detection risk. Features configurable settings, update notifications, robust error handling, and fixes for mute state restoration.
// @description:ar     تخطي إعلانات YouTube تلقائيًا على الفور مع الحد الأدنى من مخاطر الكشف. يتضمن إعدادات قابلة للتخصيص، إشعارات التحديث، ومعالجة قوية للأخطاء، وإصلاحات لاستعادة حالة كتم الصوت.
// @description:es     Omite automáticamente los anuncios de YouTube al instante con un riesgo mínimo de detección. Incluye configuraciones personalizables, notificaciones de actualización, manejo robusto de errores y correcciones para la restauración del estado de silencio.
// @description:fr     Ignorez automatiquement et instantanément les publicités YouTube avec un risque minimal de détection. Comprend des paramètres configurables, des notifications de mise à jour, une gestion robuste des erreurs et des corrections pour la restauration de l'état muet.
// @description:hi     YouTube विज्ञापनों को तुरंत स्वचालित रूप से छोड़ दें, जिसमें न्यूनतम पता लगाने का जोखिम हो। इसमें कॉन्फ़िगर करने योग्य सेटिंग्स, अपडेट सूचनाएं, मजबूत त्रुटि हैंडलिंग और म्यूट स्थिति बहाली के लिए सुधार शामिल हैं।
// @description:id     Lewati iklan YouTube secara otomatis secara instan dengan risiko deteksi minimal. Termasuk pengaturan yang dapat dikonfigurasi, pemberitahuan pembaruan, penanganan kesalahan yang kuat, dan perbaikan untuk pemulihan status bisu.
// @description:ja     YouTube 広告を即座に自動的にスキップし、検出リスクを最小限に抑えます。カスタマイズ可能な設定、更新通知、堅牢なエラーハンドリング、ミュート状態の復元修正を備えています。
// @description:ko     YouTube 광고를 즉시 자동으로 건너뛰며 탐지 위험이 최소화됩니다。구성 가능한 설정, 업데이트 알림, 강력한 오류 처리 및 음소거 상태 복원 수정이 포함됩니다.
// @description:nl     Sla YouTube-advertenties direct automatisch over met minimaal detectierisico. Bevat configureerbare instellingen, updatemeldingen, robuuste foutafhandeling en fixes voor het herstellen van de mute-status.
// @description:pt-BR  Pule anúncios do YouTube instantaneamente com risco mínimo de detecção. Inclui configurações personalizáveis, notificações de atualização, tratamento robusto de erros e correções para restauração do estado de mudo.
// @description:ru     Автоматически пропускать рекламу YouTube мгновенно с минимальным риском обнаружения. Включает настраиваемые параметры, уведомления об обновлениях, надежную обработку ошибок и исправления для восстановления состояния звука.
// @description:vi     Tự động bỏ qua quảng cáo YouTube ngay lập tức với rủi ro phát hiện tối thiểu. Bao gồm cài đặt có thể tùy chỉnh, thông báo cập nhật, xử lý lỗi mạnh mẽ và sửa lỗi cho việc khôi phục trạng thái tắt tiếng.
// @description:zh-CN  立即自动跳过 YouTube 广告，检测风险最小。包括可配置设置、更新通知、强大的错误处理和修复静音状态恢复。
// @description:zh-TW  立即自動跳過 YouTube 廣告，偵測風險極低。包括可配置設定、更新通知、強大的錯誤處理和修復靜音狀態恢復。
// @author             Gurveer
// @icon               https://raw.githubusercontent.com/gurr-i/browser-scripts/main/assets/icons/youtube-ads-skipper.png
// @match              https://www.youtube.com/*
// @match              https://m.youtube.com/*
// @match              https://music.youtube.com/*
// @exclude            https://studio.youtube.com/*
// @grant              none
// @license            MIT
// @compatible         firefox
// @compatible         chrome
// @compatible         opera
// @compatible         safari
// @compatible         edge
// @noframes
// @homepage           https://github.com/gurr-i/browser-scripts/tree/main/scripts/Auto-Skip-YouTube-Ads
// ==/UserScript==

(function () {
    'use strict';
  
    // Configuration settings with UI controls and selectors
    const defaultConfig = {
      debug: false,
      updateCheckInterval: 24 * 60 * 60 * 1000,
      maxRetries: 3,
      retryDelay: 1000,
      randomizationDelay: 200,
      aggressiveAdRemoval: true,
      skipOverlayAds: true,
      skipVideoAds: true,
      muteAds: true,
      autoUpdateCheck: true,
      selectors: {
        adShowing: '.ad-showing, .ytp-ad-player-overlay',
        pieCountdown: '.ytp-ad-timed-pie-countdown-container, .ytp-ad-duration-remaining',
        surveyQuestions: '.ytp-ad-survey-questions, .ytp-ad-survey-interstitial',
        player: '#ytd-player, #movie_player',
        mobilePlayer: '#movie_player, #player-container-id',
        adVideo: '#ytd-player video.html5-main-video, #song-video video.html5-main-video, .video-stream.html5-main-video',
        skipButton: '.ytp-ad-skip-button, .ytp-ad-skip-button-modern',
        muteButton: '.ytp-mute-button',
        ads: [
          '#player-ads',
          '#panels > ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
          '#masthead-ad',
          '.yt-mealbar-promo-renderer',
          '.ytp-ad-overlay-container',
          '.ytp-ad-overlay-slot',
          '.ytp-ad-text-overlay',
          '.ytp-ad-preview-text-overlay',
          '.ytp-ad-preview-container',
          '.video-ads.ytp-ad-module',
          '.ytp-featured-product',
          'ytd-merch-shelf-renderer',
          'ytmusic-mealbar-promo-renderer',
          'ytmusic-statement-banner-renderer',
          '.ytd-promoted-sparkles-web-renderer',
          '.ytd-display-ad-renderer',
          '.ytd-statement-banner-renderer',
          '.ytd-in-feed-ad-layout-renderer',
        ],
        adElements: [
          ['ytd-reel-video-renderer', '.ytd-ad-slot-renderer'],
          ['tp-yt-paper-dialog', '#feedback.ytd-enforcement-message-view-model'],
          ['tp-yt-paper-dialog', ':scope > ytd-checkbox-survey-renderer'],
          ['tp-yt-paper-dialog', ':scope > ytd-single-option-survey-renderer'],
        ],
      },
      githubRepo: 'https://github.com/gurr-i/browser-scripts',
    };
  
    // Load saved configuration or use defaults
    const config = {
      ...defaultConfig,
      ...JSON.parse(localStorage.getItem('AutoSkipYouTubeAds_Config') || '{}'),
    };
  
    // UI Module for settings
    const settingsUI = {
      createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'auto-skip-settings';
        panel.style.cssText =
          'position:fixed;top:10px;right:10px;background:#fff;padding:10px;border-radius:5px;box-shadow:0 2px 10px rgba(0,0,0,0.1);z-index:9999;display:none;';
  
        const title = document.createElement('h3');
        title.textContent = 'Auto Skip Settings';
        title.style.margin = '0 0 10px';
        panel.appendChild(title);
  
        const settings = [
          { key: 'debug', label: 'Debug Mode', type: 'checkbox' },
          { key: 'skipOverlayAds', label: 'Skip Overlay Ads', type: 'checkbox' },
          { key: 'skipVideoAds', label: 'Skip Video Ads', type: 'checkbox' },
          { key: 'muteAds', label: 'Mute Ads', type: 'checkbox' },
          { key: 'aggressiveAdRemoval', label: 'Aggressive Ad Removal', type: 'checkbox' },
          { key: 'autoUpdateCheck', label: 'Auto Update Check', type: 'checkbox' },
        ];
  
        settings.forEach((setting) => {
          const container = document.createElement('div');
          container.style.marginBottom = '5px';
  
          const input = document.createElement('input');
          input.type = setting.type;
          input.id = `auto-skip-${setting.key}`;
          input.checked = config[setting.key];
          input.addEventListener('change', () => {
            config[setting.key] = input.checked;
            localStorage.setItem('AutoSkipYouTubeAds_Config', JSON.stringify(config));
          });
  
          const label = document.createElement('label');
          label.htmlFor = input.id;
          label.textContent = setting.label;
          label.style.marginLeft = '5px';
  
          container.appendChild(input);
          container.appendChild(label);
          panel.appendChild(container);
        });
  
        document.body.appendChild(panel);
        return panel;
      },
  
      init() {
        const panel = this.createSettingsPanel();
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = '⚙️';
        toggleBtn.style.cssText =
          'position:fixed;top:10px;right:10px;z-index:9999;background:none;border:none;font-size:20px;cursor:pointer;';
        toggleBtn.addEventListener('click', () => {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        document.body.appendChild(toggleBtn);
      },
    };
  
    // Environment detection
    const isYouTubeMobile = location.hostname === 'm.youtube.com';
    const isYouTubeMusic = location.hostname === 'music.youtube.com';
    const isYouTubeVideo = !isYouTubeMusic;
  
    // Utility module
    const utils = {
      log(...args) {
        if (config.debug) console.log('[AutoSkipYouTubeAds]', ...args);
      },
      getCurrentTimeString() {
        return new Date().toTimeString().split(' ', 1)[0];
      },
      checkIsYouTubeShorts() {
        return location.pathname.startsWith('/shorts/');
      },
      randomDelay(max = config.randomizationDelay) {
        return Math.random() * max;
      },
      async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      },
    };
  
    // Ad hiding module
    const adHider = {
      addCss() {
        const validSelectors = config.selectors.ads.filter((selector) =>
          /^[a-zA-Z0-9\-#.>[\]=:,\s]+$/.test(selector)
        );
        if (!validSelectors.length) return;
        const css = `${validSelectors.join(',')} { display: none !important; }`;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        utils.log('CSS styles applied for ad hiding');
      },
      removeAdElements() {
        try {
          if (!config.aggressiveAdRemoval) return;
          for (const [parentSelector, childSelector] of config.selectors.adElements) {
            const parent = document.querySelector(parentSelector);
            if (!parent) continue;
            const child = parent.querySelector(childSelector);
            if (!child) continue;
            parent.remove();
            utils.log(`Removed ad element: ${parentSelector} > ${childSelector}`);
          }
        } catch (error) {
          console.error('Error removing ad elements:', error);
        }
      },
    };
  
    // Ad skipping module with enhanced mute state handling
    const adSkipper = {
      wasVideoMuted: null, // Store original mute state (null if not set)
  
      async restoreMuteState(player) {
        try {
          if (this.wasVideoMuted === null) return; // No mute state to restore
          const isMuted = player.isMuted?.() ?? false;
          if (isMuted !== this.wasVideoMuted) {
            if (this.wasVideoMuted) {
              player.mute?.();
            } else {
              player.unMute?.();
            }
            utils.log(`Restored mute state to: ${this.wasVideoMuted ? 'muted' : 'unmuted'}`);
          }
        } catch (error) {
          console.error('Error restoring mute state:', error);
        }
      },
  
      async skipAd(retryCount = 0) {
        try {
          if (utils.checkIsYouTubeShorts()) return;
  
          const adShowing = document.querySelector(config.selectors.adShowing);
          const pieCountdown = document.querySelector(config.selectors.pieCountdown);
          const surveyQuestions = document.querySelector(config.selectors.surveyQuestions);
          const skipButton = document.querySelector(config.selectors.skipButton);
  
          const playerSelector = isYouTubeMobile || isYouTubeMusic ? config.selectors.mobilePlayer : config.selectors.player;
          const playerEl = document.querySelector(playerSelector);
          const player = isYouTubeMobile || isYouTubeMusic ? playerEl : playerEl?.getPlayer?.();
  
          if (!playerEl || !player) {
            utils.log({ message: 'Player not found', timeStamp: utils.getCurrentTimeString() });
            if (retryCount < config.maxRetries) {
              await utils.sleep(config.retryDelay);
              return this.skipAd(retryCount + 1);
            }
            return;
          }
  
          // Check if no ad is showing and restore mute state
          if (!adShowing && !pieCountdown && !surveyQuestions && !skipButton) {
            if (config.muteAds) {
              await this.restoreMuteState(player);
            }
            return;
          }
  
          // Try to click skip button first if available
          if (skipButton && config.skipVideoAds) {
            skipButton.click();
            utils.log({ message: 'Skip button clicked', timeStamp: utils.getCurrentTimeString() });
            // Schedule mute state restoration after skip
            if (config.muteAds) {
              await utils.sleep(500); // Wait for video to load
              await this.restoreMuteState(player);
            }
            return;
          }
  
          // Store original mute state before muting ads
          if (config.muteAds && this.wasVideoMuted === null) {
            this.wasVideoMuted = player.isMuted?.() ?? false;
            utils.log(`Stored original mute state: ${this.wasVideoMuted ? 'muted' : 'unmuted'}`);
          }
  
          // Mute ads if enabled
          if (config.muteAds && !player.isMuted?.()) {
            player.mute?.();
            utils.log('Ad muted');
          }
  
          let adVideo = null;
          if (!pieCountdown && !surveyQuestions) {
            adVideo = document.querySelector(config.selectors.adVideo);
            if (!adVideo || !adVideo.src || adVideo.paused || isNaN(adVideo.duration)) {
              utils.log('Invalid ad video state');
              return;
            }
            utils.log({ message: 'Ad video detected', timeStamp: utils.getCurrentTimeString() });
          }
  
          // Simulate user-like behavior with random delay
          await utils.sleep(utils.randomDelay());
  
          if (isYouTubeMusic && adVideo) {
            adVideo.currentTime = adVideo.duration;
            utils.log({
              message: 'Ad skipped (YouTube Music)',
              timeStamp: utils.getCurrentTimeString(),
              adShowing: !!adShowing,
              pieCountdown: !!pieCountdown,
              surveyQuestions: !!surveyQuestions,
            });
            // Schedule mute state restoration
            if (config.muteAds) {
              await utils.sleep(500); // Wait for video to load
              await this.restoreMuteState(player);
            }
          } else {
            const videoData = player.getVideoData?.() || {};
            const videoId = videoData.video_id;
            if (!videoId) {
              utils.log('Video ID not found');
              if (retryCount < config.maxRetries) {
                await utils.sleep(config.retryDelay);
                return this.skipAd(retryCount + 1);
              }
              return;
            }
            const start = Math.floor(player.getCurrentTime?.() || 0);
            const loadMethod = playerEl.loadVideoWithPlayerVars ? 'loadVideoWithPlayerVars' : 'loadVideoByPlayerVars';
            playerEl[loadMethod]?.({ videoId, start });
            utils.log({
              message: 'Ad skipped',
              videoId,
              start,
              title: videoData.title || 'Unknown',
              timeStamp: utils.getCurrentTimeString(),
              adShowing: !!adShowing,
              pieCountdown: !!pieCountdown,
              surveyQuestions: !!surveyQuestions,
            });
            // Schedule mute state restoration
            if (config.muteAds) {
              await utils.sleep(500); // Wait for video to load
              await this.restoreMuteState(player);
            }
          }
        } catch (error) {
          console.error('Error in skipAd:', error);
          if (retryCount < config.maxRetries) {
            await utils.sleep(config.retryDelay);
            return this.skipAd(retryCount + 1);
          }
        }
      },
  
      setupObserver() {
        const observer = new MutationObserver((mutations) => {
          if (
            mutations.some(
              (mutation) =>
                mutation.target.matches(config.selectors.adShowing) ||
                mutation.target.querySelector(config.selectors.adShowing)
            )
          ) {
            this.skipAd();
          }
        });
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ['class'],
          childList: true,
          subtree: true,
        });
        utils.log('MutationObserver initialized');
        return observer;
      },
    };
  
    // Update checker module
    const updater = {
      async checkForUpdates() {
        try {
          const lastCheck = localStorage.getItem('AutoSkipYouTubeAds_LastUpdateCheck');
          const now = Date.now();
          if (lastCheck && now - parseInt(lastCheck) < config.updateCheckInterval) return;
  
          const response = await fetch('https://api.github.com/repos/gurr-i/browser-scripts/releases/latest', {
            headers: { Accept: 'application/vnd.github.v3+json' },
          });
          const data = await response.json();
          if (data.tag_name && data.tag_name > '8.0.1') {
            const message = `Auto Skip YouTube Ads: New version ${data.tag_name} available! Update at ${config.githubRepo}`;
            console.warn(message);
            if (Notification.permission === 'granted') {
              new Notification(message);
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then((permission) => {
                if (permission === 'granted') new Notification(message);
              });
            }
          }
          localStorage.setItem('AutoSkipYouTubeAds_LastUpdateCheck', now.toString());
        } catch (error) {
          utils.log('Update check failed:', error);
        }
      },
    };
  
    // Initialize script
    function init() {
      settingsUI.init();
      adHider.addCss();
      if (isYouTubeVideo && config.aggressiveAdRemoval) {
        adHider.removeAdElements();
        adSkipper.setupObserver();
      }
      if (config.skipVideoAds || config.skipOverlayAds) {
        adSkipper.skipAd();
      }
      if (config.autoUpdateCheck) {
        updater.checkForUpdates();
      }
      utils.log('Auto Skip YouTube Ads initialized with settings:', config);
    }
  
    // Run initialization
    init();
  })();