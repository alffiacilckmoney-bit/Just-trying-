// ==========================================
// STYLES INJECTION (ONCE FOR ZERO-REFLOW IMPACT)
// ==========================================
(function injectDynamicMechanicStyles() {
  if (typeof document === "undefined") return;
  const styleId = "alfiria-dynamic-mechanic-styles";
  if (document.getElementById(styleId)) return;

  const styleEl = document.createElement("style");
  styleEl.id = styleId;
  styleEl.textContent = `
    @keyframes fadeInStep {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
     .truth-anim-1 { opacity: 0; animation: fadeInStep 0.7s ease forwards 0.8s; }
    .truth-anim-2 { opacity: 0; animation: fadeInStep 0.7s ease forwards 2.6s; }
    .truth-anim-3 { opacity: 0; animation: fadeInStep 0.7s ease forwards 4.8s; }
    .verdict-anim-1 { opacity: 0; animation: fadeInStep 0.7s ease forwards 0.8s; }
    .verdict-anim-2 { opacity: 0; animation: fadeInStep 0.7s ease forwards 2.6s; }
    .verdict-anim-3 { opacity: 0; animation: fadeInStep 0.7s ease forwards 4.8s; }
 .btn-fade-in { animation: fadeInStep 0.5s ease forwards; }

    .who-flip-card { background-color: transparent; width: 100%; height: 220px; perspective: 1000px; margin: auto 0; }
    .who-flip-inner { position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
    .who-flip-inner.is-flipped { transform: rotateY(180deg); }
    .who-flip-front, .who-flip-back { position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 18px 14px; border-radius: 12px; box-sizing: border-box; background: rgba(255, 255, 255, 0.75); border: 1px solid rgba(130, 86, 102, 0.2); }
    .who-flip-back { transform: rotateY(180deg); background: rgba(255, 255, 255, 0.9); }
  `;
  document.head.appendChild(styleEl);
})();


// ==========================================
// 1. QUESTIONS DATABASE (DYNAMIC FETCH)
// ==========================================
// نترك الكائن فارغاً هنا حتى لا تنزل الأسئلة في متصفح الزائر نهائياً
let QUESTIONS_DATABASE = {};

// دالة التحقق وشاشة القفل
async function verifyUserAccess(userEmail) {
  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });

    const data = await res.json();

    if (data.success) {
      // استقبال الأسئلة من السيرفر بعد تأكيد الإيميل من Supabase
      QUESTIONS_DATABASE = data.questions;
      
      // إخفاء شاشة القفل وبدء اللعبة
      document.getElementById("lock-screen-modal").style.display = "none";
      initBlossomIsland();
    } else {
      // إظهار رسالة الخطأ ورابط Payhip للشراء
      const msg = document.getElementById("lock-screen-error");
      msg.innerHTML = `
        <p style="color:red;">${data.message}</p>
        <a href="${data.buyUrl}" target="_blank" class="stone-btn" style="text-decoration:none; display:inline-block; margin-top:10px;">
          اشترِ اللعبة الآن للوصول
        </a>
      `;
    }
  } catch (e) {
    console.error("Authentication Error:", e);
  }
}


const CARD_TAGS = {
  d2: ["cringe_teenage_phase"],
  d5: ["ego_humbling_moments"],
  d6: ["simple_comforts"],
  d7: ["simple_comforts"],
  d8: ["surprising_passions"],
  d9: ["surprising_passions"],
  d12: ["petty_judgments"],
  d13: ["petty_judgments"],
  d14: ["social_subtle_signs"],
  d15: ["childish_joy_habits"],
  d18: ["social_battery_drain"],
  d19: ["social_battery_drain"],
  d20: ["social_subtle_signs"],
  s2: ["embarrassing_impression_fails", "ego_humbling_moments"],
  s4: ["cringe_teenage_phase"],
  s6: ["chaotic_social_appearance"],
  s7: ["embarrassing_impression_fails"],
  s12: ["dumb_physical_chaos"],
  s13: ["dumb_physical_chaos"],
  s15: ["unspoken_sacrifice"],
  s16: ["chaotic_social_appearance"],
  s18: ["unspoken_sacrifice"],
  s20: ["unspoken_sacrifice"],
  g3: ["protecting_peace_boundaries"],
  g5: ["pruning_old_traits"],
  g6: ["hidden_sensitivity", "social_sensitivity", "emotional_vulnerability"],
  g7: ["protecting_peace_boundaries"],
  g10: ["social_sensitivity"],
  g11: ["unspoken_care_needs"],
  g12: ["pruning_old_traits"],
  g14: ["social_sensitivity"],
  g15: ["unspoken_care_needs"],
  g16: ["disillusioned_life_lessons"],
  g17: ["impactful_words_on_character"],
  g20: ["impactful_words_on_character", "emotional_vulnerability"],
  sp2: ["cynical_modernity"],
  sp3: ["philosophical_worldviews"],
  sp4: ["predict_mind_habits"],
  sp5: ["predict_mind_habits"],
  sp6: ["human_nature_observation", "philosophical_worldviews"],
  sp10: ["human_nature_observation"],
  sp11: ["cynical_modernity", "disillusioned_life_lessons"],
  sp13: ["debates_and_opinions"],
  sp19: ["debates_and_opinions"],
  b1: ["circle_deep_connection"],
  b3: ["circle_deep_connection"],
  b4: ["personality_label_award"],
  b6: ["fame_and_screen_presence"],
  b8: ["fame_and_screen_presence"],
  b9: ["personality_label_award"],
  b10: ["quiet_routine_reset"],
  b16: ["childish_joy_habits"],
  b18: ["quiet_routine_reset"]
};

// ==========================================
// 2. DETERMINISTIC ENGINE (PURE LOGIC)
// ==========================================
function getInitialGameState() {
  return {
    seenCardIds: [],
    viewedCardIds: [],
    lastSeenSession: {},
    consecutiveAppeared: {},
    cooldownUntilSession: {},
    currentSessionIndex: 0
  };
}

function cloneHistoryState(history) {
  if (!history) return getInitialGameState();
  if (typeof structuredClone === "function") {
    try { return structuredClone(history); } catch (e) {}
  }
  return {
    seenCardIds: Array.isArray(history.seenCardIds) ? [...history.seenCardIds] : [],
    viewedCardIds: Array.isArray(history.viewedCardIds) ? [...history.viewedCardIds] : [],
    lastSeenSession: history.lastSeenSession ? { ...history.lastSeenSession } : {},
    consecutiveAppeared: history.consecutiveAppeared ? { ...history.consecutiveAppeared } : {},
    cooldownUntilSession: history.cooldownUntilSession ? { ...history.cooldownUntilSession } : {},
    currentSessionIndex: history.currentSessionIndex || 0,
    totalCardsViewed: history.totalCardsViewed || 0
  };
}

function generateSessionCards(userGameHistory) {
  const history = cloneHistoryState(userGameHistory);
  history.currentSessionIndex = (history.currentSessionIndex || 0) + 1;
  const currentSessionIdx = history.currentSessionIndex;

  history.seenCardIds = history.seenCardIds || [];
  history.viewedCardIds = history.viewedCardIds || [];
  history.lastSeenSession = history.lastSeenSession || {};
  history.consecutiveAppeared = history.consecutiveAppeared || {};
  history.cooldownUntilSession = history.cooldownUntilSession || {};

  const seenSet = new Set(history.viewedCardIds.length > 0 ? history.viewedCardIds : history.seenCardIds);
  const sessionUsedTags = new Set();

  for (const cardId in history.cooldownUntilSession) {
    if (currentSessionIdx >= history.cooldownUntilSession[cardId]) {
      delete history.cooldownUntilSession[cardId];
      history.consecutiveAppeared[cardId] = 0;
    }
  }

  const generationOrder = ["sunny", "gentle", "bloom", "sprouting", "dew"];
  const stageMapKeys = {
    dew: "firstDew",
    sunny: "sunnyPaths",
    gentle: "gentleBreeze",
    sprouting: "sproutingIdeas",
    bloom: "fullBloom"
  };

  const targetQuotas = { sunny: 1, gentle: 1, bloom: 2, sprouting: 2, dew: 2 };
  const slotPatterns = {
    1: [[1], [2], [3], [4]],
    2: [[1, 3], [1, 4], [2, 4]]
  };

  const sessionStages = {
    dew: new Array(5).fill(null),
    sunny: new Array(5).fill(null),
    gentle: new Array(5).fill(null),
    sprouting: new Array(5).fill(null),
    bloom: new Array(5).fill(null)
  };

  const tagLookup = (typeof CARD_TAGS !== "undefined" && CARD_TAGS) ? CARD_TAGS : {};
  const stagePools = {};
  for (const stg in stageMapKeys) {
    const key = stageMapKeys[stg];
    stagePools[stg] = (typeof QUESTIONS_DATABASE !== "undefined" && QUESTIONS_DATABASE[key]) 
      ? [...QUESTIONS_DATABASE[key]] 
      : [];
  }

  const mechanicCounts = { "WHO SAID THAT": 0, "PREDICT": 0, "MOST LIKELY TO": 0 };

  function pickBestCard(stg, requiredMechanic = null, allowAnyMechanicIfNotFound = false) {
    const pool = stagePools[stg];
    if (!pool || pool.length === 0) return null;

    const getCardMechanic = (card) => {
      if (card.specialMechanic) return card.specialMechanic;
      if (card.mechanic && card.mechanic !== "NATURAL") return card.mechanic;
      return "NATURAL";
    };

    const matchesMechanic = (card, req) => {
      const m = getCardMechanic(card);
      if (req === "NATURAL") return m === "NATURAL";
      if (req) return m === req;
      return true;
    };

    const isTagFree = (card) => {
      const cTags = tagLookup[card.id] || [];
      return cTags.every(tag => !sessionUsedTags.has(tag));
    };

    const isInCooldown = (card) => !!history.cooldownUntilSession[card.id];

    let candidates = pool.filter(c => !seenSet.has(c.id) && isTagFree(c) && matchesMechanic(c, requiredMechanic));

    if (candidates.length === 0) {
      candidates = pool.filter(c => !seenSet.has(c.id) && matchesMechanic(c, requiredMechanic));
    }
    if (candidates.length === 0 && allowAnyMechanicIfNotFound && requiredMechanic !== "NATURAL") {
      candidates = pool.filter(c => !seenSet.has(c.id) && getCardMechanic(c) !== "NATURAL");
    }
    if (candidates.length === 0) {
      candidates = pool.filter(c => !seenSet.has(c.id));
    }
    if (candidates.length === 0) {
      candidates = pool.filter(c => seenSet.has(c.id) && !isInCooldown(c) && isTagFree(c) && matchesMechanic(c, requiredMechanic));
    }
    if (candidates.length === 0) {
      candidates = pool.filter(c => seenSet.has(c.id) && !isInCooldown(c) && matchesMechanic(c, requiredMechanic));
    }
    if (candidates.length === 0) {
      candidates = [...pool];
    }

    const rawChosen = candidates[Math.floor(Math.random() * candidates.length)];
    if (!rawChosen) return null;

    const chosen = { ...rawChosen };
    const cTags = tagLookup[chosen.id] || [];
    cTags.forEach(tag => sessionUsedTags.add(tag));
    stagePools[stg] = stagePools[stg].filter(c => c.id !== rawChosen.id);

    return chosen;
  }

  generationOrder.forEach(stg => {
    let quota = targetQuotas[stg];
    let patterns = slotPatterns[quota];
    let chosenSlots = [...patterns[Math.floor(Math.random() * patterns.length)]];

    for (let i = 0; i < chosenSlots.length; i++) {
      const slotIdx = chosenSlots[i];
      let targetMech = null;

      if (stg === "sunny") {
        targetMech = "WHO SAID THAT";
      } else if (stg === "gentle") {
        targetMech = (mechanicCounts["MOST LIKELY TO"] === 0) ? "MOST LIKELY TO" : "WHO SAID THAT";
      } else {
        const sortedMechs = Object.keys(mechanicCounts).sort((a, b) => mechanicCounts[a] - mechanicCounts[b]);
        targetMech = sortedMechs[0] || null;
      }

      let card = pickBestCard(stg, targetMech, true);
      const cardMech = card ? (card.specialMechanic || (card.mechanic !== "NATURAL" ? card.mechanic : null)) : null;

      if (card && cardMech) {
        card.activeMechanic = cardMech;
        sessionStages[stg][slotIdx] = card;
        mechanicCounts[cardMech] = (mechanicCounts[cardMech] || 0) + 1;
      }
    }
  });

  const stagesKey = ["dew", "sunny", "gentle", "sprouting", "bloom"];
  stagesKey.forEach(stg => {
    for (let slot = 0; slot < 5; slot++) {
      if (!sessionStages[stg][slot]) {
        const nCard = pickBestCard(stg, "NATURAL", false);
        if (nCard) {
          nCard.activeMechanic = null;
          sessionStages[stg][slot] = nCard;
        }
      }
    }
  });

  stagesKey.forEach(stg => {
    sessionStages[stg].forEach(card => {
      if (!card) return;

      if (!seenSet.has(card.id)) {
        history.seenCardIds.push(card.id);
        seenSet.add(card.id);
      }

      const lastSession = history.lastSeenSession[card.id] || 0;
      if (lastSession === currentSessionIdx - 1) {
        history.consecutiveAppeared[card.id] = (history.consecutiveAppeared[card.id] || 1) + 1;
      } else {
        history.consecutiveAppeared[card.id] = 1;
      }
      history.lastSeenSession[card.id] = currentSessionIdx;

      if (history.consecutiveAppeared[card.id] >= 2) {
        history.cooldownUntilSession[card.id] = currentSessionIdx + 2;
      }
    });
  });

  return { levels: sessionStages, updatedHistory: history };
}

// ==========================================
// 3. MECHANICS PLUGIN CONTROLLER
// ==========================================
const MechanicsManager = {
  activeCard: null,
  currentStep: 0,
  revealIndex: 0,
  _doneTimer: null,

  getPlayers() {
    return (Array.isArray(window.playersList) && window.playersList.length >= 3) 
      ? window.playersList 
      : ["Player 1", "Player 2", "Player 3"];
  },

  launch(cardObj) {
    if (!cardObj || !cardObj.activeMechanic) return;
    this.activeCard = cardObj;
    this.currentStep = 0;
    this.revealIndex = 0;

    const mech = cardObj.activeMechanic.toUpperCase();

    if (mech.includes("PREDICT")) {
      if (!this.activeCard.mechanicState) this.resetDraftState();
      this.openPredictFlow();
    } else if (mech.includes("WHO SAID")) {
      if (!this.activeCard.mechanicState) this.resetWhoSaidDraftState();
      this.openWhoSaidThatFlow();
    } else if (mech.includes("MOST LIKELY")) {
      if (!this.activeCard.mechanicState) this.resetMostLikelyDraftState();
      this.openMostLikelyToFlow();
    }
  },

      resetDraftState() {
    if (!this.activeCard) return;
    const allPlayers = this.getPlayers();
    let assigned = this.activeCard.assignedTargetPlayer;
    if (!assigned || !allPlayers.includes(assigned)) {
      assigned = (typeof getNextFairPlayer === "function") ? getNextFairPlayer() : allPlayers[0];
      this.activeCard.assignedTargetPlayer = assigned;
    }
    const oldIntro = this.activeCard.mechanicState?.selectedIntro;
    const oldOutro = this.activeCard.mechanicState?.selectedOutro;

    this.activeCard.mechanicState = {
      targetPlayer: assigned,
      selectedIntro: oldIntro,
      selectedOutro: oldOutro,
      guesses: {},
      truth: "",
      revealedCount: 0,
      truthRevealed: false,
      isCompleted: false
    };
    this.currentStep = 0;
    this.revealIndex = 0;
  },


    resetWhoSaidDraftState() {
    if (!this.activeCard) return;
    const oldOutro = this.activeCard.mechanicState?.selectedOutro;
    this.activeCard.mechanicState = {
      answers: {},
      selectedOutro: oldOutro,
      isCompleted: false
    };
    this.currentStep = 0;
    this.revealIndex = 0;
  },


    resetMostLikelyDraftState() {
    if (!this.activeCard) return;
    const oldOutro = this.activeCard.mechanicState?.selectedOutro;
    this.activeCard.mechanicState = {
      votes: {},
      selectedOutro: oldOutro,
      selectedTarget: null,
      isCompleted: false
    };
    this.currentStep = 0;
    this.revealIndex = 0;
  },


  // ---------------- PREDICT ----------------
  openPredictFlow() {
    const modal = document.getElementById("predict-modal");
    if (!modal) return;
    modal.classList.add("active");
    this.renderCurrentPredictStep();
  },

  startInputPass() {
    this.currentStep = 1;
    this.revealIndex = 0;
    this.renderCurrentPredictStep();
  },

  renderCurrentPredictStep() {
    const container = document.getElementById("predict-content");
    if (!container || !this.activeCard) return;
    const state = this.activeCard.mechanicState;
    const allPlayers = this.getPlayers();
    
    if (!state.targetPlayer || !allPlayers.includes(state.targetPlayer)) {
      state.targetPlayer = allPlayers[0];
    }
    const guessers = allPlayers.filter(p => p !== state.targetPlayer);

    if (this._doneTimer) {
      clearTimeout(this._doneTimer);
      this._doneTimer = null;
    }

    if (this.currentStep === 0) {
      container.innerHTML = `
        <div class="card-header-row">
          <button class="card-header-btn" onclick="MechanicsManager.cancel()">✕</button>
          <div class="card-header-center">
            <span class="predict-badge">THE QUESTION</span>
          </div>
          <button class="card-header-btn" onclick="shareCardImage()" title="Share">↗</button>
        </div>

        <div class="card-question">
          ${this.activeCard.text}
        </div>

        <div class="predict-nav-row">
          <span class="nav-arrow disabled">&lt;</span>
          <span class="nav-arrow" onclick="MechanicsManager.startInputPass()">&gt;</span>
        </div>
      `;
    }
    else if (this.currentStep === 1) {
      const inputPassIndex = this.revealIndex;
      const isTargetTurn = (inputPassIndex >= guessers.length);
      const currentPlayerName = isTargetTurn ? state.targetPlayer : guessers[inputPassIndex];
      const savedValue = isTargetTurn ? (state.truth || "") : (state.guesses[currentPlayerName] || "");
      const target = state.targetPlayer;

      const guessPrompts = [
        `Step into ${target}’s brain for a minute 🧠`,
        `Channel ${target}, You’ve got this`,
        `Think like ${target}, Try not to embarrass yourself😌`,
        `Become ${target} for a minute. Don’t disappoint us 😌`,
        `Think like them, Try not to embarrass yourself😌`
      ];

      if (!Array.isArray(state.assignedPromptPlayers)) {
        const totalParty = allPlayers.length;
        let quota = totalParty >= 6 ? 3 : (totalParty >= 4 ? 2 : 1);
        const shuffledGuessers = [...guessers].sort(() => Math.random() - 0.5);
        state.assignedPromptPlayers = shuffledGuessers.slice(0, quota);
        state.passPhrases = {};
        const shuffledPrompts = [...guessPrompts].sort(() => Math.random() - 0.5);
        state.assignedPromptPlayers.forEach((player, idx) => {
          state.passPhrases[player] = shuffledPrompts[idx % shuffledPrompts.length];
        });
      }

      let bottomPrompt = "";
      if (!isTargetTurn && state.assignedPromptPlayers.includes(currentPlayerName)) {
        bottomPrompt = state.passPhrases[currentPlayerName] || "";
      }

      container.innerHTML = `
        <div class="card-header-row">
          <button class="card-header-btn" onclick="MechanicsManager.cancel()">✕</button>
          <div class="card-header-center">
            <span class="predict-badge">PASS THE PHONE</span>
          </div>
          <button class="card-header-btn" onclick="shareCardImage()" title="Share">↗</button>
        </div>

        <div style="margin: auto 0; width: 100%; display: flex; flex-direction: column; align-items: center;">
          <div class="predict-title" style="margin-bottom: 2px;">Hand phone to ${currentPlayerName}</div>
          <div class="predict-subtitle" style="margin-bottom: 8px; font-size: 0.88rem;">
            ${isTargetTurn ? "Type your REAL truth secretly" : `Predict what ${state.targetPlayer} will say`}
          </div>
          
          <textarea id="predict-live-input" class="predict-input" placeholder="${isTargetTurn ? "Your real truth..." : "Your honest prediction..."}">${savedValue}</textarea>
          
          <div id="predict-empty-warn" style="font-size: 0.8rem; font-weight: 700; color: #c93b58; min-height: 18px; margin-top: 2px;"></div>
          
          <div style="font-size: 0.84rem; font-weight: 600; color: #825666; font-style: italic; margin-top: 4px; text-align: center; min-height: 20px;">
            ${bottomPrompt}
          </div>
        </div>

        <div class="predict-nav-row">
          <span class="nav-arrow" onclick="MechanicsManager.prevInputPass(${guessers.length})">&lt;</span>
          <span class="nav-arrow" onclick="MechanicsManager.nextInputPass(${guessers.length})">&gt;</span>
        </div>
      `;
    }
    else if (this.currentStep === 2) {
      if (typeof state.revealedCount === "undefined") state.revealedCount = 0;
      const allGuessesRevealed = state.revealedCount >= guessers.length;

      const visibleGuessesHtml = guessers.slice(0, state.revealedCount).map(guesser => {
        const guess = state.guesses[guesser] || "No prediction entered";
        return `
          <div class="prediction-bubble-light" style="width: 100%; margin-bottom: 8px; padding: 10px 14px; background: rgba(255,255,255,0.7); border-radius: 10px; text-align: left; box-sizing: border-box;">
            <p style="font-size: 0.9rem; font-style: italic; color: #2b1810; margin: 0 0 4px 0; line-height: 1.35; word-break: break-word;">
              “${guess}”
            </p>
            <div style="font-size: 0.78rem; font-weight: 700; color: #825666; text-align: left;">
              — ${guesser}
            </div>
          </div>
        `;
      }).join("");

      container.innerHTML = `
        <div class="card-header-row">
          <button class="card-header-btn" onclick="MechanicsManager.cancel()">✕</button>
          <div class="card-header-center">
            <span class="predict-badge">THE PREDICTION</span>
          </div>
          <button class="card-header-btn" onclick="shareCardImage()" title="Share">↗</button>
        </div>

        <div id="reveal-tap-area" onclick="MechanicsManager.revealNextCard(${guessers.length})" 
             style="width: 100%; max-height: 62vh; min-height: 220px; overflow-y: auto; padding: 6px 8px; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; cursor: pointer;">
          ${!allGuessesRevealed ? `
            <div style="font-size: 0.75rem; font-weight: 600; color: #a17887; letter-spacing: 0.5px; margin-bottom: 10px; text-transform: uppercase;">
              Tap anywhere to reveal
            </div>
          ` : `
            <div style="font-size: 0.75rem; font-weight: 600; color: #a17887; margin-bottom: 8px;">
              All predictions revealed
            </div>
          `}
          <div style="width: 100%;">
            ${visibleGuessesHtml}
          </div>
        </div>

        <div class="predict-nav-row" style="margin-top: 10px; width: 100%;">
          ${allGuessesRevealed ? `
            <button class="stone-btn" style="width: 100%;" onclick="MechanicsManager.goToTruthStep()">
              continue
            </button>
          ` : ""}
        </div>
      `;
    }
    else if (this.currentStep === 3) {
      const target = state.targetPlayer;

      const introPhrases = [
        "And now… the truth 🫢",
        "Enough guessing, time for the truth 😏",
        `Okay… what did ${target} actually say? 👀`,
        "The moment of truth ✨"
      ];

      const outroPhrases = [
        "So… did anyone get it right, or are you basically strangers? 👀",
        "Did you nail it, or completely miss the plot? 😭",
        "So… psychic, or just confidently wrong? 😌",
        `Did anyone get ${target} right, or were we all delusional? 👀`,
        `And the verdict is in, did you know ${target} at all? 😏`
      ];

      if (!state.truthIntro) state.truthIntro = introPhrases[Math.floor(Math.random() * introPhrases.length)];
      if (!state.truthOutro) state.truthOutro = outroPhrases[Math.floor(Math.random() * outroPhrases.length)];

      container.innerHTML = `
        <div class="card-header-row">
          <button class="card-header-btn" onclick="MechanicsManager.cancel()">✕</button>
          <div class="card-header-center">
            <span class="predict-badge">${target}'s Answer</span>
          </div>
          <button class="card-header-btn" onclick="shareCardImage()" title="Share">↗</button>
        </div>

        <div style="margin: auto 0; width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center;">
          <div class="truth-anim-1" style="font-size: 0.95rem; font-weight: 700; color: #825666; margin-bottom: 12px;">
            ${state.truthIntro}
          </div>

          <div class="truth-anim-2 prediction-bubble-light" style="width: 100%; padding: 16px 14px; background: rgba(255,255,255,0.7); border: 1px solid rgba(130, 86, 102, 0.2); border-radius: 12px; box-sizing: border-box; text-align: center;">
            <p style="font-size: 1.05rem; font-weight: 700; font-family: 'Playfair Display', serif; font-style: italic; color: #2b1810; margin: 0; line-height: 1.4; word-break: break-word;">
              “${state.truth || "No truth submitted"}”
            </p>
          </div>

          <div class="truth-anim-3" style="font-size: 0.9rem; font-weight: 600; color: #6b4d57; font-style: italic; margin-top: 14px; margin-bottom: 16px; line-height: 1.35; padding: 0 10px;">
            ${state.truthOutro}
          </div>
        </div>

        <div id="predict-done-btn-wrap" class="predict-nav-row" style="margin-top: auto; padding-top: 10px; width: 100%; min-height: 48px;"></div>
      `;

      this._doneTimer = setTimeout(() => {
        const wrap = document.getElementById("predict-done-btn-wrap");
        if (wrap) {
          wrap.innerHTML = `
            <button class="stone-btn btn-fade-in" style="width: 100%;" onclick="MechanicsManager.finish()">
              DONE
            </button>
          `;
        }
      }, 6000);
    }
  },

  revealNextCard(totalGuessers) {
    if (this._isRevealing) return;
    const state = this.activeCard.mechanicState;
    if (typeof state.revealedCount === "undefined") state.revealedCount = 0;
    
    if (state.revealedCount < totalGuessers) {
      this._isRevealing = true;
      state.revealedCount++;
      this.renderCurrentPredictStep();
      setTimeout(() => { this._isRevealing = false; }, 300);
    }
  },

  goToTruthStep() {
    this.currentStep = 3;
    this.renderCurrentPredictStep();
  },

  nextInputPass(totalGuessers) {
    const input = document.getElementById("predict-live-input");
    const warnEl = document.getElementById("predict-empty-warn");
    const val = input ? input.value.trim() : "";

    if (!val) {
      if (warnEl) warnEl.innerText = "Please write something before moving on!";
      if (input) { input.style.borderColor = "#c93b58"; input.focus(); }
      return;
    }

    const allPlayers = this.getPlayers();
    const guessers = allPlayers.filter(p => p !== this.activeCard.mechanicState.targetPlayer);
    const isTarget = (this.revealIndex >= totalGuessers);

    if (isTarget) {
      this.activeCard.mechanicState.truth = val;
      this.currentStep = 2;
      this.revealIndex = 0;
    } else {
      this.activeCard.mechanicState.guesses[guessers[this.revealIndex]] = val;
      this.revealIndex++;
    }

    this.renderCurrentPredictStep();
  },

  prevInputPass(totalGuessers) {
    const input = document.getElementById("predict-live-input");
    if (input && input.value.trim()) {
      const allPlayers = this.getPlayers();
      const guessers = allPlayers.filter(p => p !== this.activeCard.mechanicState.targetPlayer);
      if (this.revealIndex >= totalGuessers) {
        this.activeCard.mechanicState.truth = input.value.trim();
      } else {
        this.activeCard.mechanicState.guesses[guessers[this.revealIndex]] = input.value.trim();
      }
    }

    if (this.revealIndex > 0) this.revealIndex--;
    else { this.currentStep = 0; this.revealIndex = 0; }
    this.renderCurrentPredictStep();
  },

  // ---------------- WHO SAID THAT ----------------
  openWhoSaidThatFlow() {
    const modal = document.getElementById("predict-modal");
    if (!modal) return;
    modal.classList.add("active");
    this.renderCurrentWhoSaidStep();
  },

  startWhoSaidInputPass() {
    this.currentStep = 1;
    this.revealIndex = 0;
    this.renderCurrentWhoSaidStep();
  },

  renderCurrentWhoSaidStep() {
    const container = document.getElementById("predict-content");
    if (!container || !this.activeCard) return;
    const state = this.activeCard.mechanicState;
    const allPlayers = this.getPlayers();

    if (this.currentStep === 0) {
      container.innerHTML = `
        <div class="card-header-row">
          <button class="card-header-btn" onclick="MechanicsManager.cancel()">✕</button>
          <div class="card-header-center">
            <span class="predict-badge">THE QUESTION</span>
          </div>
          <button class="card-header-btn" onclick="shareCardImage()" title="Share">↗</button>
        </div>

        <div class="card-question">
          ${this.activeCard.text}
        </div>

        <div class="predict-nav-row">
          <span class="nav-arrow disabled">&lt;</span>
          <span class="nav-arrow" onclick="MechanicsManager.startWhoSaidInputPass()">&gt;</span>
        </div>
      `;
    }
    else if (this.currentStep === 1) {
      const currentPlayerName = allPlayers[this.revealIndex];
      const savedValue = state.answers[currentPlayerName] || "";

      const secretPrompts = [
        "Type it fast, no peeking 👀",
        "Your secret is safe with us… for now 🕵️",
        "Type first, explain later 😄",
        "Your answer is between you and the screen… for now 😁",
        "Nobody sees it… unless the game decides otherwise 👀"
      ];

      if (!Array.isArray(state.assignedPromptPlayers)) {
        const totalParty = allPlayers.length;
        let quota = totalParty >= 6 ? 3 : (totalParty >= 4 ? 2 : 1);
        const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
        state.assignedPromptPlayers = shuffledPlayers.slice(0, quota);
        state.passPhrases = {};
        const shuffledPrompts = [...secretPrompts].sort(() => Math.random() - 0.5);
        state.assignedPromptPlayers.forEach((player, idx) => {
          state.passPhrases[player] = shuffledPrompts[idx % shuffledPrompts.length];
        });
      }

      let bottomPrompt = "";
      if (state.assignedPromptPlayers.includes(currentPlayerName)) {
        bottomPrompt = state.passPhrases[currentPlayerName] || "";
      }

      container.innerHTML = `
        <div class="card-header-row">
          <button class="card-header-btn" onclick="MechanicsManager.cancel()">✕</button>
          <div class="card-header-center">
            <span class="predict-badge">PASS THE PHONE</span>
          </div>
          <button class="card-header-btn" onclick="shareCardImage()" title="Share">↗</button>
        </div>

        <div style="margin: auto 0; width: 100%; display: flex; flex-direction: column; align-items: center;">
          <div class="predict-title" style="margin-bottom: 2px;">Hand phone to ${currentPlayerName}</div>
          <div class="predict-subtitle" style="margin-bottom: 8px; font-size: 0.88rem;">
            Type your answer
          </div>
          
          <textarea id="whosaid-live-input" class="predict-input" placeholder="Your answer...">${savedValue}</textarea>
          
          <div id="whosaid-empty-warn" style="font-size: 0.8rem; font-weight: 700; color: #c93b58; min-height: 18px; margin-top: 2px;"></div>
          
          <div style="font-size: 0.84rem; font-weight: 600; color: #825666; font-style: italic; margin-top: 4px; text-align: center; min-height: 20px;">
            ${bottomPrompt}
          </div>
        </div>

        <div class="predict-nav-row">
          <span class="nav-arrow" onclick="MechanicsManager.prevWhoSaidInputPass(${allPlayers.length})">&lt;</span>
          <span class="nav-arrow" onclick="MechanicsManager.nextWhoSaidInputPass(${allPlayers.length})">&gt;</span>
        </div>
      `;
    }
    else if (this.currentStep === 2) {
      const deck = state.shuffledRevealDeck || [];
      const currentAnswerObj = deck[this.revealIndex];
      const isLastAnswer = this.revealIndex >= deck.length - 1;

      if (!currentAnswerObj) return;

      container.innerHTML = `
        <div class="card-header-row">
          <button class="card-header-btn" onclick="MechanicsManager.cancel()">✕</button>
          <div class="card-header-center"></div>
          <button class="card-header-btn" onclick="shareCardImage()" title="Share">↗</button>
        </div>

        <div class="who-flip-card">
          <div id="who-card-inner" class="who-flip-inner">
            <div class="who-flip-front">
              <p style="font-size: 1.1rem; font-family: 'Playfair Display', serif; font-style: italic; color: #2b1810; margin: 0; line-height: 1.45; word-break: break-word;">
                “${currentAnswerObj.text}”
              </p>
              <div style="font-size: 0.85rem; font-weight: 600; color: #825666; margin-top: 16px; font-style: italic;">
                Who do you think wrote this? 🤔
              </div>
            </div>
            <div class="who-flip-back">
              <div style="font-size: 1.6rem; font-weight: 800; color: #422933; font-family: 'Playfair Display', serif;">
                ${currentAnswerObj.author}
              </div>
            </div>
          </div>
        </div>

        <div class="predict-nav-row" style="margin-top: 15px; width: 100%;">
          <button id="who-reveal-btn" class="stone-btn" style="width: 100%;" onclick="MechanicsManager.flipWhoSaidCard()">
            REVEAL
          </button>
          <button id="who-next-btn" class="stone-btn" style="width: 100%; display: none;" onclick="${isLastAnswer ? 'MechanicsManager.finish()' : 'MechanicsManager.nextWhoSaidAnswer()'}">
            ${isLastAnswer ? 'DONE' : 'CONTINUE'}
          </button>
        </div>
      `;
    }
  },

  flipWhoSaidCard() {
    const innerCard = document.getElementById("who-card-inner");
    const revealBtn = document.getElementById("who-reveal-btn");
    const nextBtn = document.getElementById("who-next-btn");

    if (innerCard) innerCard.classList.add("is-flipped");
    if (revealBtn) revealBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "block";
  },

  nextWhoSaidAnswer() {
    const deck = this.activeCard.mechanicState.shuffledRevealDeck;
    if (deck && this.revealIndex < deck.length - 1) {
      this.revealIndex++;
      this.renderCurrentWhoSaidStep();
    }
  },

  nextWhoSaidInputPass(totalPlayers) {
    const input = document.getElementById("whosaid-live-input");
    const warnEl = document.getElementById("whosaid-empty-warn");
    const val = input ? input.value.trim() : "";

    if (!val) {
      if (warnEl) warnEl.innerText = "Please write your answer !";
      if (input) { input.style.borderColor = "#c93b58"; input.focus(); }
      return;
    }

    const allPlayers = this.getPlayers();
    this.activeCard.mechanicState.answers[allPlayers[this.revealIndex]] = val;

    if (this.revealIndex >= totalPlayers - 1) {
      if (!this.activeCard.mechanicState.selectedPlayersToReveal) {
        this.activeCard.mechanicState.selectedPlayersToReveal = this.getFairWhoSaidSelectedPlayers(allPlayers);
      }
      const selected = this.activeCard.mechanicState.selectedPlayersToReveal;
      
      if (!this.activeCard.mechanicState.shuffledRevealDeck) {
        this.activeCard.mechanicState.shuffledRevealDeck = selected.map(playerName => ({
          author: playerName,
          text: this.activeCard.mechanicState.answers[playerName] || "No answer submitted",
          isUnmasked: false
        })).sort(() => Math.random() - 0.5);
      }

      this.currentStep = 2;
      this.revealIndex = 0;
    } else {
      this.revealIndex++;
    }

    this.renderCurrentWhoSaidStep();
  },

  getFairWhoSaidSelectedPlayers(allPlayers) {
    const total = allPlayers.length;
    let quota = total >= 5 ? 3 : 2;
    let historyCounts = {};
    try {
      historyCounts = JSON.parse(localStorage.getItem("alfiria_whosaid_history") || "{}");
    } catch (e) {
      historyCounts = {};
    }

    allPlayers.forEach(p => {
      if (typeof historyCounts[p] === "undefined") historyCounts[p] = 0;
    });

    const sortedPlayers = [...allPlayers].sort((a, b) => {
      const diff = (historyCounts[a] || 0) - (historyCounts[b] || 0);
      return diff !== 0 ? diff : Math.random() - 0.5;
    });

    const chosen = sortedPlayers.slice(0, quota);
    chosen.forEach(p => { historyCounts[p] = (historyCounts[p] || 0) + 1; });
    try {
      localStorage.setItem("alfiria_whosaid_history", JSON.stringify(historyCounts));
    } catch (e) {}
    return chosen;
  },

  prevWhoSaidInputPass(totalPlayers) {
    const input = document.getElementById("whosaid-live-input");
    if (input && input.value.trim()) {
      const allPlayers = this.getPlayers();
      this.activeCard.mechanicState.answers[allPlayers[this.revealIndex]] = input.value.trim();
    }

    if (this.revealIndex > 0) this.revealIndex--;
    else { this.currentStep = 0; this.revealIndex = 0; }
    this.renderCurrentWhoSaidStep();
  },

  // ---------------- MOST LIKELY TO ----------------
  openMostLikelyToFlow() {
    const modal = document.getElementById("predict-modal");
    if (!modal) return;
    modal.classList.add("active");
    this.renderCurrentMostLikelyStep();
  },

  startMostLikelyVoting() {
    this.currentStep = 1;
    this.revealIndex = 0;
    this.renderCurrentMostLikelyStep();
  },

  renderCurrentMostLikelyStep() {
    const container = document.getElementById("predict-content");
    if (!container || !this.activeCard) return;
    const state = this.activeCard.mechanicState;
    const allPlayers = this.getPlayers();

    if (this._doneTimer) {
      clearTimeout(this._doneTimer);
      this._doneTimer = null;
    }

    if (this.currentStep === 0) {
      container.innerHTML = `
        <div class="card-header-row">
          <button class="card-header-btn" onclick="MechanicsManager.cancel()">✕</button>
          <div class="card-header-center">
            <span class="predict-badge">THE QUESTION</span>
          </div>
          <button class="card-header-btn" onclick="shareCardImage()" title="Share">↗</button>
        </div>

        <div class="card-question">
          ${this.activeCard.text}
        </div>

        <div class="predict-nav-row">
          <span class="nav-arrow disabled">&lt;</span>
          <span class="nav-arrow" onclick="MechanicsManager.startMostLikelyVoting()">&gt;</span>
        </div>
      `;
    }
    else if (this.currentStep === 1) {
      const voterName = allPlayers[this.revealIndex];
      const eligibleNominees = allPlayers.filter(p => p !== voterName);
      const currentVote = state.votes[voterName] || "";
      const totalNominees = eligibleNominees.length;

      const sassyPhrases = [
        "We won’t tell them you picked them… for now 😏",
        "Choose with your chest, don't be shy 💅",
        "Somebody’s gotta take the hit 🤷‍♀️",
        "The truth hurts, but your vote doesn’t lie 😌",
        "Don’t look them in the eyes, they’ll know 💀",
        "Avoid eye contact, act natural 😌",
        "Look down and vote, don't let your eyes snitch 🤐"
      ];

      if (!Array.isArray(state.assignedPromptPlayers)) {
        const totalParty = allPlayers.length;
        let quota = totalParty >= 6 ? 3 : (totalParty >= 4 ? 2 : 1);
        const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
        state.assignedPromptPlayers = shuffledPlayers.slice(0, quota);
        state.passPhrases = {};
        const shuffledPrompts = [...sassyPhrases].sort(() => Math.random() - 0.5);
        state.assignedPromptPlayers.forEach((player, idx) => {
          state.passPhrases[player] = shuffledPrompts[idx % shuffledPrompts.length];
        });
      }

      let bottomPrompt = "";
      if (state.assignedPromptPlayers.includes(voterName)) {
        bottomPrompt = state.passPhrases[voterName] || "";
      }

      const nomineeButtonsHtml = eligibleNominees.map((name, index) => {
        const isSelected = (currentVote === name);
        const isOddLast = (totalNominees % 2 !== 0 && index === totalNominees - 1);

        return `
          <button 
            type="button"
            class="nominee-btn ${isSelected ? 'selected' : ''}" 
            onclick="MechanicsManager.selectMostLikelyVote('${name.replace(/'/g, "\\'")}')"
            style="
              width: 100%; padding: 9px 8px; border-radius: 10px; font-size: 0.88rem; font-weight: 700; font-family: inherit; cursor: pointer; transition: all 0.2s ease; box-sizing: border-box;
              background: ${isSelected ? '#e28599' : 'rgba(252, 246, 238, 0.85)'};
              color: ${isSelected ? '#ffffff' : '#422933'};
              border: ${isSelected ? 'none' : '1px solid rgba(180, 140, 150, 0.35)'};
              box-shadow: ${isSelected ? '0 3px 10px rgba(226, 133, 153, 0.45)' : 'none'};
              white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
              ${isOddLast ? 'grid-column: 1 / -1; justify-self: center; width: 60%;' : ''}
            ">
            ${name}
          </button>
        `;
      }).join("");

      container.innerHTML = `
        <div class="card-header-row">
          <button class="card-header-btn" onclick="MechanicsManager.cancel()">✕</button>
          <div class="card-header-center">
            <span class="predict-badge">PASS THE PHONE</span>
          </div>
          <button class="card-header-btn" onclick="shareCardImage()" title="Share">↗</button>
        </div>

        <div style="margin: auto 0; width: 100%; display: flex; flex-direction: column; align-items: center;">
          <div class="predict-title" style="margin-bottom: 2px;">Hand phone to ${voterName}</div>
          <div class="predict-subtitle" style="margin-bottom: 12px; font-size: 0.85rem; color: #825666;">
            Vote for who fits this best
          </div>
          
          <div id="mostlikely-options" style="width: 100%; max-height: 40vh; overflow-y: auto; box-sizing: border-box; padding: 2px 4px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            ${nomineeButtonsHtml}
          </div>

          <div id="mostlikely-warn" style="font-size: 0.78rem; font-weight: 700; color: #c93b58; min-height: 16px; margin-top: 4px;"></div>

          <div style="font-size: 0.82rem; font-weight: 600; color: #825666; font-style: italic; margin-top: 4px; text-align: center; min-height: 20px; line-height: 1.35;">
            ${bottomPrompt}
          </div>
        </div>

        <div class="predict-nav-row">
          <span class="nav-arrow" onclick="MechanicsManager.prevMostLikelyVote(${allPlayers.length})">&lt;</span>
          <span class="nav-arrow" onclick="MechanicsManager.nextMostLikelyVote(${allPlayers.length})">&gt;</span>
        </div>
      `;
    }
    else if (this.currentStep === 2) {
      const voteCounts = {};
      Object.values(state.votes || {}).forEach(candidate => {
        if (candidate) voteCounts[candidate] = (voteCounts[candidate] || 0) + 1;
      });

      let maxVotes = 0;
      Object.values(voteCounts).forEach(cnt => {
        if (cnt > maxVotes) maxVotes = cnt;
      });

      const winners = Object.keys(voteCounts).filter(name => voteCounts[name] === maxVotes);
      const isTie = winners.length > 1;

      const introPhrases = [
        "And the verdict is in… 🥁",
        "The moment of truth ✨",
        "Here’s what the group really thinks 👀",
        "The council has spoken 📜",
        "No hiding now… here’s the result 🫢"
      ];

      const soloOutroPhrases = [
        "The group has spoken… don’t take it personally 😌",
        "Well, that wasn't even close 👀",
        "Wear the title with pride, you earned it 💅",
        "Nobody is surprised, let’s be honest 😄",
        "The votes are in, and your reputation precedes you ☺️️"
      ];

      const tieOutroPhrases = [
        "It’s a tie, guess you’ll have to share the crown 👑",
        "The group couldn't separate you on this one ⚖️",
        "Same energy, same wavelength 👀",
        "Looks like the group sees both of you in this🤷 ",
        "Guilty in equal measure, don't look at each other 💅"
      ];

      if (!state.verdictIntro) state.verdictIntro = introPhrases[Math.floor(Math.random() * introPhrases.length)];
      if (!state.verdictOutro) {
        const list = isTie ? tieOutroPhrases : soloOutroPhrases;
        state.verdictOutro = list[Math.floor(Math.random() * list.length)];
      }

      const winnersDisplayHtml = isTie ? winners.join(", ") : (winners[0] || "No votes recorded");
      const voteLabel = maxVotes === 1 ? "1 vote" : `${maxVotes} votes`;
      const badgeText = isTie ? `${voteLabel} each` : voteLabel;

      container.innerHTML = `
        <div class="card-header-row">
          <button class="card-header-btn" onclick="MechanicsManager.cancel()">✕</button>
          <div class="card-header-center">
            <span class="predict-badge">THE VERDICT</span>
          </div>
          <button class="card-header-btn" onclick="shareCardImage()" title="Share">↗</button>
        </div>

        <div style="margin: auto 0; width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center;">
          <div class="verdict-anim-1" style="font-size: 0.95rem; font-weight: 700; color: #825666; margin-bottom: 14px;">
            ${state.verdictIntro}
          </div>

          <div class="verdict-anim-2 prediction-bubble-light" style="width: 100%; padding: 18px 14px; background: rgba(252, 246, 238, 0.92); border: 1px solid rgba(226, 133, 153, 0.4); border-radius: 14px; box-sizing: border-box; box-shadow: 0 4px 16px rgba(226, 133, 153, 0.2); display: flex; flex-direction: column; align-items: center;">
            <div style="font-size: 0.72rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #825666; margin-bottom: 8px;">
              ${isTie ? "TIED FOR THE LEAD" : "MOST VOTED"}
            </div>
            <div style="font-size: 1.55rem; font-weight: 800; font-family: 'Playfair Display', serif; color: #422933; margin-bottom: 10px; line-height: 1.25; word-break: break-word;">
              ${winnersDisplayHtml}
            </div>
            <div style="display: inline-block; font-size: 0.78rem; font-weight: 700; color: #ffffff; background: #e28599; padding: 4px 14px; border-radius: 20px; letter-spacing: 0.5px;">
              ${badgeText}
            </div>
          </div>

          <div class="verdict-anim-3" style="font-size: 0.88rem; font-weight: 600; color: #6b4d57; font-style: italic; margin-top: 16px; line-height: 1.4; padding: 0 8px;">
            ${state.verdictOutro}
          </div>
        </div>

        <div id="verdict-done-btn-wrap" class="predict-nav-row" style="margin-top: auto; padding-top: 10px; width: 100%; min-height: 48px;"></div>
      `;

      this._doneTimer = setTimeout(() => {
        const wrap = document.getElementById("verdict-done-btn-wrap");
        if (wrap) {
          wrap.innerHTML = `
            <button class="stone-btn btn-fade-in" style="width: 100%;" onclick="MechanicsManager.finish()">
              DONE
            </button>
          `;
        }
      }, 6000);
    }
  },

  selectMostLikelyVote(candidateName) {
    const allPlayers = this.getPlayers();
    this.activeCard.mechanicState.votes[allPlayers[this.revealIndex]] = candidateName;
    const warn = document.getElementById("mostlikely-warn");
    if (warn) warn.innerText = "";
    this.renderCurrentMostLikelyStep();
  },

  nextMostLikelyVote(totalPlayers) {
    const allPlayers = this.getPlayers();
    const voterName = allPlayers[this.revealIndex];
    if (!this.activeCard.mechanicState.votes[voterName]) {
      const warn = document.getElementById("mostlikely-warn");
      if (warn) warn.innerText = "Please pick someone before passing!";
      return;
    }

    if (this.revealIndex >= totalPlayers - 1) {
      this.currentStep = 2;
      this.revealIndex = 0;
    } else {
      this.revealIndex++;
    }
    this.renderCurrentMostLikelyStep();
  },

  prevMostLikelyVote(totalPlayers) {
    if (this.revealIndex > 0) this.revealIndex--;
    else { this.currentStep = 0; this.revealIndex = 0; }
    this.renderCurrentMostLikelyStep();
  },

  cancel() {
    if (this._doneTimer) { clearTimeout(this._doneTimer); this._doneTimer = null; }
    const mech = (this.activeCard && this.activeCard.activeMechanic) ? this.activeCard.activeMechanic.toUpperCase() : "";
    if (mech.includes("WHO SAID")) this.resetWhoSaidDraftState();
    else if (mech.includes("MOST LIKELY")) this.resetMostLikelyDraftState();
    else this.resetDraftState();

    const modal = document.getElementById("predict-modal");
    if (modal) modal.classList.remove("active");

    setTimeout(() => {
      const cardModal = document.getElementById("card-modal");
      if (cardModal) {
        cardModal.classList.add("active");
        if (typeof renderCard === "function") renderCard(false);
      }
    }, 120);
  },

  finish() {
    if (this._doneTimer) { clearTimeout(this._doneTimer); this._doneTimer = null; }
    if (this.activeCard) this.activeCard.mechanicState = { isCompleted: true };
    this.currentStep = 0;
    this.revealIndex = 0;

    const modal = document.getElementById("predict-modal");
    if (modal) modal.classList.remove("active");

    setTimeout(() => {
      const cardModal = document.getElementById("card-modal");
      if (cardModal) cardModal.classList.add("active");
      if (typeof nextCard === "function") nextCard();
    }, 70);
  }
};

// ==========================================
// 4. UNIFIED STORAGE LAYER
// ==========================================
const GameStorage = {
  KEYS: {
    HISTORY: "alfiria_game_history",
    SESSION: "alfiria_active_session",
    PLAYERS: "alfiria_players_list",
    CURRENT_LEVEL: "alfiria_current_level_key",
    HIGHEST_UNLOCKED: "alfiria_highest_unlocked",
    STAGE_POINTERS: "alfiria_stage_pointers"
  },

  getHistory() {
    try {
      const data = localStorage.getItem(this.KEYS.HISTORY);
      if (!data) return typeof getInitialGameState === "function" ? getInitialGameState() : {};
      const parsed = JSON.parse(data);
      const base = typeof getInitialGameState === "function" ? getInitialGameState() : {};
      return {
        ...base,
        ...parsed,
        viewedCardIds: Array.isArray(parsed.viewedCardIds) ? parsed.viewedCardIds : []
      };
    } catch (e) {
      return typeof getInitialGameState === "function" ? getInitialGameState() : {};
    }
  },

  saveHistory(history) {
    try { localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history)); } catch (e) {}
  },

  getActiveSession() {
    try {
      const data = localStorage.getItem(this.KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },

  saveActiveSession(session) {
    try { localStorage.setItem(this.KEYS.SESSION, JSON.stringify(session)); } catch (e) {}
  },

  clearActiveSession() { localStorage.removeItem(this.KEYS.SESSION); },

  getPlayers() {
    try {
      const data = localStorage.getItem(this.KEYS.PLAYERS);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },

  savePlayers(players) {
    try { localStorage.setItem(this.KEYS.PLAYERS, JSON.stringify(players)); } catch (e) {}
  },

  getCurrentLevelKey() {
    return localStorage.getItem(this.KEYS.CURRENT_LEVEL) || "dew";
  },

  saveCurrentLevelKey(key) { localStorage.setItem(this.KEYS.CURRENT_LEVEL, key); },

  getHighestUnlocked() {
    return parseInt(localStorage.getItem(this.KEYS.HIGHEST_UNLOCKED) || "0", 10);
  },

  saveHighestUnlocked(idx) {
    localStorage.setItem(this.KEYS.HIGHEST_UNLOCKED, idx.toString());
  },

  getStagePointers() {
    try {
      const data = localStorage.getItem(this.KEYS.STAGE_POINTERS);
      return data ? JSON.parse(data) : { dew: 0, sunny: 0, gentle: 0, sprouting: 0, bloom: 0 };
    } catch (e) {
      return { dew: 0, sunny: 0, gentle: 0, sprouting: 0, bloom: 0 };
    }
  },

  saveStagePointers(pointers) {
    try { localStorage.setItem(this.KEYS.STAGE_POINTERS, JSON.stringify(pointers)); } catch (e) {}
  },

  clearAll() {
    localStorage.clear();
    sessionStorage.clear();
  }
};

// ==========================================
// 5. CORE CONTROLLER (MAP, CARDS & FLOW)
// ==========================================
window.playersList = [];
let sessionData = null;
let currentLevelKey = GameStorage.getCurrentLevelKey();
let levelCurrentCard = 0;
let sessionPlayerQueue = [];
let isAnimatingCard = false;

const LEVEL_KEYS = ["dew", "sunny", "gentle", "sprouting", "bloom"];
let highestUnlockedIdx = GameStorage.getHighestUnlocked();
let stageCardPointers = GameStorage.getStagePointers();

function initBlossomIsland() {
  const savedPlayers = GameStorage.getPlayers();
  if (savedPlayers && Array.isArray(savedPlayers) && savedPlayers.length >= 3) {
    window.playersList = [...savedPlayers];
    initPlayerQueue();
  } else {
    setTimeout(() => { openPlayersModal(true); }, 300);
  }

  if (highestUnlockedIdx >= 5) {
    startNewReplayRound();
  }

  sessionData = GameStorage.getActiveSession();
  if (!sessionData) {
    const savedHistory = GameStorage.getHistory();
    sessionData = generateSessionCards(savedHistory);
    GameStorage.saveActiveSession(sessionData);
    GameStorage.saveHistory(sessionData.updatedHistory || savedHistory);
  }

  updateProgressBar();
  updateNodeStatuses();

  const mapImg = document.getElementById("blossom-map-img");
  if (mapImg) mapImg.classList.add("loaded");
}

function updateProgressBar() {
  const history = GameStorage.getHistory();
  const total = history.viewedCardIds ? history.viewedCardIds.length : 0;
  const fill = document.getElementById("progress-bar-fill");
  const text = document.getElementById("progress-percent-text");

  if (!fill || !text) return;

  if (total >= 100) {
    text.innerText = "∞";
    text.style.fontSize = "1.2rem";
    text.style.lineHeight = "1";
    fill.style.width = "100%";
    return;
  }

  const pct = Math.min(100, Math.max(0, total));
  text.innerText = `${pct}%`;
  text.style.fontSize = "";
  fill.style.width = `${pct}%`;
}

function updateNodeStatuses() {
  for (let i = 1; i <= 5; i++) {
    const node = document.getElementById(`rock-step-${i}`);
    if (!node) continue;
    const stageIdx = i - 1;

    node.className = "rock-node";
    if (stageIdx < highestUnlockedIdx) {
      node.classList.add("completed");
    } else if (stageIdx === highestUnlockedIdx) {
      node.classList.add("active");
    } else {
      node.classList.add("locked");
    }
  }
}

function handleNodeClick(levelNum) {
  syncCurrentInputs();
  const validNames = (window.playersList || []).map(n => (n || "").trim()).filter(Boolean);

  if (validNames.length < 3) {
    openPlayersModal(true);
    return;
  }

  const targetIdx = levelNum - 1;
  if (targetIdx > highestUnlockedIdx) {
    const lockModal = document.getElementById("level-intro-modal");
    if (lockModal) lockModal.classList.add("active");
    return;
  }

  currentLevelKey = LEVEL_KEYS[targetIdx];
  GameStorage.saveCurrentLevelKey(currentLevelKey);
  startLevelCards();
}

function closeLevelIntroModal() {
  const lockModal = document.getElementById("level-intro-modal");
  if (lockModal) lockModal.classList.remove("active");
}

const levelIntros = {  
  dew: { visualClass: "card-lvl-dew", description: "Let’s start easy, get comfortable, and discover the little things about each other" },  
  sunny: { visualClass: "card-lvl-sunny", description: "Now, let’s go beyond preferences and share a few stories along the way" },  
  gentle: { visualClass: "card-lvl-gentle", description: "A little deeper now — the things you value, feel, and carry with you" },  
  sprouting: { visualClass: "card-lvl-sprouting", description: "Let’s see how you think, what catches your curiosity, and where your perspectives meet" },  
  bloom: { visualClass: "card-lvl-bloom", description: "You’ve gotten to know a little , Now let’s see what surprises are still hiding underneath" }  
};

function startLevelCards() {
  levelCurrentCard = stageCardPointers[currentLevelKey] || 0;
  const cardModal = document.getElementById("card-modal");
  if (cardModal) cardModal.classList.add("active");
  renderCard(false);
}

function saveStageProgress(key, cardNum) {
  stageCardPointers[key] = cardNum;
  GameStorage.saveStagePointers(stageCardPointers);
}

function getCardRenderData(levelKey, cardNum) {
  const currentIntro = levelIntros[levelKey];

  if (cardNum === 0) {
    return {
      isIntro: true,
      stageId: levelKey,
      cardId: "intro",
      visualClass: currentIntro ? currentIntro.visualClass : `card-lvl-${levelKey}`,
      numberTag: "",
      headerBadge: { text: "INTRO", className: "card-mechanic-badge", color: "#422933" },
      contentHtml: `
        <div style="margin: auto 0; display: flex; align-items: center; justify-content: center; width: 100%; padding: 0 10px;">
          <div style="font-size: inherit; font-family: inherit; line-height: inherit; color: #422933; text-align: center;">
            ${currentIntro.description}
          </div>
        </div>
      `,
      isSpecial: false,
      cardRef: null
    };
  }

  const questionIndex = cardNum - 1;
  const card = sessionData && sessionData.levels && sessionData.levels[levelKey] 
    ? sessionData.levels[levelKey][questionIndex] 
    : null;

  const activeMech = card ? (card.specialMechanic || card.activeMechanic || (card.mechanic !== "NATURAL" ? card.mechanic : null)) : null;
  const isSpecial = !!activeMech;
  let contentHtml = "";

  if (isSpecial) {
    const mechType = activeMech.toUpperCase();

    if (mechType.includes("PREDICT")) {
      const currentPlayers = window.playersList || [];
            if (!card.assignedTargetPlayer || !currentPlayers.includes(card.assignedTargetPlayer)) {
        card.assignedTargetPlayer = getNextFairPlayer();
      }
      if (!card.mechanicState) {
        card.mechanicState = { targetPlayer: card.assignedTargetPlayer, guesses: {}, truth: "", isCompleted: false };
      } else {
        card.mechanicState.targetPlayer = card.assignedTargetPlayer;
      }

      const target = card.mechanicState.targetPlayer;
      const introHeadlines = [
        `${target}, you’re in the hot seat 🔥`,
        `${target}, you’re the main character now ✨`,
        `${target}, your moment has arrived 😁`,
        `${target}, you’ve got the spotlight ✨`
      ];

      const outroPhrases = [
        "Things are about to get messy 🫢",
        "Oh, this could get interesting 👀",
        "Let’s stir the pot a little 😝",
        "This one might cause some trouble 😈",
        "Well… this should be fun 👀"
      ];

      if (!card.mechanicState.selectedIntro) card.mechanicState.selectedIntro = introHeadlines[Math.floor(Math.random() * introHeadlines.length)];
      if (!card.mechanicState.selectedOutro) card.mechanicState.selectedOutro = outroPhrases[Math.floor(Math.random() * outroPhrases.length)];

      contentHtml = `
        <div class="special-intro-title">${card.mechanicState.selectedIntro}</div>
        <div class="special-intro-sub">Everyone else gets to guess your answer. No peeking!</div>
        <div class="special-intro-tag">${card.mechanicState.selectedOutro}</div>
        <button class="stone-btn" style="margin-top: 10px;" onclick="launchSpecialMechanic(${questionIndex})">
          REVEAL THE QUESTION
        </button>
      `;
    } else if (mechType.includes("WHO SAID THAT") || mechType.includes("WHO SAID")) {
      const whoSaidOutros = [
        "Time to put those instincts to work 💅",
        "Trust your gut… maybe 😬",
        "Time to crack the case 🔎",
        "Your investigation starts now 🕵️"
      ];

          if (!card.mechanicState) {
        card.mechanicState = { answers: {}, isCompleted: false };
      }
      if (!card.mechanicState.selectedOutro) {
        card.mechanicState.selectedOutro = whoSaidOutros[Math.floor(Math.random() * whoSaidOutros.length)];
      }

      contentHtml = `
        <div class="special-intro-title">Answer the question quietly</div>
        <div class="special-intro-sub">We’ll reveal a few answers, and you’ll have to match them to the right person</div>
        <div class="special-intro-tag">${card.mechanicState.selectedOutro}</div>
        <button class="stone-btn" style="margin-top: 10px;" onclick="launchSpecialMechanic(${questionIndex})">
          REVEAL THE QUESTION
        </button>
      `;

    } else if (mechType.includes("MOST LIKELY")) {
      const mostLikelyOutros = [
        "Let’s see where those fingers point 😜",
        "Well, someone’s getting nominated 😏",
        "This should reveal a few things 😚",
        "Choose carefully… or don’t 😏"
      ];

          if (!card.mechanicState) {
        card.mechanicState = { votes: {}, isCompleted: false };
      }
      if (!card.mechanicState.selectedOutro) {
        card.mechanicState.selectedOutro = mostLikelyOutros[Math.floor(Math.random() * mostLikelyOutros.length)];
      }

      contentHtml = `
        <div class="special-intro-title">Time to point some fingers 👀</div>
        <div class="special-intro-sub">Read the question and choose the person who fits it best.<br>Everyone gets one vote!</div>
        <div class="special-intro-tag">${card.mechanicState.selectedOutro}</div>
        <button class="stone-btn" style="margin-top: 10px;" onclick="launchSpecialMechanic(${questionIndex})">
          REVEAL THE QUESTION
        </button>
      `;

    }
  } else {
    contentHtml = `<div style="margin: auto 0; padding: 10px;">${card ? card.text : ""}</div>`;
  }

  return {
    isIntro: false,
    stageId: levelKey,
    cardId: card ? card.id : "unknown",
    visualClass: currentIntro ? currentIntro.visualClass : `card-lvl-${levelKey}`,
    numberTag: String(cardNum).padStart(2, "0"),
    headerBadge: isSpecial ? { text: "SPECIAL CARD", className: "special-card-badge", color: "" } : null,
    contentHtml: contentHtml,
    isSpecial: isSpecial,
    cardRef: card
  };
}

function renderCard(animate = false, direction = "next") {
  const cardEl = document.getElementById("active-card");
  const questionEl = document.getElementById("card-question-text");
  const numTag = document.getElementById("card-number-tag");
  const prevBtn = document.getElementById("prev-arrow");
  const headerTag = document.getElementById("card-mechanic-tag");

  if (!cardEl || !questionEl) return;

  const data = getCardRenderData(currentLevelKey, levelCurrentCard);

  cardEl.className = `game-card ${data.visualClass}`;
  if (data.isSpecial) cardEl.classList.add("card-special-mechanic");

  cardEl.dataset.stageId = data.stageId;
  cardEl.dataset.cardId = data.cardId;

  if (prevBtn) {
    if (levelCurrentCard === 0) prevBtn.classList.add("disabled");
    else prevBtn.classList.remove("disabled");
  }

  if (numTag) numTag.innerText = data.numberTag;

  if (headerTag) {
    if (data.headerBadge) {
      headerTag.className = data.headerBadge.className;
      headerTag.innerText = data.headerBadge.text;
      headerTag.style.color = data.headerBadge.color;
      headerTag.style.display = "inline-block";
    } else {
      headerTag.style.display = "none";
    }
  }

  questionEl.innerHTML = data.contentHtml;

  if (data.cardRef) {
    recordCardProgress(data.cardRef.id);
  }


  if (animate) {
    let flipClass = (direction === "prev") ? "flipping-prev" : "flipping";
    if (data.isSpecial) flipClass = "flipping-spin";

    cardEl.classList.add(flipClass);
    setTimeout(() => {
      cardEl.classList.remove(flipClass);
      isAnimatingCard = false;
    }, data.isSpecial ? 700 : 350);

    if (data.isSpecial) {
      setTimeout(() => {
        const modal = document.getElementById("card-modal");
        if (modal && modal.classList.contains("active")) {
          triggerSparkles();
        }
      }, 200);
    }
  } else {
    isAnimatingCard = false;
  }
}

function launchSpecialMechanic(cardIndex) {
  const card = sessionData?.levels?.[currentLevelKey]?.[cardIndex];
  if (!card) return;

  if (typeof MechanicsManager !== "undefined" && typeof MechanicsManager.launch === "function") {
    closeCardModal();
    MechanicsManager.launch(card);
  }
}

function nextCard() {
  if (isAnimatingCard) return;
  
  if (levelCurrentCard < 5) {
    isAnimatingCard = true;
    levelCurrentCard++;
    saveStageProgress(currentLevelKey, levelCurrentCard);
    renderCard(true, "next");
  } else {
    isAnimatingCard = true;
    const cardEl = document.getElementById("active-card");
    if (cardEl) {
      cardEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      cardEl.style.opacity = "0";
      cardEl.style.transform = "scale(0.94)";
    }

    setTimeout(() => {
      saveStageProgress(currentLevelKey, 0);
      closeCardModal();
      markStageCompleted();

      if (cardEl) {
        cardEl.style.opacity = "";
        cardEl.style.transform = "";
        cardEl.style.transition = "";
      }
      isAnimatingCard = false;
    }, 300);
  }
}

function prevCard() {
  if (isAnimatingCard || levelCurrentCard <= 0) return;
  isAnimatingCard = true;
  levelCurrentCard--;
  saveStageProgress(currentLevelKey, levelCurrentCard);
  renderCard(true, "prev");
}

function closeCardModal() {
  const cardModal = document.getElementById("card-modal");
  if (cardModal) cardModal.classList.remove("active");
}

function recordCardProgress(cardId) {
  if (levelCurrentCard === 0 || !cardId) return;

  const history = GameStorage.getHistory();
  if (!history.viewedCardIds.includes(cardId)) {
    history.viewedCardIds.push(cardId);
    history.totalCardsViewed = history.viewedCardIds.length;
    GameStorage.saveHistory(history);
    updateProgressBar();
  }
}

function markStageCompleted() {
  const currentIdx = LEVEL_KEYS.indexOf(currentLevelKey);

  if (currentIdx === highestUnlockedIdx && highestUnlockedIdx < 4) {
    highestUnlockedIdx++;
    GameStorage.saveHighestUnlocked(highestUnlockedIdx);
    updateNodeStatuses();
  }

  if (currentLevelKey === "bloom") {
    highestUnlockedIdx = 5;
    GameStorage.saveHighestUnlocked(5);
    updateNodeStatuses();

    const history = GameStorage.getHistory();
    const total = history.viewedCardIds ? history.viewedCardIds.length : (history.totalCardsViewed || 0);
    const reachedInfinity = localStorage.getItem("alfiria_endless_infinity_reached") === "true";

    if (reachedInfinity) {
      setTimeout(() => { startNewReplayRound(); }, 400);
    } else {
      setTimeout(() => { triggerBloomCompletion(total); }, 400);
    }
  }
}

function triggerBloomCompletion(total) {
  const modal = document.getElementById("island-completion-modal");
  const textEl = document.getElementById("completion-text");
  const actionsContainer = document.getElementById("completion-actions-container");
  const titleEl = modal ? modal.querySelector(".scroll-title") : null;

  if (!modal || !textEl) return;

  let isFinalMilestone = total >= 100;
  if (isFinalMilestone) {
    localStorage.setItem("alfiria_endless_infinity_reached", "true");
  }

  let title = "";
  let body = "";

  if (isFinalMilestone) {
    title = "You’ve reached full bloom 🌸";
    body = "You’ve made it through every chapter of Blossom Island, but there’s always room for another conversation";
  } else if (total >= 75) {  
    title = "You’re getting closer 🌸 ";
    body = "You’ve come a long way together, and there’s only one more chapter before the journey reaches its final bloom";
  } else if (total >= 50) {  
    title = "HALFWAY THROUGH 🌸";
    body = "You’re getting more comfortable, sharing more, and discovering sides of each other you may not have seen before";
  } else {
    title = "You’re just getting started 🌸";
    body = "The conversation is beginning to open up and there’s still plenty more to discover about each other";
  }

  if (titleEl) {
    titleEl.innerText = title;
    titleEl.className = "scroll-title completion-main-title";
    titleEl.style.marginBottom = "4px";
  }

  textEl.innerHTML = `<p class="completion-sub-desc" style="margin: 0; line-height: 1.35;">${body}</p>`;

  if (actionsContainer) {
    actionsContainer.innerHTML = `
      <button class="stone-btn" id="completion-continue-btn">
        ${isFinalMilestone ? "ENTER ENDLESS" : "CONTINUE"}
      </button>
      <button class="exit-btn" id="completion-exit-btn">
        EXIT
      </button>
    `;

        document.getElementById("completion-continue-btn").onclick = () => {
      modal.classList.remove("active");
      startNewReplayRound();
    };


    document.getElementById("completion-exit-btn").onclick = () => {
      startNewReplayRound();
      window.location.href = "index.html?from=game";
    };
  }

  

  modal.classList.add("active");
  createConfetti();
}

function startNewReplayRound() {
  const modal = document.getElementById("island-completion-modal");
  if (modal) modal.classList.remove("active");

  highestUnlockedIdx = 0;
  currentLevelKey = "dew";
  stageCardPointers = { dew: 0, sunny: 0, gentle: 0, sprouting: 0, bloom: 0 };

  GameStorage.saveHighestUnlocked(0);
  GameStorage.saveCurrentLevelKey("dew");
  GameStorage.saveStagePointers(stageCardPointers);
  GameStorage.clearActiveSession();

  const history = GameStorage.getHistory();
  sessionData = generateSessionCards(history);
  GameStorage.saveActiveSession(sessionData);
  GameStorage.saveHistory(sessionData.updatedHistory || history);

  updateNodeStatuses();
}

// ==========================================
// 6. PLAYERS & QUEUE
// ==========================================
function initPlayerQueue() {
  sessionPlayerQueue = [...window.playersList];
  for (let i = sessionPlayerQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sessionPlayerQueue[i], sessionPlayerQueue[j]] = [sessionPlayerQueue[j], sessionPlayerQueue[i]];
  }
}

function getNextFairPlayer() {
  if (!sessionPlayerQueue || sessionPlayerQueue.length === 0) {
    initPlayerQueue();
  }
  return sessionPlayerQueue.shift() || (window.playersList[0] || "Player");
}

function openPlayersModal(isMandatory = false) {
  const modal = document.getElementById("players-modal");
  if (!modal) return;
  modal.classList.add("active");

  const closeBtn = modal.querySelector(".modal-close-corner-btn");
  if (closeBtn) closeBtn.style.display = isMandatory ? "none" : "block";

  const err = document.getElementById("players-error-msg");
  if (err) err.innerText = "";

  const saved = GameStorage.getPlayers();
  if (saved && saved.length >= 3) {
    window.playersList = [...saved];
  } else if (!window.playersList || window.playersList.length < 3) {
    window.playersList = ["", "", ""];
  }

  renderPlayerInputs();
}

function closePlayersModal() {
  syncCurrentInputs();
  const validNames = (window.playersList || []).map(n => (n || "").trim()).filter(Boolean);

  if (validNames.length < 3) {
    const err = document.getElementById("players-error-msg");
    if (err) err.innerText = "Please fill in at least 3 names to begin.";
    return;
  }
  const modal = document.getElementById("players-modal");
  if (modal) modal.classList.remove("active");
}

function syncCurrentInputs() {
  const inputs = document.querySelectorAll(".player-input");
  inputs.forEach((input, i) => {
    if (i < window.playersList.length) {
      window.playersList[i] = input.value;
    }
  });
}

function renderPlayerInputs() {
  const container = document.getElementById("players-list-container");
  if (!container) return;

  container.innerHTML = "";
  window.playersList.forEach((name, idx) => {
    container.innerHTML += `
      <div class="player-row">
        <input 
          type="text" 
          class="player-input" 
          value="${name}" 
          placeholder="Player ${idx + 1}" 
          oninput="updatePlayerName(${idx}, this.value)">
      </div>
    `;
  });
}

function addPlayerField() {
  const err = document.getElementById("players-error-msg");
  syncCurrentInputs();

  if (window.playersList.length >= 6) {
    if (err) err.innerText = "Maximum limit reached";
    return;
  }

  if (err) err.innerText = "";
  window.playersList.push("");
  renderPlayerInputs();
}

function removePlayerField() {
  const err = document.getElementById("players-error-msg");
  syncCurrentInputs();

  if (window.playersList.length <= 3) {
    if (err) err.innerText = "Minimum 3 players required";
    return;
  }

  if (err) err.innerText = "";
  window.playersList.pop();
  renderPlayerInputs();
}

function updatePlayerName(idx, val) {
  window.playersList[idx] = val;
  const err = document.getElementById("players-error-msg");
  if (err) err.innerText = "";
}

function savePlayersAndContinue() {
  syncCurrentInputs();

  const rawNames = window.playersList.map(n => (n || "").trim());
  const validNames = rawNames.filter(Boolean);
  const err = document.getElementById("players-error-msg");

  if (validNames.length < 3) {
    if (err) err.innerText = "Please fill in at least 3 names.";
    return;
  }

  const uniqueNames = new Set(validNames);
  if (uniqueNames.size !== validNames.length) {
    if (err) err.innerText = "Each player must have a unique name";
    return;
  }

    window.playersList = validNames;
  GameStorage.savePlayers(validNames);
  initPlayerQueue();

  // فحص وتحديث كروت الجلسة الحالية بالأسماء الجديدة فوراً
  if (sessionData && sessionData.levels) {
    Object.values(sessionData.levels).forEach(stageCards => {
      if (Array.isArray(stageCards)) {
        stageCards.forEach(c => {
          if (c && c.assignedTargetPlayer && !validNames.includes(c.assignedTargetPlayer)) {
            c.assignedTargetPlayer = getNextFairPlayer();
            if (c.mechanicState) {
              c.mechanicState.targetPlayer = c.assignedTargetPlayer;
              delete c.mechanicState.selectedIntro;
            }
          }
        });
      }
    });
    GameStorage.saveActiveSession(sessionData);
  }

  // إعادة رسم الكرت الحالي إذا كان معروضاً على الشاشة لتحديث الاسم الجديد فوراً
  if (typeof renderCard === "function") {
    renderCard(false);
  }
  
  const modal = document.getElementById("players-modal");
  if (modal) modal.classList.remove("active");
  }

// ==========================================
// 7. MENU & NAVIGATION
// ==========================================
function toggleIslandMenu(e) {
  const evt = e || window.event;
  if (evt) {
    evt.stopPropagation();
    if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();
  }
  const menu = document.getElementById("island-menu-dropdown");
  if (menu) menu.classList.toggle("active");
}

function closeIslandMenu() {
  const menu = document.getElementById("island-menu-dropdown");
  if (menu) menu.classList.remove("active");
}

function confirmResetIsland() {
  closeIslandMenu();
  const modal = document.getElementById("reset-confirm-modal");
  if (modal) modal.classList.add("active");
}

function closeResetConfirm() {
  const modal = document.getElementById("reset-confirm-modal");
  if (modal) modal.classList.remove("active");
}

function resetIslandProgress() {
  GameStorage.clearAll();
  window.playersList = [];
  window.location.reload();
}

function returnToWorldMap() {
  if (typeof saveStageProgress === "function") {
    saveStageProgress(currentLevelKey, levelCurrentCard);
  }
  closeCardModal();
  closeIslandMenu();
  window.location.href = "index.html?from=game";
}

// ==========================================
// 8. VISUAL EFFECTS & TIKTOK-STYLE SHARE
// ==========================================
function triggerSparkles() {  
  const symbols = ["✨", "🌸", "⭐"];
  const screenWidth = window.innerWidth;  
  const screenHeight = window.innerHeight;  

  for (let i = 0; i < 35; i++) {  
    const sparkle = document.createElement('div');  
    sparkle.className = 'magic-sparkle';  
    sparkle.innerText = symbols[Math.floor(Math.random() * symbols.length)];  
      
    const startX = Math.random() * screenWidth;  
    const startY = Math.random() * screenHeight;  
    sparkle.style.left = `${startX}px`;  
    sparkle.style.top = `${startY}px`;  

    const angle = Math.random() * Math.PI * 2;  
    const distance = 30 + Math.random() * 50;  
    const tx = Math.cos(angle) * distance;  
    const ty = Math.sin(angle) * distance;  

    sparkle.style.setProperty('--tx', `${tx}px`);  
    sparkle.style.setProperty('--ty', `${ty}px`);  
    sparkle.style.color = '#fff3c2';  

    document.body.appendChild(sparkle);  
    setTimeout(() => sparkle.remove(), 1000);  
  }  
}

function createConfetti() {
  const container = document.getElementById("confetti-container");
  if (!container) return;
  container.innerHTML = "";

  const colors = ["#ff758c", "#e2c08d", "#ffffff", "#f2a6b6", "#d88a9e"];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = `${Math.random() * 100}%`;
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = `${Math.random() * 1.2}s`;
    container.appendChild(c);
    setTimeout(() => c.remove(), 2800);
  }
}

function showCopyToast(message = "Link Copied!") {
  let toast = document.getElementById("game-copy-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "game-copy-toast";
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.className = "toast-visible";

  if (window.toastTimer) clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.className = "";
  }, 1400);
}

function fallbackCopy() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText("https://alfiria.pages.dev/");
  }
  showCopyToast("Link Copied!");
}

// متغير الحماية ضد النقر المتكرر
let isShareCardInProgress = false;

async function shareCardImage() {
  if (isShareCardInProgress) return;
  isShareCardInProgress = true;

  try {
    const gameUrl = "https://alfiria.pages.dev/";
    const shareText = `Play Alfiria: Realm of Cards!\n${gameUrl}`;

    // 1. التقاط العنصر النشط حالياً أينما كان
    const predictModalEl = document.getElementById("predict-modal");
    const predictContentEl = document.getElementById("predict-content");
    const isPredictActive = predictModalEl && predictModalEl.classList.contains("active");

    let targetElement = null;
    if (isPredictActive) {
      targetElement = document.querySelector(".predict-modal-box") || predictContentEl?.closest('.modal-content') || predictModalEl.querySelector("div[style*='background']") || predictContentEl;
    } else {
      targetElement = document.getElementById("active-card") || document.querySelector(".game-card");
    }

    if (!targetElement) {
      fallbackCopy();
      return;
    }

    // 2. إنشاء Canvas بمقاسات الستوري القياسية (1080x1920)
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 3. رسم خلفية خريطة الجزيرة الأصلية
    const mapImgSrc = "https://res.cloudinary.com/qc0aowwf/image/upload/f_auto,q_auto,w_1600/v1786495008/high_quality_2K_202608120102_1_1.jpg";
    const bgImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = mapImgSrc;
    });

    if (bgImg) {
      const imgRatio = bgImg.width / bgImg.height;
      const targetRatio = 1080 / 1920;
      let dw, dh, dx, dy;
      if (imgRatio > targetRatio) {
        dh = 1920;
        dw = 1920 * imgRatio;
        dx = (1080 - dw) / 2;
        dy = 0;
      } else {
        dw = 1080;
        dh = 1080 / imgRatio;
        dx = 0;
        dy = (1920 - dh) / 2;
      }
      ctx.drawImage(bgImg, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = "#1e131d";
      ctx.fillRect(0, 0, 1080, 1920);
    }

    // طبقة تغطية خفيفة لإبراز الكرت
    ctx.fillStyle = "rgba(15, 10, 16, 0.45)";
    ctx.fillRect(0, 0, 1080, 1920);

    // 4. التقاط لقطة شاشة عبر html2canvas
    const elementCanvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      onclone: (clonedDoc) => {
        // إزالة أزرار الإغلاق والمشاركة
        const closeBtns = clonedDoc.querySelectorAll('.card-header-btn, button[title="Share"], .modal-close-corner-btn');
        closeBtns.forEach(btn => btn.style.display = 'none');

        // إخفاء جميع العناوين (Special Card, The Question, Intro)
        const badgesToHide = clonedDoc.querySelectorAll('.special-card-badge, .predict-badge, .card-mechanic-badge');
        badgesToHide.forEach(badge => {
          badge.style.display = 'none';
        });

        // تحويل لون البطاقة إلى الكريمي المطلوب F4ECDD
        const cardBox = clonedDoc.querySelector('.game-card, .predict-modal-box, div[style*="background"]');
        if (cardBox) {
          cardBox.style.backgroundColor = "#F4ECDD";
        }
      }
    });

    // 5. توسيط البطاقة الملتقطة في منتصف الشاشة وبالمقاسات الصحيحة
    const cardW = 880;
    const cardH = (elementCanvas.height * cardW) / elementCanvas.width;
    const cardX = (1080 - cardW) / 2;
    const cardY = (1920 - cardH) / 2;

    // رسم ظل ناعم تحت البطاقة
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;
    ctx.drawImage(elementCanvas, cardX, cardY, cardW, cardH);
    ctx.restore();

    // 6. مشاركة الصورة النهائية باستخدام Promise آمن
    await new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          fallbackCopy();
          resolve();
          return;
        }

        const file = new File([blob], "alfiria-card.png", { type: "image/png" });

        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text: shareText });
          } else if (navigator.share) {
            await navigator.share({ title: "Alfiria - Realm of Cards", text: shareText, url: gameUrl });
          } else {
            fallbackCopy();
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            fallbackCopy();
          }
        }
        resolve();
      }, "image/png");
    });

  } catch (err) {
    fallbackCopy();
  } finally {
    // 🔥 ضمان مطلق لفك القفل فوراً مهما كانت النتيجة
    isShareCardInProgress = false;
  }
}

// ==========================================
// 9. GLOBAL LISTENERS
// ==========================================
document.addEventListener("click", (e) => {
  const menu = document.getElementById("island-menu-dropdown");
  const menuBtn = document.getElementById("island-menu-btn");
  if (menu && menu.classList.contains("active")) {
    if (!menu.contains(e.target) && (!menuBtn || !menuBtn.contains(e.target))) {
      menu.classList.remove("active");
    }
  }

  if (e.target.id === "level-intro-modal") closeLevelIntroModal();
  if (e.target.id === "reset-confirm-modal") closeResetConfirm();
});

window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("blossom-map-img")) {
    initBlossomIsland();
  }
});
