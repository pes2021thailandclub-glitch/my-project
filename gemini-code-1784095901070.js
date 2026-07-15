const slider = document.getElementById("coinSlider");
const input = document.getElementById("coinInput");
const epicGrid = document.getElementById("epicCardsGrid");
const hlGrid = document.getElementById("highlightCardsGrid");
const dashboardSummary = document.getElementById("dashboardSummary");
const compareGrid = document.getElementById("compareGrid");
const simulationCountInput = document.getElementById("simulationCount");
const runSimulationBtn = document.getElementById("runSimulationBtn");
const simulationResults = document.getElementById("simulationResults");

const epicCardsData = [
  { name: "Marcel Desailly", image: "https://efimg.com/efootballhub22/images/player_cards/89138288270047_l.png" },
  { name: "Patrick Vieira", image: "https://efimg.com/efootballhub22/images/player_cards/88044145348029_l.png" },
  { name: "Lilian Thuram", image: "https://efimg.com/efootballhub22/images/player_cards/88044145351392_l.png" }
];

const highlightCardsData = [
  { name: "Lucas Digne", image: "https://efimg.com/efootballhub22/images/player_cards/105858595860513_l.png" },
  { name: "Adrien Rabiot", image: "https://efimg.com/efootballhub22/images/player_cards/105858595862475_l.png" },
  { name: "Lucas Hernandez", image: "https://efimg.com/efootballhub22/images/player_cards/105858595920141_l.png" },
  { name: "Marcus Thuram", image: "https://efimg.com/efootballhub22/images/player_cards/105858595923493_l.png" },
  { name: "Jean-Philippe Mateta", image: "https://efimg.com/efootballhub22/images/player_cards/105858595930001_l.png" },
  { name: "Manu Kone", image: "https://efimg.com/efootballhub22/images/player_cards/105858595943762_l.png" },
  { name: "Maghnes Akliouche", image: "https://efimg.com/efootballhub22/images/player_cards/105858595963596_l.png" },
  { name: "Desire Doue", image: "https://efimg.com/efootballhub22/images/player_cards/105858595968352_l.png" }
];

function createCard(type, index, cardData) {
  const imageHtml = cardData.image
    ? `<img class="player-image" src="${cardData.image}" alt="${cardData.name}" onerror="this.style.display='none'; this.parentElement.classList.add('image-missing')">`
    : "";

  const cardId = type === "epic" ? `epic-${index}` : `hl-${index}`;

  return `
    <div class="player-card ${type}" id="${cardId}">
      <div class="card-content">
        ${imageHtml}
        <div class="card-label">${cardData.name}</div>
      </div>
      <div class="checkmark">✓</div>
    </div>
  `;
}

function initCards() {
  epicGrid.innerHTML = '';
  hlGrid.innerHTML = '';

  epicCardsData.forEach((card, index) => {
    epicGrid.innerHTML += createCard("epic", index, card);
  });

  highlightCardsData.forEach((card, index) => {
    hlGrid.innerHTML += createCard("highlight", index, card);
  });
}

function renderDashboard(result, draw) {
  dashboardSummary.innerHTML = `
    <div class="summary-card">
      <span class="summary-label">จำนวนการสุ่ม</span>
      <span class="summary-value">${draw} ครั้ง</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">Epic</span>
      <span class="summary-value">${result.epicChance.toFixed(2)}%</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">Highlight</span>
      <span class="summary-value">${result.hlChance.toFixed(2)}%</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">คาดว่าจะได้</span>
      <span class="summary-value">Epic ${result.expectedEpic} · HL ${result.expectedHl}</span>
    </div>
  `;
}

function renderCompareMode(currentCoin) {
  const compareValues = [1000, 3000, 5000, 10000];

  compareGrid.innerHTML = compareValues.map((coinValue) => {
    const draw = Math.floor(coinValue / 100);
    const result = probability(draw);
    const isActive = coinValue === currentCoin;

    return `
      <div class="compare-card ${isActive ? "active" : ""}">
        <span class="compare-label">${coinValue.toLocaleString()} โคอิ่น</span>
        <span class="compare-value">${draw} ครั้ง</span>
        <div>Epic ${result.epicChance.toFixed(1)}%</div>
        <div>HL ${result.hlChance.toFixed(1)}%</div>
      </div>
    `;
  }).join("");
}

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
      <small>Epic อย่างน้อย 1 ใบ</small>
      <strong>${result.epicChance.toFixed(1)}%</strong>
    </div>
    <div class="simulation-result-card">
      <small>Highlight อย่างน้อย 1 ใบ</small>
      <strong>${result.hlChance.toFixed(1)}%</strong>
    </div>
    <div class="simulation-result-card">
      <small>Epic เฉลี่ยต่อรอบ</small>
      <strong>${result.avgEpic.toFixed(2)}</strong>
    </div>
    <div class="simulation-result-card">
      <small>Highlight เฉลี่ยต่อรอบ</small>
      <strong>${result.avgHl.toFixed(2)}</strong>
    </div>
  `;
}

slider.addEventListener("input", update);
input.addEventListener("input", update);
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

  const draw = Math.floor(coin / 100);
  document.getElementById("drawCount").innerHTML = draw + " ครั้ง";

  const result = probability(draw);

  document.getElementById("epicChance").innerHTML = result.epicChance.toFixed(2) + "%";
  document.getElementById("hlChance").innerHTML = result.hlChance.toFixed(2) + "%";

  renderDashboard(result, draw);
  renderCompareMode(coin);

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

initCards();
update();
renderSimulation(Math.floor(Number(slider.value) / 100));