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
  const safeCount = Math.max(1, Math.min(10, drawCount));
  const availableCount = Math.min(safeCount, remainingPackPool.length);

  if (availableCount <= 0) {
    alert("Pack pool is empty! Please reset to open again.");
    return;
  }

  const coinsUsed = safeCount === 1 ? 100 : 900;
  totalCoinsSpent += coinsUsed;
  
  const currentDrawResult = [];
  for (let i = 0; i < availableCount; i++) {
    const selectedCard = remainingPackPool.pop();
    if (!selectedCard) break;
    currentDrawResult.push(selectedCard);
    openedCardKeys.add(selectedCard.key);
  }

  openedCards = [...openedCards, ...currentDrawResult];
  openingStats.textContent = `Coins spent: ${totalCoinsSpent.toLocaleString()}`;
  
  // Instantly render card results into collection
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
