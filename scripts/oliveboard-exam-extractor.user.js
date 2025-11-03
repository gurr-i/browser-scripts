// ==UserScript==
// @name         Oliveboard Exam Data Extractor
// @namespace    vite-plugin-monkey
// @version      1.3.1
// @author       Gurveer
// @description  Extract exam questions, answers, and solutions in JSON format
// @icon         https://u1.oliveboard.in/exams/solution/img/iefav.ico
// @match        https://*.u1.oliveboard.in/*
// @grant        GM.getValue
// @grant        GM.setClipboard
// @grant        GM.setValue
// ==/UserScript==

(function () {
  'use strict';

  (function() {
    console.log("Oliveboard Exam Data Extractor loaded");
    const DECRYPTION_TIMEOUT = 1e3;
    const DECRYPTION_CHECK_INTERVAL = 200;
    const NEXT_QUESTION_DELAY = 800;
    let allQuestionsData = [];
    let isAutoExtracting = false;
    function checkEncryption(text) {
      if (!text || text.length < 50) return false;
      return /^[A-Za-z0-9+/=]{50,}/.test(text.replace(/\s/g, ""));
    }
    function checkImages(html) {
      return html && (html.includes("<img") || html.includes("src="));
    }
    function extractCurrentQuestionData() {
      try {
        const questionData = {
          questionNumber: null,
          questionId: "",
          uniqueQuestionId: "",
          questionVariant: "",
          section: "",
          sectionName: "",
          sectionShortName: "",
          questionType: "",
          questionText: "",
          questionHTML: "",
          passageText: "",
          passageHTML: "",
          options: [],
          correctAnswer: "",
          solution: "",
          solutionHTML: "",
          timeTaken: "",
          correctPercentage: "",
          difficulty: "",
          userStatus: "",
          userTime: "",
          topperStatus: "",
          topperTime: "",
          isEncrypted: false,
          hasImages: false,
          language: "English"
        };
        const currentQnoElement = document.querySelector(".updateqno.cblue");
        if (currentQnoElement) {
          questionData.questionNumber = parseInt(currentQnoElement.textContent.trim());
        }
        const allBlocks = document.querySelectorAll(".qosblock.singleqid, .qosblock.paneqid");
        let visibleBlock = null;
        for (let block of allBlocks) {
          const style = window.getComputedStyle(block);
          if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
            visibleBlock = block;
            break;
          }
        }
        if (!visibleBlock) {
          console.log("No visible question block found");
          return null;
        }
        questionData.questionId = visibleBlock.id;
        console.log("Found visible block:", visibleBlock.id);
        const isParagraphQuestion = visibleBlock.classList.contains("paneqid");
        questionData.questionType = isParagraphQuestion ? "paragraph" : "single";
        let questionElement;
        if (isParagraphQuestion) {
          const passageElement = visibleBlock.querySelector(".paneqcol.panetxt");
          const specificQuestionElement = visibleBlock.querySelector("#panecol-question .qblock");
          if (passageElement && specificQuestionElement) {
            questionData.passageText = passageElement.textContent.trim();
            questionData.passageHTML = passageElement.innerHTML.trim();
            const specificQuestionText = specificQuestionElement.textContent.trim();
            const specificQuestionHTML = specificQuestionElement.innerHTML.trim();
            questionData.questionText = specificQuestionText;
            questionData.questionHTML = specificQuestionHTML;
            questionData.isEncrypted = checkEncryption(questionData.passageHTML) || checkEncryption(questionData.questionHTML);
            questionData.hasImages = checkImages(questionData.passageHTML) || checkImages(questionData.questionHTML);
            console.log("Paragraph question text:", questionData.questionText.substring(0, 100));
          }
        } else {
          questionElement = visibleBlock.querySelector(".qblock .eqt");
          if (questionElement) {
            questionData.questionText = questionElement.textContent.trim();
            questionData.questionHTML = questionElement.innerHTML.trim();
            questionData.isEncrypted = false;
            console.log("Question text:", questionData.questionText.substring(0, 100));
          } else {
            const qblockElement = visibleBlock.querySelector(".qblock");
            if (qblockElement) {
              questionData.questionText = qblockElement.textContent.trim();
              questionData.questionHTML = qblockElement.innerHTML.trim();
              questionData.isEncrypted = checkEncryption(questionData.questionHTML);
              console.log("Question text (direct):", questionData.questionText.substring(0, 100));
            }
          }
          questionData.hasImages = checkImages(questionData.questionHTML);
        }
        const idParts = visibleBlock.id.split("-");
        if (idParts.length >= 4) {
          const qIndex = parseInt(idParts[1]);
          questionData.uniqueQuestionId = idParts[2];
          questionData.questionVariant = idParts[3];
          if (qIndex < 30) {
            questionData.section = 0;
            questionData.sectionName = "Mathematical Abilities";
            questionData.sectionShortName = "MA";
          } else if (qIndex < 60) {
            questionData.section = 1;
            questionData.sectionName = "Reasoning and General Intelligence";
            questionData.sectionShortName = "LR";
          } else if (qIndex < 105) {
            questionData.section = 2;
            questionData.sectionName = "English";
            questionData.sectionShortName = "EL";
          } else if (qIndex < 130) {
            questionData.section = 3;
            questionData.sectionName = "General Awareness";
            questionData.sectionShortName = "GA";
          } else {
            questionData.section = 4;
            questionData.sectionName = "Computer Knowledge";
            questionData.sectionShortName = "CK";
          }
        }
        const optionElements = visibleBlock.querySelectorAll(".qoptions .opt");
        console.log("Found options:", optionElements.length);
        optionElements.forEach((opt) => {
          var _a;
          const label = (_a = opt.querySelector(".left")) == null ? void 0 : _a.textContent.trim();
          const isCorrect = opt.classList.contains("correct");
          let optText = opt.querySelector(".rightopt .eqt");
          let text = "";
          let html = "";
          if (optText) {
            text = optText.textContent.trim();
            html = optText.innerHTML.trim();
          } else {
            const rightopt = opt.querySelector(".rightopt");
            if (rightopt) {
              text = rightopt.textContent.trim();
              html = rightopt.innerHTML.trim();
            }
          }
          const optionData = {
            label,
            text,
            html,
            isCorrect
          };
          questionData.options.push(optionData);
          if (isCorrect) {
            questionData.correctAnswer = label;
          }
        });
        const solutionElement = visibleBlock.querySelector(".solutiontxt");
        if (solutionElement) {
          questionData.solution = solutionElement.textContent.trim();
          questionData.solutionHTML = solutionElement.innerHTML.trim();
          console.log("Solution text:", questionData.solution.substring(0, 100));
        }
        if (typeof timeacc !== "undefined" && questionData.questionNumber) {
          const timeAccData = timeacc[questionData.questionNumber];
          if (timeAccData && Array.isArray(timeAccData) && timeAccData.length >= 2) {
            questionData.timeTaken = timeAccData[0];
            questionData.correctPercentage = timeAccData[1];
          }
        }
        const timeElement = document.querySelector("#qttaken");
        const accElement = document.querySelector("#qacc");
        if (timeElement && !questionData.timeTaken) {
          questionData.timeTaken = timeElement.textContent.trim();
        }
        if (accElement && !questionData.correctPercentage) {
          questionData.correctPercentage = accElement.textContent.trim();
        }
        const statusRows = visibleBlock.querySelectorAll(".toppervsyou tbody tr");
        statusRows.forEach((row) => {
          var _a, _b, _c;
          const label = (_a = row.querySelector("td:first-child")) == null ? void 0 : _a.textContent.trim();
          const status = (_b = row.querySelector("td:nth-child(2)")) == null ? void 0 : _b.textContent.trim();
          const time = (_c = row.querySelector("td:nth-child(3)")) == null ? void 0 : _c.textContent.trim();
          if (label === "You") {
            questionData.userStatus = status;
            questionData.userTime = time;
          } else if (label === "Topper") {
            questionData.topperStatus = status;
            questionData.topperTime = time;
          }
        });
        console.log(`Extracted question ${questionData.questionNumber}:`, questionData);
        return questionData;
      } catch (error) {
        console.error("Error extracting question data:", error);
        return null;
      }
    }
    function isContentEncrypted(text) {
      if (!text || text.length === 0) return true;
      if (text.includes("==") && text.length > 100 && !/\s/.test(text.substring(0, 50))) {
        return true;
      }
      const alphanumericRatio = (text.match(/[a-zA-Z0-9]/g) || []).length / text.length;
      if (alphanumericRatio > 0.95 && text.length > 50) {
        return true;
      }
      return false;
    }
    function waitForQuestionDecryption(timeout = 1e4) {
      return new Promise((resolve) => {
        const startTime = Date.now();
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          const questionElement = document.querySelector(".qblock .eqt");
          const solutionElement = document.querySelector(".solutiontxt");
          if (questionElement && solutionElement) {
            const questionText = questionElement.textContent.trim();
            const solutionText = solutionElement.textContent.trim();
            const solutionHTML = solutionElement.innerHTML.trim();
            const questionDecrypted = !isContentEncrypted(questionText) && questionText.length > 10;
            const solutionDecrypted = !isContentEncrypted(solutionText) && !isContentEncrypted(solutionHTML) && solutionText.length > 10;
            console.log(`Attempt ${attempts}: Question decrypted: ${questionDecrypted}, Solution decrypted: ${solutionDecrypted}`);
            if (questionDecrypted && solutionDecrypted) {
              clearInterval(checkInterval);
              console.log("Question fully decrypted and loaded");
              resolve(true);
              return;
            }
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            console.log("Question load/decryption timeout");
            resolve(false);
          }
        }, DECRYPTION_CHECK_INTERVAL);
      });
    }
    async function saveCurrentQuestion(statusElement) {
      const questionData = extractCurrentQuestionData();
      if (!questionData) {
        statusElement.textContent = "❌ Failed to extract";
        statusElement.style.color = "#fff";
        statusElement.style.textShadow = "0 2px 4px rgba(244, 92, 67, 0.8)";
        return false;
      }
      const existingIndex = allQuestionsData.findIndex((q) => q.questionNumber === questionData.questionNumber);
      if (existingIndex !== -1) {
        allQuestionsData[existingIndex] = questionData;
        statusElement.textContent = `✅ Updated Q${questionData.questionNumber} (${allQuestionsData.length} total)`;
      } else {
        allQuestionsData.push(questionData);
        statusElement.textContent = `✅ Saved Q${questionData.questionNumber} (${allQuestionsData.length} total)`;
      }
      statusElement.style.color = "#fff";
      statusElement.style.textShadow = "0 2px 4px rgba(0, 0, 0, 0.3)";
      await GM.setValue("saved_questions", JSON.stringify(allQuestionsData));
      console.log(`Saved question ${questionData.questionNumber}. Total: ${allQuestionsData.length}`);
      return true;
    }
    async function downloadAllQuestions(button) {
      var _a, _b, _c, _d, _e, _f, _g;
      if (allQuestionsData.length === 0) {
        button.textContent = "❌ No data saved";
        button.style.background = "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)";
        setTimeout(() => {
          button.textContent = "� Downlload All";
          button.style.background = "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
        }, 2e3);
        return;
      }
      try {
        allQuestionsData.sort((a2, b) => a2.questionNumber - b.questionNumber);
        const examStats = {
          totalTime: ((_a = document.querySelector(".ttaken")) == null ? void 0 : _a.textContent.trim()) || "",
          accuracy: ((_b = document.querySelector(".acc")) == null ? void 0 : _b.textContent.trim()) || "",
          totalScore: ((_d = (_c = document.querySelector(".tscr")) == null ? void 0 : _c.parentElement.querySelector("h3")) == null ? void 0 : _d.textContent.trim()) || "",
          rightAnswers: ((_e = document.querySelector("#stic-answered")) == null ? void 0 : _e.textContent.trim()) || "",
          wrongAnswers: ((_f = document.querySelector("#stic-notanswered")) == null ? void 0 : _f.textContent.trim()) || "",
          unattempted: ((_g = document.querySelector("#stic-notvisited")) == null ? void 0 : _g.textContent.trim()) || ""
        };
        const examNameElement = document.querySelector(".header-col.text-center h3");
        const examName = examNameElement ? examNameElement.textContent.trim() : document.title;
        const examData = {
          metadata: {
            examName,
            totalQuestions: allQuestionsData.length,
            extractedAt: (/* @__PURE__ */ new Date()).toISOString(),
            url: window.location.href,
            stats: examStats
          },
          questions: allQuestionsData
        };
        const jsonString = JSON.stringify(examData, null, 2);
        await GM.setClipboard(jsonString);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `oliveboard_exam_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        button.textContent = `✅ Downloaded ${allQuestionsData.length} questions!`;
        button.style.background = "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
        setTimeout(() => {
          button.textContent = `� Download AAll (${allQuestionsData.length})`;
          button.style.background = "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
        }, 2e3);
      } catch (error) {
        console.error("Error downloading data:", error);
        button.textContent = "❌ Error";
        button.style.background = "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)";
        setTimeout(() => {
          button.textContent = `�  Download All (${allQuestionsData.length})`;
          button.style.background = "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
        }, 2e3);
      }
    }
    async function clearAllData(button, statusElement) {
      if (confirm(`Are you sure you want to clear all ${allQuestionsData.length} saved questions?`)) {
        allQuestionsData = [];
        await GM.setValue("saved_questions", JSON.stringify([]));
        statusElement.textContent = "🗑️ Cleared all data";
        statusElement.style.color = "#f45c43";
        button.textContent = "� Downlload All (0)";
        setTimeout(() => {
          statusElement.textContent = "Ready to extract";
          statusElement.style.color = "#667eea";
        }, 2e3);
      }
    }
    function clickNextButton() {
      const nextButton = document.querySelector('.btn-prenext[onclick*="nextQuestion"]');
      if (nextButton) {
        nextButton.click();
        return true;
      }
      return false;
    }
    function getTotalQuestions() {
      const allQuestionButtons = document.querySelectorAll(".map-qno");
      return allQuestionButtons.length;
    }
    async function startAutoExtraction(statusElement, autoButton, downloadButton) {
      if (isAutoExtracting) {
        return;
      }
      isAutoExtracting = true;
      autoButton.textContent = "⏸️ Stop Auto Extract";
      autoButton.style.background = "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)";
      const totalQuestions = getTotalQuestions();
      console.log(`Starting auto-extraction for ${totalQuestions} questions`);
      let currentIndex = 0;
      const processNextQuestion = async () => {
        if (!isAutoExtracting) {
          console.log("Auto-extraction stopped by user");
          return;
        }
        await waitForQuestionDecryption(DECRYPTION_TIMEOUT);
        const saved = await saveCurrentQuestion(statusElement);
        if (saved) {
          currentIndex++;
          downloadButton.textContent = `💾 Download All (${allQuestionsData.length})`;
          if (currentIndex >= totalQuestions) {
            console.log("Auto-extraction completed!");
            stopAutoExtraction(statusElement, autoButton);
            statusElement.textContent = `✅ Completed! ${allQuestionsData.length} questions saved`;
            statusElement.style.color = "#fff";
            statusElement.style.textShadow = "0 2px 4px rgba(56, 239, 125, 0.8)";
            return;
          }
          statusElement.textContent = `🔄 Auto-extracting... (${currentIndex}/${totalQuestions})`;
          statusElement.style.color = "#fff";
          statusElement.style.textShadow = "0 2px 4px rgba(102, 126, 234, 0.8)";
          const clicked = clickNextButton();
          if (!clicked) {
            console.log("Next button not found, stopping auto-extraction");
            stopAutoExtraction(statusElement, autoButton);
            statusElement.textContent = `⚠️ Stopped at Q${currentIndex}`;
            statusElement.style.color = "#fff";
            statusElement.style.textShadow = "0 2px 4px rgba(244, 92, 67, 0.8)";
            return;
          }
          setTimeout(processNextQuestion, NEXT_QUESTION_DELAY);
        } else {
          console.log("Failed to save question, stopping auto-extraction");
          stopAutoExtraction(statusElement, autoButton);
        }
      };
      processNextQuestion();
    }
    function stopAutoExtraction(statusElement, autoButton) {
      isAutoExtracting = false;
      autoButton.textContent = "🤖 Auto Extract All";
      autoButton.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      console.log("Auto-extraction stopped");
    }
    async function createControlPanel() {
      if (document.getElementById("exam-extractor-panel")) {
        console.log("Extractor panel already exists");
        return;
      }
      const savedData = await GM.getValue("saved_questions", "[]");
      try {
        allQuestionsData = JSON.parse(savedData);
        console.log(`Loaded ${allQuestionsData.length} previously saved questions`);
      } catch (e) {
        console.error("Error loading saved data:", e);
        allQuestionsData = [];
      }
      const isCollapsed = await GM.getValue("panel_collapsed", false);
      const panel = document.createElement("div");
      panel.id = "exam-extractor-panel";
      panel.style.cssText = `
position: fixed;
top: 10px;
right: 10px;
z-index: 10000;
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.3);
border-radius: 16px;
padding: 15px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
min-width: 250px;
`;
      const header = document.createElement("div");
      header.style.cssText = `
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 12px;
cursor: move;
user-select: none;
`;
      const title = document.createElement("div");
      title.textContent = "👽 Olive Mock Extractor";
      title.style.cssText = `
font-size: 16px;
font-weight: 700;
color: #000000a8;
text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
flex: 1;
text-align: center;
pointer-events: none;
`;
      const collapseBtn = document.createElement("div");
      collapseBtn.textContent = isCollapsed ? "▼" : "▲";
      collapseBtn.style.cssText = `
font-size: 12px;
color: #fff;
text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
cursor: pointer;
padding: 4px;
transition: transform 0.3s ease;
pointer-events: auto;
`;
      header.appendChild(title);
      header.appendChild(collapseBtn);
      panel.appendChild(header);
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let offsetX = 0;
      let offsetY = 0;
      const savedPosition = await GM.getValue("panel_position", null);
      if (savedPosition) {
        try {
          const pos = JSON.parse(savedPosition);
          if (pos.top) panel.style.top = pos.top;
          if (pos.left) panel.style.left = pos.left;
          if (pos.top || pos.left) {
            panel.style.right = "auto";
            panel.style.bottom = "auto";
          }
        } catch (e) {
          console.error("Error loading panel position:", e);
        }
      }
      const dragStart = (e) => {
        if (e.target === collapseBtn) {
          return;
        }
        if (e.target === header || e.target === title) {
          isDragging = true;
          panel.style.transition = "none";
          const rect = panel.getBoundingClientRect();
          if (e.type === "touchstart") {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
          } else {
            startX = e.clientX;
            startY = e.clientY;
          }
          offsetX = rect.left;
          offsetY = rect.top;
        }
      };
      const dragEnd = async (e) => {
        if (isDragging) {
          isDragging = false;
          panel.style.transition = "";
          const position = {
            top: panel.style.top,
            left: panel.style.left
          };
          await GM.setValue("panel_position", JSON.stringify(position));
        }
      };
      const drag = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        let clientX, clientY;
        if (e.type === "touchmove") {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        let newLeft = offsetX + deltaX;
        let newTop = offsetY + deltaY;
        const rect = panel.getBoundingClientRect();
        newLeft = Math.max(0, Math.min(window.innerWidth - rect.width, newLeft));
        newTop = Math.max(0, Math.min(window.innerHeight - rect.height, newTop));
        panel.style.left = `${newLeft}px`;
        panel.style.top = `${newTop}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      };
      header.addEventListener("mousedown", dragStart);
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", dragEnd);
      header.addEventListener("touchstart", dragStart, { passive: false });
      document.addEventListener("touchmove", drag, { passive: false });
      document.addEventListener("touchend", dragEnd);
      const content = document.createElement("div");
      content.id = "extractor-content";
      content.style.cssText = `
display: ${isCollapsed ? "none" : "block"};
transition: all 0.3s ease;
`;
      const statusElement = document.createElement("div");
      statusElement.id = "extractor-status";
      statusElement.textContent = allQuestionsData.length > 0 ? `${allQuestionsData.length} questions saved` : "Ready to extract";
      statusElement.style.cssText = `
font-size: 13px;
color: #000000ad;
text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
margin-bottom: 12px;
text-align: center;
font-weight: 500;
`;
      content.appendChild(statusElement);
      const autoButton = document.createElement("button");
      autoButton.textContent = "🤖 Auto Extract All";
      autoButton.style.cssText = `
width: 100%;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
border: none;
padding: 10px 15px;
border-radius: 8px;
font-size: 13px;
font-weight: 600;
cursor: pointer;
margin-bottom: 8px;
transition: all 0.3s ease;
`;
      autoButton.onmouseover = () => {
        if (!isAutoExtracting) {
          autoButton.style.transform = "translateY(-2px)";
          autoButton.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
        }
      };
      autoButton.onmouseout = () => {
        autoButton.style.transform = "translateY(0)";
        autoButton.style.boxShadow = "none";
      };
      autoButton.onclick = async () => {
        if (isAutoExtracting) {
          stopAutoExtraction(statusElement, autoButton);
        } else {
          await startAutoExtraction(statusElement, autoButton, downloadButton);
        }
      };
      content.appendChild(autoButton);
      const saveButton = document.createElement("button");
      saveButton.textContent = "💾 Save Current Question";
      saveButton.style.cssText = `
width: 100%;
background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
color: white;
border: none;
padding: 10px 15px;
border-radius: 8px;
font-size: 13px;
font-weight: 600;
cursor: pointer;
margin-bottom: 8px;
transition: all 0.3s ease;
`;
      saveButton.onmouseover = () => {
        saveButton.style.transform = "translateY(-2px)";
        saveButton.style.boxShadow = "0 4px 12px rgba(17, 153, 142, 0.4)";
      };
      saveButton.onmouseout = () => {
        saveButton.style.transform = "translateY(0)";
        saveButton.style.boxShadow = "none";
      };
      saveButton.onclick = async () => {
        saveButton.disabled = true;
        await saveCurrentQuestion(statusElement);
        saveButton.disabled = false;
        downloadButton.textContent = `💾 Download All (${allQuestionsData.length})`;
      };
      content.appendChild(saveButton);
      const downloadButton = document.createElement("button");
      downloadButton.textContent = `� Downlload All (${allQuestionsData.length})`;
      downloadButton.style.cssText = `
width: 100%;
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
color: white;
border: none;
padding: 10px 15px;
border-radius: 8px;
font-size: 13px;
font-weight: 600;
cursor: pointer;
margin-bottom: 8px;
transition: all 0.3s ease;
`;
      downloadButton.onmouseover = () => {
        downloadButton.style.transform = "translateY(-2px)";
        downloadButton.style.boxShadow = "0 4px 12px rgba(240, 147, 251, 0.4)";
      };
      downloadButton.onmouseout = () => {
        downloadButton.style.transform = "translateY(0)";
        downloadButton.style.boxShadow = "none";
      };
      downloadButton.onclick = async () => {
        downloadButton.disabled = true;
        await downloadAllQuestions(downloadButton);
        downloadButton.disabled = false;
      };
      content.appendChild(downloadButton);
      const clearButton = document.createElement("button");
      clearButton.textContent = "🗑️ Clear All";
      clearButton.style.cssText = `
width: 100%;
background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
color: white;
border: none;
padding: 8px 15px;
border-radius: 8px;
font-size: 12px;
font-weight: 600;
cursor: pointer;
transition: all 0.3s ease;
`;
      clearButton.onmouseover = () => {
        clearButton.style.transform = "translateY(-2px)";
        clearButton.style.boxShadow = "0 4px 12px rgba(235, 51, 73, 0.4)";
      };
      clearButton.onmouseout = () => {
        clearButton.style.transform = "translateY(0)";
        clearButton.style.boxShadow = "none";
      };
      clearButton.onclick = async () => {
        await clearAllData(downloadButton, statusElement);
      };
      content.appendChild(clearButton);
      const footer = document.createElement("div");
      footer.style.cssText = `
font-size: 10px;
color: rgba(0, 0, 0, 0.7);
text-align: center;
margin-top: 12px;
padding-top: 8px;
border-top: 1px solid rgba(255, 255, 255, 0.2);
`;
      footer.innerHTML = "Gurveer © All rights reserved 2025.";
      content.appendChild(footer);
      panel.appendChild(content);
      collapseBtn.onclick = async (e) => {
        e.stopPropagation();
        const isCurrentlyCollapsed = content.style.display === "none";
        content.style.display = isCurrentlyCollapsed ? "block" : "none";
        collapseBtn.textContent = isCurrentlyCollapsed ? "▲" : "▼";
        await GM.setValue("panel_collapsed", !isCurrentlyCollapsed);
      };
      document.body.appendChild(panel);
      console.log("Extractor panel created");
    }
    function init() {
      console.log("Initializing exam data extractor...");
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createControlPanel);
      } else {
        setTimeout(createControlPanel, 1e3);
      }
      const observer = new MutationObserver(() => {
        if (!document.getElementById("exam-extractor-panel")) {
          createControlPanel();
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    init();
  })();

})();