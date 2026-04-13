// ==UserScript==
// @name         YouTube Ad Skipper @ Gurveer
// @namespace    https://github.com/gurveeer/browser-scripts/edit/master/scripts/Auto-Skip-YouTube-Ads.js
// @version      9.0.2
// @author       Gurveer (@Gurveer)
// @description  Instantly skips YouTube ads (skippable & non-skippable) and blocks ad elements. Features: customizable settings, statistics tracking, keyboard shortcuts. © 2025 Gurveer. All rights reserved.
// @license      All Rights Reserved
// @copyright    2025, Gurveer (@Gurveer)
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @match        https://music.youtube.com/*
// @exclude      https://studio.youtube.com/*
// @grant        none
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  (function() {
    function loadSettings() {
      try {
        const saved = localStorage.getItem("ytAdSkipperSettings");
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768 || "ontouchstart" in window;
    let videoPlayer;
    let originalVolume = 1;
    let originalMuted = false;
    let adStats = {
      blocked: 0,
      skipped: 0,
      sessionStart: Date.now(),
      timeSaved: 0
    };
    let lastAdSkipTime = 0;
    let adSkipCooldown = isMobile ? 3e3 : 2e3;
    const settings = {
      autoUnmute: true,
      speedUpAds: false,
      showStats: !isMobile,
      showNotifications: !isMobile,
      debugMode: false,
      ...loadSettings()
    };
    const adSelectors = [
      "#masthead-ad",
      "ytd-rich-item-renderer.style-scope.ytd-rich-grid-row #content:has(.ytd-display-ad-renderer)",
      ".video-ads.ytp-ad-module",
      "tp-yt-paper-dialog:has(yt-mealbar-promo-renderer)",
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
      "#related #player-ads",
      "#related ytd-ad-slot-renderer",
      "ytd-ad-slot-renderer",
      "ytd-in-feed-ad-layout-renderer",
      "yt-mealbar-promo-renderer",
      'ytd-popup-container:has(a[href="/premium"])',
      "ad-slot-renderer",
      "ytm-companion-ad-renderer",
      ".ytp-ad-overlay-container",
      ".ytp-ad-text-overlay"
    ];
    window.debugMode = settings.debugMode;
    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    function debugLog(message) {
      if (!window.debugMode) return;
      console.log(`[Ad Skipper] ${formatDate(/* @__PURE__ */ new Date())} - ${message}`);
    }
    function saveSettings() {
      try {
        localStorage.setItem("ytAdSkipperSettings", JSON.stringify(settings));
      } catch (e) {
        debugLog("Failed to save settings: " + e.message);
      }
    }
    function showNotification(message, duration = 3e3) {
      if (!settings.showNotifications) return;
      if (isMobile) return;
      if (!document.getElementById("michroma-font")) {
        const fontLink = document.createElement("link");
        fontLink.id = "michroma-font";
        fontLink.rel = "stylesheet";
        fontLink.href = "https://fonts.googleapis.com/css2?family=Michroma&display=swap";
        document.head.appendChild(fontLink);
      }
      const notification = document.createElement("div");
      notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: 'Michroma', sans-serif;
    font-size: 13px;
    z-index: 999998;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    backdrop-filter: blur(10px);
    animation: slideIn 0.3s ease-out;
  `;
      notification.textContent = message;
      const style = document.createElement("style");
      style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
      document.head.appendChild(style);
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.animation = "slideIn 0.3s ease-out reverse";
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }
    function saveVideoState() {
      if (videoPlayer && !videoPlayer.classList.contains("ad-showing")) {
        originalVolume = videoPlayer.volume;
        originalMuted = videoPlayer.muted;
        debugLog(`Saved video state: volume=${originalVolume}, muted=${originalMuted}`);
      }
    }
    function restoreVideoState() {
      if (videoPlayer && settings.autoUnmute) {
        videoPlayer.volume = originalVolume;
        videoPlayer.muted = originalMuted;
        debugLog("Restored video state");
      }
    }
    function makeDraggable(element) {
      if (isMobile) return;
      let isDragging = false;
      let currentX;
      let currentY;
      let initialX;
      let initialY;
      let xOffset = 0;
      let yOffset = 0;
      element.addEventListener("mousedown", dragStart);
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", dragEnd);
      function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === element || element.contains(e.target)) {
          isDragging = true;
          element.style.cursor = "grabbing";
        }
      }
      function drag(e) {
        if (isDragging) {
          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
          xOffset = currentX;
          yOffset = currentY;
          setTranslate(currentX, currentY, element);
        }
      }
      function dragEnd(e) {
        if (isDragging) {
          initialX = currentX;
          initialY = currentY;
          isDragging = false;
          element.style.cursor = "move";
        }
      }
      function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
      }
    }
    function updateStats() {
      if (!settings.showStats) return;
      if (isMobile) return;
      if (!document.getElementById("michroma-font")) {
        const fontLink = document.createElement("link");
        fontLink.id = "michroma-font";
        fontLink.rel = "stylesheet";
        fontLink.href = "https://fonts.googleapis.com/css2?family=Michroma&display=swap";
        document.head.appendChild(fontLink);
      }
      let statsDiv = document.getElementById("yt-ad-skipper-stats");
      if (!statsDiv) {
        statsDiv = document.createElement("div");
        statsDiv.id = "yt-ad-skipper-stats";
        statsDiv.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 80px;
      background: rgba(0, 0, 0, 0.41);
      color: #fff;
      padding: 12px 18px;
      padding-top: 8px;
      border-radius: 8px;
      font-family: 'Michroma', sans-serif;
      font-size: 11px;
      z-index: 999997;
      min-width: 160px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.39);
      backdrop-filter: blur(10px);
      cursor: move;
      user-select: none;
    `;
        document.body.appendChild(statsDiv);
        makeDraggable(statsDiv);
      }
      const sessionTime = Math.floor((Date.now() - adStats.sessionStart) / 6e4);
      statsDiv.textContent = "";
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "×";
      closeBtn.style.cssText = `
      position: absolute;
      top: 4px;
      right: 6px;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      line-height: 18px;
      text-align: center;
      opacity: 0.6;
      transition: opacity 0.2s ease;
      font-family: Arial, sans-serif;
    `;
      closeBtn.onmouseover = () => closeBtn.style.opacity = "1";
      closeBtn.onmouseout = () => closeBtn.style.opacity = "0.6";
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        settings.showStats = false;
        saveSettings();
        statsDiv.remove();
        showNotification("📊 Stats hidden (Ctrl+Shift+S to show)", 2e3);
      };
      const title = document.createElement("a");
      title.href = "https://github.com/gurveeer";
      title.target = "_blank";
      title.rel = "noopener noreferrer";
      title.style.cssText = "font-weight: bold; margin-bottom: 8px; font-size: 10px; letter-spacing: 0.5px; color: #fff; text-decoration: none; display: block; cursor: pointer; transition: opacity 0.2s ease;";
      title.textContent = "🛡️ Ad Skipper @Gurveer";
      title.onmouseover = () => title.style.opacity = "0.7";
      title.onmouseout = () => title.style.opacity = "1";
      const blocked = document.createElement("div");
      blocked.style.cssText = "margin: 4px 0; letter-spacing: 0.3px; font-size: 8px;";
      blocked.textContent = `Blocked: ${adStats.blocked}`;
      const skipped = document.createElement("div");
      skipped.style.cssText = "margin: 4px 0; letter-spacing: 0.3px; font-size: 8px;";
      skipped.textContent = `Skipped: ${adStats.skipped}`;
      const session = document.createElement("div");
      session.style.cssText = "margin: 4px 0; letter-spacing: 0.3px; font-size: 8px;";
      const timeSavedMin = Math.floor(adStats.timeSaved / 60);
      const timeSavedSec = adStats.timeSaved % 60;
      const timeSavedStr = timeSavedMin > 0 ? `${timeSavedMin}m ${timeSavedSec}s` : `${timeSavedSec}s`;
      session.textContent = `Session: ${sessionTime}m | Saved: ${timeSavedStr}`;
      statsDiv.appendChild(closeBtn);
      statsDiv.appendChild(title);
      statsDiv.appendChild(blocked);
      statsDiv.appendChild(skipped);
      statsDiv.appendChild(session);
    }
    function setExecutionFlag(flagId) {
      const style = document.createElement("style");
      style.id = flagId;
      (document.head || document.body).appendChild(style);
    }
    function getExecutionFlag(flagId) {
      return document.getElementById(flagId);
    }
    function hasExecutionFlag(flagId) {
      if (getExecutionFlag(flagId)) {
        return true;
      }
      setExecutionFlag(flagId);
      return false;
    }
    function createAdBlockStyle(flagId) {
      if (hasExecutionFlag(flagId)) {
        debugLog("Ad-blocking style already applied");
        return;
      }
      const style = document.createElement("style");
      (document.head || document.body).appendChild(style);
      style.appendChild(document.createTextNode(generateAdBlockCss(adSelectors)));
      const blockedAds = document.querySelectorAll(adSelectors.join(","));
      adStats.blocked = blockedAds.length;
      updateStats();
      debugLog("Ad-blocking style applied successfully");
    }
    function generateAdBlockCss(selectors) {
      return selectors.map((selector) => `${selector}{display:none!important}`).join(" ");
    }
    function simulateTouch() {
      try {
        const touch = new Touch({
          identifier: Date.now(),
          target: this,
          clientX: 12,
          clientY: 34,
          radiusX: 56,
          radiusY: 78,
          rotationAngle: 0,
          force: 1
        });
        const touchStart = new TouchEvent("touchstart", {
          bubbles: true,
          cancelable: true,
          view: window,
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch]
        });
        this.dispatchEvent(touchStart);
        const touchEnd = new TouchEvent("touchend", {
          bubbles: true,
          cancelable: true,
          view: window,
          touches: [],
          targetTouches: [],
          changedTouches: [touch]
        });
        this.dispatchEvent(touchEnd);
      } catch (e) {
        debugLog("Touch simulation failed: " + e.message);
      }
    }
    function fetchVideoElement() {
      videoPlayer = document.querySelector(".ad-showing video") || document.querySelector(".html5-main-video") || document.querySelector("video.video-stream") || document.querySelector("video");
      if (videoPlayer) {
        debugLog("Video element found: " + videoPlayer.className);
      } else {
        debugLog("No video element found");
      }
    }
    function resumePlayback() {
      if ((videoPlayer == null ? void 0 : videoPlayer.paused) && videoPlayer.currentTime < 1) {
        videoPlayer.play();
        debugLog("Resumed video playback");
      }
    }
    function clearOverlay() {
      const premiumPopups = [...document.querySelectorAll("ytd-popup-container")];
      const targetPopups = premiumPopups.filter((popup) => popup.querySelector('a[href="/premium"]'));
      if (targetPopups.length > 0) {
        targetPopups.forEach((popup) => popup.remove());
        debugLog("Removed ad blocker popup");
      }
      const backdrops = document.querySelectorAll("tp-yt-iron-overlay-backdrop");
      const targetBackdrop = Array.from(backdrops).find((backdrop) => backdrop.style.zIndex === "2201");
      if (targetBackdrop) {
        targetBackdrop.className = "";
        targetBackdrop.removeAttribute("opened");
        debugLog("Closed overlay backdrop");
      }
    }
    function bypassAd() {
      if (!videoPlayer) {
        debugLog("bypassAd: No video player");
        return;
      }
      const skipBtn = document.querySelector(".ytp-ad-skip-button") || document.querySelector(".ytp-skip-ad-button") || document.querySelector(".ytp-ad-skip-button-modern");
      const shortAd = document.querySelector(".video-ads.ytp-ad-module .ytp-ad-player-overlay") || document.querySelector(".ytp-ad-button-icon");
      const adShowing = videoPlayer.classList.contains("ad-showing");
      const adInterrupting = videoPlayer.classList.contains("ad-interrupting");
      const adPlaying = document.querySelector(".ad-showing");
      const isAdPlaying = skipBtn || shortAd || adShowing || adInterrupting || adPlaying;
      if (isAdPlaying) {
        const now = Date.now();
        if (now - lastAdSkipTime < adSkipCooldown) {
          return;
        }
        debugLog(`AD DETECTED! Skip: ${!!skipBtn}, Short: ${!!shortAd}, Showing: ${adShowing}, Interrupting: ${adInterrupting}, AdPlaying: ${!!adPlaying}`);
        if (!videoPlayer.dataset.adStateSaved) {
          saveVideoState();
          videoPlayer.dataset.adStateSaved = "true";
          debugLog("Saved video state");
        }
        if (!window.location.href.includes("https://m.youtube.com/")) {
          if (!videoPlayer.muted) {
            videoPlayer.muted = true;
            debugLog("Muted ad");
          }
        }
        if (settings.speedUpAds && videoPlayer.playbackRate < 16) {
          videoPlayer.playbackRate = 16;
          debugLog("Sped up ad to 16x");
        }
        if (skipBtn) {
          debugLog("Clicking skip button...");
          const adTimeRemaining = videoPlayer.duration - videoPlayer.currentTime;
          if (adTimeRemaining > 0 && !isNaN(adTimeRemaining)) {
            adStats.timeSaved += Math.floor(adTimeRemaining);
          }
          skipBtn.click();
          simulateTouch.call(skipBtn);
          adStats.skipped++;
          updateStats();
          showNotification("⚡ Ad skipped!", 2e3);
          debugLog("Clicked skip ad button");
          lastAdSkipTime = now;
          if (videoPlayer.duration && videoPlayer.duration > 0) {
            videoPlayer.currentTime = videoPlayer.duration - 0.1;
            debugLog("Force-ended skippable ad");
          }
        } else if (videoPlayer.duration && videoPlayer.duration > 0 && !isNaN(videoPlayer.duration)) {
          debugLog(`Forcing ad end: current=${videoPlayer.currentTime}, duration=${videoPlayer.duration}`);
          const adTimeRemaining = videoPlayer.duration - videoPlayer.currentTime;
          if (adTimeRemaining > 0 && !isNaN(adTimeRemaining)) {
            adStats.timeSaved += Math.floor(adTimeRemaining);
          }
          videoPlayer.currentTime = videoPlayer.duration - 0.1;
          adStats.skipped++;
          updateStats();
          showNotification("⚡ Ad skipped!", 2e3);
          debugLog("Force-ended non-skippable ad");
          lastAdSkipTime = now;
        }
      } else {
        if (videoPlayer.dataset.adStateSaved) {
          if (videoPlayer.playbackRate > 1) {
            videoPlayer.playbackRate = 1;
            debugLog("Restored playback rate");
          }
          restoreVideoState();
          delete videoPlayer.dataset.adStateSaved;
          debugLog("Restored video state - ad ended");
        }
      }
    }
    function checkAndSkipAds() {
      try {
        fetchVideoElement();
        clearOverlay();
        bypassAd();
        resumePlayback();
      } catch (error) {
        debugLog("Error in ad blocker: " + error.message);
      }
    }
    function blockPlayerAds(flagId) {
      if (hasExecutionFlag(flagId)) {
        debugLog("Player ad blocker already running");
        return;
      }
      const target = document.body;
      const config = { childList: true, subtree: true };
      const observer = new MutationObserver(checkAndSkipAds);
      observer.observe(target, config);
      debugLog("Player ad blocker started successfully");
      const checkInterval = isMobile ? 3e3 : 2e3;
      setInterval(checkAndSkipAds, checkInterval);
    }
    function createMobileSettingsButton() {
      if (!isMobile) return;
      const settingsBtn = document.createElement("button");
      settingsBtn.id = "yt-ad-skipper-mobile-btn";
      settingsBtn.innerHTML = "⚙️";
      settingsBtn.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      border: 2px solid rgba(255, 255, 255, 0.3);
      font-size: 20px;
      cursor: pointer;
      z-index: 999997;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;
      settingsBtn.onclick = () => {
        const panel = document.getElementById("yt-ad-skipper-settings");
        const backdrop = document.getElementById("yt-ad-skipper-backdrop");
        if (panel && backdrop) {
          panel.style.display = "block";
          backdrop.style.display = "block";
        }
      };
      settingsBtn.ontouchstart = () => {
        settingsBtn.style.transform = "scale(0.9)";
        settingsBtn.style.background = "rgba(255, 0, 0, 0.8)";
      };
      settingsBtn.ontouchend = () => {
        settingsBtn.style.transform = "scale(1)";
        settingsBtn.style.background = "rgba(0, 0, 0, 0.7)";
      };
      document.body.appendChild(settingsBtn);
      debugLog("Mobile settings button created");
    }
    function createSettingsPanel() {
      if (document.getElementById("yt-ad-skipper-backdrop")) return;
      if (!document.getElementById("michroma-font")) {
        const fontLink = document.createElement("link");
        fontLink.id = "michroma-font";
        fontLink.rel = "stylesheet";
        fontLink.href = "https://fonts.googleapis.com/css2?family=Michroma&display=swap";
        document.head.appendChild(fontLink);
      }
      const backdrop = document.createElement("div");
      backdrop.id = "yt-ad-skipper-backdrop";
      backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 999998;
    display: none;
    backdrop-filter: blur(5px);
  `;
      document.body.appendChild(backdrop);
      const panel = document.createElement("div");
      panel.id = "yt-ad-skipper-settings";
      panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    padding: 24px;
    border-radius: 12px;
    font-family: 'Michroma', sans-serif;
    z-index: 999999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    backdrop-filter: blur(10px);
    display: none;
    min-width: ${isMobile ? "280px" : "320px"};
    max-width: ${isMobile ? "90vw" : "420px"};
    max-height: ${isMobile ? "80vh" : "auto"};
    overflow-y: auto;
  `;
      const title = document.createElement("h3");
      title.style.cssText = "margin: 0 0 20px 0; font-size: 16px; letter-spacing: 1px; text-align: center;";
      title.textContent = "⚙️ Ad Skipper Settings";
      panel.appendChild(title);
      const options = [
        { id: "autoUnmute", label: "Auto-unmute after ads", checked: settings.autoUnmute },
        { id: "speedUpAds", label: "Speed up ads (16x)", checked: settings.speedUpAds },
        { id: "showStats", label: "Show statistics", checked: settings.showStats },
        { id: "showNotifications", label: "Show notifications", checked: settings.showNotifications },
        { id: "debugMode", label: "Debug mode", checked: settings.debugMode }
      ];
      options.forEach((opt) => {
        const label = document.createElement("label");
        label.style.cssText = `display: block; margin: ${isMobile ? "16px" : "12px"} 0; cursor: pointer; font-size: 11px; letter-spacing: 0.3px; padding: ${isMobile ? "8px" : "0"}; border-radius: 4px; transition: background 0.2s ease;`;
        if (isMobile) {
          label.ontouchstart = () => label.style.background = "rgba(255, 255, 255, 0.1)";
          label.ontouchend = () => label.style.background = "transparent";
        }
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = opt.id;
        checkbox.checked = opt.checked;
        checkbox.style.cssText = `margin-right: 8px; cursor: pointer; ${isMobile ? "width: 18px; height: 18px;" : ""}`;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + opt.label));
        panel.appendChild(label);
      });
      const saveBtn = document.createElement("button");
      saveBtn.id = "saveSettings";
      saveBtn.textContent = "Save Settings";
      saveBtn.style.cssText = `
    margin-top: 20px;
    padding: ${isMobile ? "14px 18px" : "10px 18px"};
    background: rgba(255, 0, 0, 0.8);
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'Michroma', sans-serif;
    font-size: ${isMobile ? "12px" : "11px"};
    letter-spacing: 0.5px;
    width: 100%;
    transition: background 0.3s ease;
    touch-action: manipulation;
  `;
      saveBtn.onmouseover = () => saveBtn.style.background = "rgba(255, 0, 0, 1)";
      saveBtn.onmouseout = () => saveBtn.style.background = "rgba(255, 0, 0, 0.8)";
      panel.appendChild(saveBtn);
      const closeBtn = document.createElement("button");
      closeBtn.id = "closeSettings";
      closeBtn.textContent = "Close";
      closeBtn.style.cssText = `
    margin-top: 10px;
    padding: ${isMobile ? "14px 18px" : "10px 18px"};
    background: rgba(96, 96, 96, 0.8);
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'Michroma', sans-serif;
    font-size: ${isMobile ? "12px" : "11px"};
    letter-spacing: 0.5px;
    width: 100%;
    transition: background 0.3s ease;
    touch-action: manipulation;
  `;
      closeBtn.onmouseover = () => closeBtn.style.background = "rgba(96, 96, 96, 1)";
      closeBtn.onmouseout = () => closeBtn.style.background = "rgba(96, 96, 96, 0.8)";
      panel.appendChild(closeBtn);
      document.body.appendChild(panel);
      const closePanel = () => {
        panel.style.display = "none";
        backdrop.style.display = "none";
      };
      saveBtn.addEventListener("click", () => {
        settings.autoUnmute = document.getElementById("autoUnmute").checked;
        settings.speedUpAds = document.getElementById("speedUpAds").checked;
        settings.showStats = document.getElementById("showStats").checked;
        settings.showNotifications = document.getElementById("showNotifications").checked;
        settings.debugMode = document.getElementById("debugMode").checked;
        window.debugMode = settings.debugMode;
        saveSettings();
        showNotification("✅ Settings saved!");
        closePanel();
        if (!settings.showStats) {
          const statsDiv = document.getElementById("yt-ad-skipper-stats");
          if (statsDiv) statsDiv.remove();
        } else {
          updateStats();
        }
      });
      closeBtn.addEventListener("click", closePanel);
      backdrop.addEventListener("click", closePanel);
    }
    function addKeyboardShortcuts() {
      document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === "A") {
          e.preventDefault();
          const panel = document.getElementById("yt-ad-skipper-settings");
          const backdrop = document.getElementById("yt-ad-skipper-backdrop");
          if (panel && backdrop) {
            const isVisible = panel.style.display !== "none";
            panel.style.display = isVisible ? "none" : "block";
            backdrop.style.display = isVisible ? "none" : "block";
          }
        }
        if (e.ctrlKey && e.shiftKey && e.key === "S") {
          e.preventDefault();
          settings.showStats = !settings.showStats;
          saveSettings();
          if (settings.showStats) {
            updateStats();
            showNotification("📊 Stats enabled");
          } else {
            const statsDiv = document.getElementById("yt-ad-skipper-stats");
            if (statsDiv) statsDiv.remove();
            showNotification("📊 Stats disabled");
          }
        }
      });
    }
    function resumeAndClear() {
      const video = document.querySelector("video.html5-main-video");
      if (video == null ? void 0 : video.paused) {
        video.play();
        debugLog("Resumed paused video");
      }
    }
    function clearPopup(node) {
      var _a, _b;
      try {
        const popup = (_a = node.querySelector) == null ? void 0 : _a.call(node, ".ytd-popup-container .ytd-enforcement-message-view-model");
        if (popup && popup.parentNode) {
          popup.parentNode.remove();
          debugLog("Removed popup element");
          const backdrops = document.getElementsByTagName("tp-yt-iron-overlay-backdrop");
          for (let i = backdrops.length - 1; i >= 0; i--) {
            backdrops[i].remove();
          }
          resumeAndClear();
        }
        if (((_b = node.tagName) == null ? void 0 : _b.toLowerCase()) === "tp-yt-iron-overlay-backdrop") {
          node.remove();
          debugLog("Removed backdrop element");
          resumeAndClear();
        }
      } catch (error) {
        debugLog("Error clearing popup: " + error.message);
      }
    }
    function start() {
      debugLog("========================================");
      debugLog("Initializing YouTube Ad Skipper v1.0.0");
      debugLog("Author: Gurveer (@Gurveer)");
      debugLog(`Device: ${isMobile ? "Mobile" : "Desktop"}`);
      debugLog("========================================");
      createAdBlockStyle("adBlockStyle");
      blockPlayerAds("playerAdBlock");
      createSettingsPanel();
      createMobileSettingsButton();
      addKeyboardShortcuts();
      updateStats();
      setTimeout(checkAndSkipAds, 1e3);
      const statsUpdateInterval = isMobile ? 1e4 : 5e3;
      setInterval(() => {
        if (settings.showStats && !isMobile) {
          const blockedAds = document.querySelectorAll(adSelectors.join(","));
          adStats.blocked = blockedAds.length;
          updateStats();
        }
      }, statsUpdateInterval);
      const popupObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            Array.from(mutation.addedNodes).filter((node) => node.nodeType === 1).forEach((node) => clearPopup(node));
          }
        });
      });
      if (document.body) {
        popupObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          popupObserver.observe(document.body, {
            childList: true,
            subtree: true
          });
        });
      }
      debugLog("YouTube Ad Skipper initialized successfully");
      debugLog("Press Ctrl+Shift+A to open settings");
      if (isMobile) {
        debugLog("Mobile optimizations enabled");
      } else {
        showNotification("🛡️ Ad Skipper Active", 3e3);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
      debugLog("YouTube ad skipper scheduled");
    } else {
      start();
    }
  })();

})();
