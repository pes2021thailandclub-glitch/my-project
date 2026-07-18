// DOM elements from index.html
const slider = document.getElementById("coinSlider");
const input = document.getElementById("coinInput");
const dashboardSummary = document.getElementById("dashboardSummary");
const compareGrid = document.getElementById("compareGrid");
const probabilityTableBody = document.getElementById("probabilityTableBody");
const openSingleBtn = document.getElementById("openSingleBtn");
const openTenBtn = document.getElementById("openTenBtn");
const resetOpeningBtn = document.getElementById("resetOpeningBtn");
const openingSummary = document.getElementById("openingSummary");
const openingStats = document.getElementById("openingStats");
const openingHistory = document.getElementById("openingHistory");
const standardGrid = document.getElementById("standardCardsGrid");
const simulationCountInput = document.getElementById("simulationCount");
const runSimulationBtn = document.getElementById("runSimulationBtn");
const simulationResults = document.getElementById("simulationResults");

// Modal elements
const packModal = document.getElementById("packModal");
const flashOverlay = document.getElementById("flashOverlay");
const packRevealContainer = document.getElementById("packRevealContainer");
const packCardElement = document.getElementById("packCardElement");
const revealedGrid = document.getElementById("revealedGrid");
const revealControls = document.getElementById("revealControls");
const claimBtn = document.getElementById("claimBtn");
const skipBtn = document.getElementById("skipBtn");

// Epic Cinematic elements
const epicCinematicOverlay = document.getElementById("epicCinematicOverlay");
const epicCinematicCardZoom = document.getElementById("epicCinematicCardZoom");
const epicTitleReveal = document.getElementById("epicTitleReveal");

// Sound elements
const soundToggleBtn = document.getElementById("soundToggleBtn");

// Constants
const totalPoolSize = 150;
const standardCardImageUrl = "https://www.konami.com/efootball/s/img/page/dreamteam/card_standard.jpg";

const epicCardsData = [
  { name: "Andres Iniesta", image: "https://efimg.com/efootballhub22/images/player_cards/89138288136169_l.png" },
  { name: "Gerard Pique", image: "https://efimg.com/efootballhub22/images/player_cards/88041460867519_l.png" },
  { name: "David Villa", image: "https://efimg.com/efootballhub22/images/player_cards/88044145220884_l.png" }
];

const highlightCardsData = [
  { name: "Alejandro Grimaldo", image: "https://efimg.com/efootballhub22/images/player_cards/105859132787394_l.png" },
  { name: "Unai Simon", image: "https://efimg.com/efootballhub22/images/player_cards/105859132793293_l.png" },
  { name: "Marc Cucurella", image: "https://efimg.com/efootballhub22/images/player_cards/105859132802911_l.png" },
  { name: "Pedro Porro", image: "https://efimg.com/efootballhub22/images/player_cards/105859132806164_l.png" },
  { name: "Martin Zubimendi", image: "https://efimg.com/efootballhub22/images/player_cards/105859132816538_l.png" },
  { name: "Alex Baena", image: "https://efimg.com/efootballhub22/images/player_cards/105859132821094_l.png" },
  { name: "Yeremy Pino", image: "https://efimg.com/efootballhub22/images/player_cards/105859132827344_l.png" },
  { name: "Gavi", image: "https://efimg.com/efootballhub22/images/player_cards/105859132833571_l.png" }
];

const standardCardsData = Array.from({ length: 139 }, (_, index) => ({
  name: `Standard Player ${index + 1}`,
  rarity: "standard",
  image: standardCardImageUrl
}));

// State variables
let openedCards = [];
let totalCoinsSpent = 0;
let openedCardKeys = new Set();
let remainingPackPool = [];
let currentDrawResult = [];
let flipTimeouts = [];
let currentCinematicCallback = null;
let isMuted = false;

// Web Audio API Sound Synthesizer - Stadium Atmosphere & Pack Reveal FX
const AudioSFX = {
  ctx: null,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // Helper to create an echo/delay chain (giving stadium acoustics)
  createStadiumEcho(source, delayTime = 0.25, feedbackGain = 0.45) {
    const ctx = this.ctx;
    const delayNode = ctx.createDelay(2.0);
    const feedback = ctx.createGain();
    
    delayNode.delayTime.value = delayTime;
    feedback.gain.value = feedbackGain;
    
    source.connect(delayNode);
    delayNode.connect(feedback);
    feedback.connect(delayNode);
    
    feedback.connect(ctx.destination);
  },

  playWhistle() {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.frequency.setValueAtTime(2000, now);
      osc2.frequency.setValueAtTime(2150, now);
      
      // Fast vibrato to mimic real whistle physics
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 35;
      lfoGain.gain.value = 25;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      lfo.start(now);
      osc1.start(now);
      osc2.start(now);
      
      lfo.stop(now + 0.4);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.warn("Whistle play failed", e);
    }
  },

  playCrowdRoar(duration = 3.0, volume = 0.25) {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      
      // Generate noise buffer
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      
      // Stadium Crowd Bandpass Filter (human vocal range)
      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.Q.value = 1.2;
      bpf.frequency.setValueAtTime(450, now);
      
      // Crowd excitation sweep
      bpf.frequency.linearRampToValueAtTime(650, now + duration * 0.4);
      bpf.frequency.exponentialRampToValueAtTime(350, now + duration);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      noiseSource.connect(bpf);
      bpf.connect(gain);
      gain.connect(ctx.destination);
      
      // Send crowd noise to stadium echo loop
      this.createStadiumEcho(gain, 0.3, 0.35);
      
      noiseSource.start(now);
    } catch (e) {
      console.warn("Crowd roar play failed", e);
    }
  },

  playRumble(duration = 1.0) {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.linearRampToValueAtTime(35, now + duration);
      
      const fm = ctx.createOscillator();
      const fmGain = ctx.createGain();
      fm.frequency.value = 22;
      fmGain.gain.value = 18;
      
      fm.connect(fmGain);
      fmGain.connect(osc.frequency);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Echo the pack rumble for massive stadium space
      this.createStadiumEcho(gain, 0.15, 0.25);
      
      osc.start(now);
      fm.start(now);
      
      osc.stop(now + duration);
      fm.stop(now + duration);
    } catch (e) {
      console.warn("Rumble play failed", e);
    }
  },

  playBurst(rarity = 'standard') {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      
      // Crowd cheers immediately on burst
      const roarVol = rarity === 'epic' ? 0.38 : rarity === 'highlight' ? 0.26 : 0.14;
      this.playCrowdRoar(rarity === 'epic' ? 4.5 : 2.5, roarVol);
      
      // 1. Noise impact
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(70, now + 1.3);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      this.createStadiumEcho(noiseGain, 0.28, 0.4);
      noise.start(now);
      
      // 2. Sub Drop
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(130, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 0.9);
      
      subGain.gain.setValueAtTime(0.6, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.95);
      
      // 3. Brass / Synth fanfares for epic/highlight
      if (rarity === 'epic') {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          
          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.setValueAtTime(300, now + idx * 0.08);
          f.frequency.exponentialRampToValueAtTime(2000, now + idx * 0.08 + 0.4);
          
          oscGain.gain.setValueAtTime(0, now);
          oscGain.gain.setValueAtTime(0.12, now + idx * 0.08);
          oscGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 2.0);
          
          osc.connect(f);
          f.connect(oscGain);
          oscGain.connect(ctx.destination);
          
          this.createStadiumEcho(oscGain, 0.25, 0.45);
          
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 2.25);
        });
      } else if (rarity === 'highlight') {
        const notes = [440.00, 554.37, 659.25, 880.00, 1108.73];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          oscGain.gain.setValueAtTime(0, now);
          oscGain.gain.setValueAtTime(0.18, now + idx * 0.06);
          oscGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 1.2);
          
          osc.connect(oscGain);
          oscGain.connect(ctx.destination);
          
          this.createStadiumEcho(oscGain, 0.2, 0.35);
          
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 1.3);
        });
      }
    } catch (e) {
      console.warn("Burst play failed", e);
    }
  },

  playFlip(rarity = 'standard') {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.14);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.15);
      
      if (rarity === 'epic') {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(880, now + 0.04);
        chime.frequency.linearRampToValueAtTime(1760, now + 0.28);
        
        chimeGain.gain.setValueAtTime(0, now);
        chimeGain.gain.setValueAtTime(0.22, now + 0.04);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        
        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        this.createStadiumEcho(chimeGain, 0.2, 0.3);
        
        chime.start(now + 0.04);
        chime.stop(now + 0.4);
      } else if (rarity === 'highlight') {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(659.25, now + 0.04);
        chime.frequency.linearRampToValueAtTime(1318.51, now + 0.22);
        
        chimeGain.gain.setValueAtTime(0, now);
        chimeGain.gain.setValueAtTime(0.16, now + 0.04);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        
        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        
        chime.start(now + 0.04);
        chime.stop(now + 0.3);
      }
    } catch (e) {
      console.warn("Flip play failed", e);
    }
  },

  playEpicCinematic() {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      
      // 1. Play massive stadium roar
      this.playCrowdRoar(5.0, 0.45);
      
      // 2. Announcer horn / gong sound with stadium reverb
      const frequencies = [110, 220, 275, 330, 440, 550, 660, 880];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.01, now + 3.0);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.14, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
        
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(1200, now);
        
        osc.connect(f);
        f.connect(gain);
        gain.connect(ctx.destination);
        
        this.createStadiumEcho(gain, 0.35, 0.5);
        
        osc.start(now + idx * 0.04);
        osc.stop(now + 3.1);
      });
    } catch (e) {
      console.warn("Epic cinematic play failed", e);
    }
  }
};

// Sound Muters State Load
const storedMute = localStorage.getItem("efootball_muted");
if (storedMute === "true") {
  isMuted = true;
  soundToggleBtn.innerHTML = "🔇 Sound: OFF";
  soundToggleBtn.style.color = "#94a3b8";
}

// Initialization of main catalog cards
function createCard(type, index, cardData, isOpened = false) {
  const badgeText = type === "epic" ? "Epic" : type === "highlight" ? "Highlight" : "Standard";
  
  const imageHtml = cardData.image
    ? `<img class="player-image" src="${cardData.image}" alt="${cardData.name}" onerror="this.style.display='none'; this.parentElement.classList.add('image-missing')">`
    : "";

  const cardId = type === "epic"
    ? `epic-${index}`
    : type === "highlight"
      ? `hl-${index}`
      : `standard-${index}`;

  const placeholderHtml = type === "standard" && !cardData.image
    ? `<div class="standard-placeholder">★</div>`
    : "";

  return `
    <div class="player-card ${type} ${isOpened ? "opened" : ""}" id="${cardId}">
      <div class="card-content">
        ${imageHtml}
        ${placeholderHtml}
        <div class="card-label">${cardData.name}</div>
        <div class="card-subtext">${badgeText}</div>
      </div>
      <div class="checkmark">✓</div>
    </div>
  `;
}

function initCards() {
  standardGrid.innerHTML = '';

  const combinedCards = [
    ...epicCardsData.map((card, index) => ({ type: "epic", index, cardData: card })),
    ...highlightCardsData.map((card, index) => ({ type: "highlight", index, cardData: card })),
    ...standardCardsData.map((card, index) => ({ type: "standard", index, cardData: card }))
  ];

  combinedCards.forEach((item) => {
    standardGrid.innerHTML += createCard(item.type, item.index, item.cardData);
  });
}

function createOpeningPool() {
  return shufflePool([
    ...epicCardsData.map((card, index) => ({ type: "epic", index, cardData: card, key: `epic-${index}` })),
    ...highlightCardsData.map((card, index) => ({ type: "highlight", index, cardData: card, key: `hl-${index}` })),
    ...standardCardsData.map((card, index) => ({ type: "standard", index, cardData: card, key: `standard-${index}` }))
  ]);
}

function resetOpeningState() {
  openedCards = [];
  totalCoinsSpent = 0;
  openedCardKeys = new Set();
  remainingPackPool = createOpeningPool();
  openingSummary.innerHTML = 'No cards opened yet<br><span class="opening-user">Opened by: You</span>';
  openingStats.textContent = `Coins spent: ${totalCoinsSpent.toLocaleString()}`;
  openingHistory.innerHTML = '';
  document.querySelectorAll('.player-card').forEach((card) => card.classList.remove('opened', 'active'));
  update();
}

function renderOpeningResults() {
  const epicCount = openedCards.filter((item) => item.type === "epic").length;
  const highlightCount = openedCards.filter((item) => item.type === "highlight").length;
  const standardCount = openedCards.filter((item) => item.type === "standard").length;
  const openedCount = openedCardKeys.size;
  const remainingCount = totalPoolSize - openedCount;

  openingSummary.innerHTML = `
    <strong>${openedCount} cards</strong> opened from a 150-card pool<br>
    <span class="opening-user">Opened by: You · Epic ${epicCount} · Highlight ${highlightCount} · Standard ${standardCount} · Remaining ${remainingCount} cards</span>
  `;

  openingHistory.innerHTML = openedCards
    .filter((item) => item.type === "epic" || item.type === "highlight")
    .map((item) => {
      const badgeClass = item.type === "epic" ? "epic" : "highlight";
      return `
        <div class="opening-history-item">
          <span class="history-badge ${badgeClass}">${item.type === "epic" ? "EPIC" : "Highlight"}</span>
          <span>${item.cardData.name}</span>
        </div>
      `;
    }).join("");

  document.querySelectorAll('.player-card').forEach((card) => card.classList.remove('opened'));

  openedCardKeys.forEach((cardId) => {
    const card = document.getElementById(cardId);
    if (card) card.classList.add('opened');
  });
}

function executeDraw(drawCount) {
  AudioSFX.init(); // Initialize audio context on click
  
  // Whistle blows right before pack transition reveals
  if (!isMuted) {
    AudioSFX.playWhistle();
  }
  
  const safeCount = Math.max(1, Math.min(10, drawCount));
  const availableCount = Math.min(safeCount, remainingPackPool.length);

  if (availableCount <= 0) {
    alert("Pack pool is empty! Please reset to open again.");
    return;
  }

  const coinsUsed = safeCount === 1 ? 100 : 900;
  totalCoinsSpent += coinsUsed;
  
  currentDrawResult = [];
  for (let i = 0; i < availableCount; i++) {
    const selectedCard = remainingPackPool.pop();
    if (!selectedCard) break;
    currentDrawResult.push(selectedCard);
    openedCardKeys.add(selectedCard.key);
  }

  openedCards = [...openedCards, ...currentDrawResult];
  openingStats.textContent = `Coins spent: ${totalCoinsSpent.toLocaleString()}`;
  
  triggerPackReveal(currentDrawResult);
}

// Cinematic Reveal Sequence
function triggerPackReveal(draws) {
  flipTimeouts.forEach(clearTimeout);
  flipTimeouts = [];

  packModal.classList.remove("hidden");
  flashOverlay.className = "flash-overlay";
  
  revealedGrid.style.display = "none";
  revealedGrid.innerHTML = "";
  revealControls.style.display = "none";
  epicCinematicOverlay.style.display = "none";
  epicCinematicCardZoom.className = "epic-cinematic-card-zoom";
  epicTitleReveal.classList.remove("visible");

  packRevealContainer.style.display = "flex";
  packCardElement.className = "pack-card-element";

  let highestRarity = "standard";
  if (draws.some(c => c.type === "epic")) {
    highestRarity = "epic";
  } else if (draws.some(c => c.type === "highlight")) {
    highestRarity = "highlight";
  }

  const packLabel = document.querySelector(".pack-label-text");
  if (highestRarity === "epic") {
    packCardElement.style.borderColor = "var(--color-epic-primary)";
    packCardElement.style.boxShadow = "0 0 35px var(--color-epic-glow)";
    packLabel.innerHTML = "Epic Legend Pack";
    packLabel.style.color = "#fbbf24";
  } else if (highestRarity === "highlight") {
    packCardElement.style.borderColor = "var(--color-hl-primary)";
    packCardElement.style.boxShadow = "0 0 25px var(--color-hl-glow)";
    packLabel.innerHTML = "Highlight Pack";
    packLabel.style.color = "#60a5fa";
  } else {
    packCardElement.style.borderColor = "rgba(255,255,255,0.15)";
    packCardElement.style.boxShadow = "0 15px 35px rgba(0,0,0,0.6)";
    packLabel.innerHTML = "Standard Pack";
    packLabel.style.color = "var(--text-main)";
  }

  packCardElement.onclick = () => animatePackOpening(draws, highestRarity);
}

function animatePackOpening(draws, highestRarity) {
  packCardElement.onclick = null; // Disable double clicking
  
  // 1. Rumble Shake SFX
  if (!isMuted) {
    AudioSFX.playRumble(1.0);
  }

  packCardElement.classList.add("shaking");
  
  setTimeout(() => {
    packCardElement.classList.remove("shaking");
    packCardElement.classList.add("opening-burst");
    
    // 2. Burst Explosion & Stadium Crowd Cheers
    if (!isMuted) {
      AudioSFX.playBurst(highestRarity);
    }

    setTimeout(() => {
      if (highestRarity === "epic") {
        flashOverlay.classList.add("epic-burst");
      } else if (highestRarity === "highlight") {
        flashOverlay.classList.add("hl-burst");
      } else {
        flashOverlay.classList.add("std-burst");
      }
      
      setTimeout(() => {
        packRevealContainer.style.display = "none";
        revealedGrid.style.display = "flex";
        revealControls.style.display = "flex";
        
        renderRevealGrid(draws);
      }, 300);
    }, 400);
  }, 1000);
}

function renderRevealGrid(draws) {
  revealedGrid.innerHTML = draws.map((card, i) => {
    const badgeText = card.type === "epic" ? "Epic" : card.type === "highlight" ? "Highlight" : "Standard";
    const imageHtml = card.cardData.image
      ? `<img class="player-image" src="${card.cardData.image}" alt="${card.cardData.name}" onerror="this.style.display='none'; this.parentElement.classList.add('image-missing')">`
      : "";
    const placeholderHtml = card.type === "standard" && !card.cardData.image
      ? `<div class="standard-placeholder">★</div>`
      : "";

    return `
      <div class="reveal-card-container ${card.type}" id="reveal-container-${i}">
        <div class="reveal-card-inner" id="reveal-inner-${i}">
          <div class="reveal-card-back">
            <span class="reveal-card-back-sigil">⚽</span>
          </div>
          <div class="reveal-card-front">
            <div class="player-card ${card.type} active" style="opacity:1; width:100%; height:100%; border-style:solid;">
              <div class="card-content">
                ${imageHtml}
                ${placeholderHtml}
                <div class="card-label">${card.cardData.name}</div>
                <div class="card-subtext" style="margin-top: 4px;">${badgeText}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Stagger entry
  draws.forEach((_, i) => {
    const tIn = setTimeout(() => {
      const container = document.getElementById(`reveal-container-${i}`);
      if (container) container.classList.add("animate-in");
    }, i * 150);
    flipTimeouts.push(tIn);
  });

  // Stagger flipping
  const startFlipDelay = draws.length * 150 + 300;
  let currentDelay = startFlipDelay;
  
  draws.forEach((card, i) => {
    const tFlip = setTimeout(() => {
      if (card.type === "epic") {
        pauseRevealAndShowEpic(card, () => {
          flipCardElement(i, card.type);
        });
      } else {
        flipCardElement(i, card.type);
      }
    }, currentDelay);
    
    flipTimeouts.push(tFlip);
    currentDelay += card.type === "epic" ? 3000 : 300;
  });
}

function flipCardElement(index, rarity) {
  const container = document.getElementById(`reveal-container-${index}`);
  if (container) {
    container.classList.add("flipped");
    if (!isMuted) {
      AudioSFX.playFlip(rarity);
    }
  }
}

function pauseRevealAndShowEpic(card, callback) {
  currentCinematicCallback = callback;
  
  // Epic Stadium Cinematic Choir and Crowds SFX
  if (!isMuted) {
    AudioSFX.playEpicCinematic();
  }

  epicCinematicOverlay.style.display = "flex";
  
  const imageHtml = card.cardData.image
    ? `<img class="player-image" src="${card.cardData.image}" alt="${card.cardData.name}" style="aspect-ratio: 1/1.4; border-radius: 12px;" onerror="this.style.display='none'; this.parentElement.classList.add('image-missing')">`
    : "";
  
  epicCinematicCardZoom.innerHTML = `
    <div class="player-card epic active" style="opacity: 1; border-style: solid; width: 100%; height: 100%; box-sizing: border-box; padding: 12px;">
      <div class="card-content">
        ${imageHtml}
        <div class="card-label" style="font-size: 14px; margin-top: 10px;">${card.cardData.name}</div>
        <div class="card-subtext" style="font-size: 10px; color: #fbbf24; margin-top: 6px;">EPIC LEGEND</div>
      </div>
    </div>
  `;

  setTimeout(() => {
    epicCinematicCardZoom.classList.add("reveal-zoom");
    setTimeout(() => {
      epicTitleReveal.classList.add("visible");
    }, 600);
  }, 100);

  epicCinematicOverlay.onclick = dismissEpicCinematic;
}

function dismissEpicCinematic() {
  epicCinematicOverlay.onclick = null;
  epicCinematicOverlay.style.display = "none";
  epicCinematicCardZoom.classList.remove("reveal-zoom");
  epicTitleReveal.classList.remove("visible");

  if (currentCinematicCallback) {
    currentCinematicCallback();
    currentCinematicCallback = null;
  }
}

function skipRevealSequence() {
  flipTimeouts.forEach(clearTimeout);
  flipTimeouts = [];
  
  dismissEpicCinematic();
  
  currentDrawResult.forEach((card, i) => {
    const container = document.getElementById(`reveal-container-${i}`);
    if (container) {
      container.classList.add("animate-in");
      container.classList.add("flipped");
    }
  });
}

function closeRevealModal() {
  packModal.classList.add("hidden");
  flipTimeouts.forEach(clearTimeout);
  flipTimeouts = [];
  dismissEpicCinematic();
  
  renderOpeningResults();
}

// Stats UI updates
function renderDashboard(result, draw) {
  dashboardSummary.innerHTML = `
    <div class="summary-card">
      <span class="summary-label">Draw count</span>
      <span class="summary-value">${draw} draws</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">Epic Chance</span>
      <span class="summary-value" style="color: #fbbf24">${result.epicChance.toFixed(2)}%</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">Highlight Chance</span>
      <span class="summary-value" style="color: #60a5fa">${result.hlChance.toFixed(2)}%</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">Expected Value</span>
      <span class="summary-value" style="font-size: 1.1rem; line-height: 1.4;">Epic: ${result.expectedEpic} <br> Highlight: ${result.expectedHl}</span>
    </div>
  `;
}

// Compare & Prob table render
function renderCompareMode(currentCoin) {
  const compareValues = [1000, 3000, 5000, 10000];

  compareGrid.innerHTML = compareValues.map((coinValue) => {
    const draw = Math.floor(coinValue / 100);
    const result = probability(draw);
    const isActive = coinValue === currentCoin;

    return `
      <div class="compare-card ${isActive ? "active" : ""}">
        <span class="compare-label">${coinValue.toLocaleString()} Coins</span>
        <span class="compare-value">${draw} draws</span>
        <div style="color: #fbbf24; font-weight: 700;">Epic: ${result.epicChance.toFixed(1)}%</div>
        <div style="color: #60a5fa; font-weight: 700;">Highlight: ${result.hlChance.toFixed(1)}%</div>
      </div>
    `;
  }).join("");
}

function renderProbabilityTable(currentCoin) {
  const tableValues = [1000, 2000, 3000, 5000, 10000, 15000];

  probabilityTableBody.innerHTML = tableValues.map((coinValue) => {
    const draw = Math.floor(coinValue / 100);
    const result = probability(draw);
    const isActive = coinValue === currentCoin;
    const epicPct = Math.min(100, result.epicChance);
    const hlPct = Math.min(100, result.hlChance);

    return `
      <tr class="${isActive ? "row-gold-highlight" : ""}">
        <td class="coin-col">${coinValue.toLocaleString()}</td>
        <td class="draw-col">${draw} draws</td>
        <td class="prob-col">
          <div class="progress-wrapper">
            <div class="progress-bar bar-gold" style="width: ${epicPct.toFixed(1)}%"></div>
            <span class="pct-text">${epicPct.toFixed(1)}%</span>
          </div>
        </td>
        <td class="prob-col">
          <div class="progress-wrapper">
            <div class="progress-bar bar-green" style="width: ${hlPct.toFixed(1)}%"></div>
            <span class="pct-text">${hlPct.toFixed(1)}%</span>
          </div>
        </td>
        <td class="draw-col" style="font-size: 0.85rem; font-weight: 600;">Epic ${result.expectedEpic} · HL ${result.expectedHl}</td>
      </tr>
    `;
  }).join("");
}

// Monte Carlo calculations
function createSimulationPool() {
  return Array.from({ length: 150 }, (_, index) => {
    if (index < 3) return "epic";
    if (index < 11) return "highlight";
    return "normal";
  });
}

function shufflePool(pool) {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function runSimulation(draws, iterations) {
  const safeDraws = Math.max(1, Math.min(150, draws));
  const safeIterations = Math.max(100, Math.min(10000, iterations));

  let epicAtLeastOne = 0;
  let hlAtLeastOne = 0;
  let epicTotal = 0;
  let hlTotal = 0;

  for (let i = 0; i < safeIterations; i++) {
    const drawn = shufflePool(createSimulationPool()).slice(0, safeDraws);
    const epicCount = drawn.filter((card) => card === "epic").length;
    const hlCount = drawn.filter((card) => card === "highlight").length;

    if (epicCount > 0) epicAtLeastOne += 1;
    if (hlCount > 0) hlAtLeastOne += 1;
    epicTotal += epicCount;
    hlTotal += hlCount;
  }

  return {
    iterations: safeIterations,
    epicChance: (epicAtLeastOne / safeIterations) * 100,
    hlChance: (hlAtLeastOne / safeIterations) * 100,
    avgEpic: epicTotal / safeIterations,
    avgHl: hlTotal / safeIterations
  };
}

function renderSimulation(draws) {
  const iterations = Number(simulationCountInput.value) || 1000;
  const result = runSimulation(draws, iterations);

  simulationResults.innerHTML = `
    <div class="simulation-result-card">
      <small>Epic (at least 1)</small>
      <strong>${result.epicChance.toFixed(1)}%</strong>
    </div>
    <div class="simulation-result-card">
      <small>Highlight (at least 1)</small>
      <strong>${result.hlChance.toFixed(1)}%</strong>
    </div>
    <div class="simulation-result-card">
      <small>Avg Epic per round</small>
      <strong>${result.avgEpic.toFixed(2)}</strong>
    </div>
    <div class="simulation-result-card">
      <small>Avg HL per round</small>
      <strong>${result.avgHl.toFixed(2)}</strong>
    </div>
  `;
}

// Event listeners
slider.addEventListener("input", update);
input.addEventListener("input", update);
openSingleBtn.addEventListener("click", () => executeDraw(1));
openTenBtn.addEventListener("click", () => executeDraw(10));
resetOpeningBtn.addEventListener("click", resetOpeningState);

claimBtn.addEventListener("click", closeRevealModal);
skipBtn.addEventListener("click", skipRevealSequence);

soundToggleBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  localStorage.setItem("efootball_muted", isMuted);
  
  if (!isMuted) {
    AudioSFX.init();
  }
  
  soundToggleBtn.innerHTML = isMuted ? "🔇 Sound: OFF" : "🔊 Sound: ON";
  soundToggleBtn.style.color = isMuted ? "#94a3b8" : "#fbbf24";
});

runSimulationBtn.addEventListener("click", () => {
  const draw = Math.floor(Number(input.value || slider.value) / 100);
  renderSimulation(draw);
});

function update() {
  let coin = Number(slider.value);

  if (this === input) {
    coin = Number(input.value);
    slider.value = coin;
  } else {
    input.value = coin;
  }

  const draw = Math.min(150, Math.floor(coin / 100));
  document.getElementById("drawCount").innerHTML = draw + " draws";

  const result = probability(draw);

  document.getElementById("epicChance").innerHTML = result.epicChance.toFixed(2) + "%";
  document.getElementById("hlChance").innerHTML = result.hlChance.toFixed(2) + "%";

  renderDashboard(result, draw);
  renderCompareMode(coin);
  renderProbabilityTable(coin);

  document.querySelectorAll('.player-card').forEach(card => card.classList.remove('active'));

  for (let i = 0; i < result.expectedEpic; i++) {
    const card = document.getElementById(`epic-${i}`);
    if (card) card.classList.add('active');
  }

  for (let i = 0; i < result.expectedHl; i++) {
    const card = document.getElementById(`hl-${i}`);
    if (card) card.classList.add('active');
  }
}

// Initial Run
initCards();
resetOpeningState();
update();
renderSimulation(Math.floor(Number(slider.value) / 100));
