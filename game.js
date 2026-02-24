const STORAGE_KEY = "rebirth-clicker-save-v1";
const TICK_MS = 100;

const initialState = {
  coins: 0,
  lifetimeCoins: 0,
  clickPower: 1,
  autoPower: 0,
  clickUpgradeLevel: 0,
  autoUpgradeLevel: 0,
  rebirthPoints: 0,
  rebirthCount: 0,
  rebirthRequirement: 1000,
};

const els = {
  coins: document.getElementById("coins"),
  coinsPerClick: document.getElementById("coinsPerClick"),
  coinsPerSecond: document.getElementById("coinsPerSecond"),
  lifetimeCoins: document.getElementById("lifetimeCoins"),
  clickUpgradeCost: document.getElementById("clickUpgradeCost"),
  autoUpgradeCost: document.getElementById("autoUpgradeCost"),
  rebirthPoints: document.getElementById("rebirthPoints"),
  multiplier: document.getElementById("multiplier"),
  pendingRebirthPoints: document.getElementById("pendingRebirthPoints"),
  rebirthRequirement: document.getElementById("rebirthRequirement"),
  clickButton: document.getElementById("clickButton"),
  buyClickUpgrade: document.getElementById("buyClickUpgrade"),
  buyAutoUpgrade: document.getElementById("buyAutoUpgrade"),
  rebirthButton: document.getElementById("rebirthButton"),
};

let state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...initialState };

  try {
    const parsed = JSON.parse(raw);
    return { ...initialState, ...parsed };
  } catch {
    return { ...initialState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function format(num) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(num);
}

function multiplier() {
  return 1 + state.rebirthPoints * 0.1;
}

function clickUpgradeCost() {
  return Math.floor(15 * Math.pow(1.45, state.clickUpgradeLevel));
}

function autoUpgradeCost() {
  return Math.floor(40 * Math.pow(1.55, state.autoUpgradeLevel));
}

function pendingRebirthPoints() {
  if (state.lifetimeCoins < state.rebirthRequirement) return 0;
  const ratio = state.lifetimeCoins / state.rebirthRequirement;
  return Math.floor(Math.pow(ratio, 0.9));
}

function gainCoins(baseAmount) {
  const gain = baseAmount * multiplier();
  state.coins += gain;
  state.lifetimeCoins += gain;
}

function canAfford(cost) {
  return state.coins >= cost;
}

function buyClickUpgrade() {
  const cost = clickUpgradeCost();
  if (!canAfford(cost)) return;
  state.coins -= cost;
  state.clickUpgradeLevel += 1;
  state.clickPower += 1;
  saveState();
  render();
}

function buyAutoUpgrade() {
  const cost = autoUpgradeCost();
  if (!canAfford(cost)) return;
  state.coins -= cost;
  state.autoUpgradeLevel += 1;
  state.autoPower += 1;
  saveState();
  render();
}

function rebirth() {
  const gained = pendingRebirthPoints();
  if (gained <= 0) return;

  state.rebirthPoints += gained;
  state.rebirthCount += 1;
  state.rebirthRequirement = Math.floor(state.rebirthRequirement * 2.2);

  state.coins = 0;
  state.lifetimeCoins = 0;
  state.clickPower = 1;
  state.autoPower = 0;
  state.clickUpgradeLevel = 0;
  state.autoUpgradeLevel = 0;

  saveState();
  render();
}

function render() {
  const clickCost = clickUpgradeCost();
  const autoCost = autoUpgradeCost();
  const pending = pendingRebirthPoints();

  els.coins.textContent = format(state.coins);
  els.coinsPerClick.textContent = format(state.clickPower * multiplier());
  els.coinsPerSecond.textContent = format(state.autoPower * multiplier());
  els.lifetimeCoins.textContent = format(state.lifetimeCoins);
  els.clickUpgradeCost.textContent = format(clickCost);
  els.autoUpgradeCost.textContent = format(autoCost);
  els.rebirthPoints.textContent = format(state.rebirthPoints);
  els.multiplier.textContent = multiplier().toFixed(2);
  els.pendingRebirthPoints.textContent = format(pending);
  els.rebirthRequirement.textContent = format(state.rebirthRequirement);

  els.buyClickUpgrade.disabled = !canAfford(clickCost);
  els.buyAutoUpgrade.disabled = !canAfford(autoCost);
  els.rebirthButton.disabled = pending <= 0;
}

els.clickButton.addEventListener("click", () => {
  gainCoins(state.clickPower);
  saveState();
  render();
});

els.buyClickUpgrade.addEventListener("click", buyClickUpgrade);
els.buyAutoUpgrade.addEventListener("click", buyAutoUpgrade);
els.rebirthButton.addEventListener("click", rebirth);

setInterval(() => {
  if (state.autoPower > 0) {
    gainCoins(state.autoPower * (TICK_MS / 1000));
    saveState();
    render();
  }
}, TICK_MS);

render();
