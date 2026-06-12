// ===================== Helpers =====================
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function fmt(n, decimals = 1) {
  if (n === null || n === undefined || isNaN(n)) return "0";
  return Number(n).toFixed(decimals).replace(/\.0$/, "");
}

function getFoodByName(name) {
  return Store.getFoods().find((f) => f.name === name);
}

function computeRowMacros(row) {
  const food = getFoodByName(row.food);
  const qty = Number(row.qty) || 0;
  if (!food) return { cal: 0, protein: 0, carb: 0, fat: 0, fiber: 0, sugar: 0 };
  return {
    cal: food.cal * qty,
    protein: food.protein * qty,
    carb: food.carb * qty,
    fat: food.fat * qty,
    fiber: food.fiber * qty,
    sugar: food.sugar * qty,
  };
}

function computeDayTotals(dayMeals) {
  const totals = { cal: 0, protein: 0, carb: 0, fat: 0, fiber: 0, sugar: 0 };
  SECTIONS.forEach((section) => {
    (dayMeals[section] || []).forEach((row) => {
      const m = computeRowMacros(row);
      totals.cal += m.cal;
      totals.protein += m.protein;
      totals.carb += m.carb;
      totals.fat += m.fat;
      totals.fiber += m.fiber;
      totals.sugar += m.sugar;
    });
  });
  return totals;
}

function computeSectionTotals(rows) {
  const totals = { cal: 0, protein: 0, carb: 0, fat: 0, fiber: 0 };
  rows.forEach((row) => {
    const m = computeRowMacros(row);
    totals.cal += m.cal;
    totals.protein += m.protein;
    totals.carb += m.carb;
    totals.fat += m.fat;
    totals.fiber += m.fiber;
  });
  return totals;
}

// ===================== Tabs =====================
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
      if (btn.dataset.tab === "summary") renderSummary();
      if (btn.dataset.tab === "health") renderHealth();
      if (btn.dataset.tab === "foods") renderFoods();
    });
  });
}

// ===================== Meal Builder =====================
let currentDate = todayStr();

function initMealBuilder() {
  const dateInput = document.getElementById("meal-date");
  dateInput.value = currentDate;
  dateInput.addEventListener("change", () => {
    currentDate = dateInput.value || todayStr();
    updateCopyDateDefault();
    renderMealBuilder();
  });

  updateCopyDateDefault();

  document.getElementById("copy-meals-btn").addEventListener("click", () => {
    copyMealsFrom(document.getElementById("copy-date").value);
  });

  document.getElementById("copy-weekend-btn").addEventListener("click", () => {
    copyMealsFrom(mostRecentSundayStr());
  });

  renderLast7DaysQuickPicks();
  renderCopyWeekendBtn();
  renderTargetsReadout();
  renderMealBuilder();
}

// Copies the meals from `copyDate` onto `currentDate`, overwriting any existing entries.
function copyMealsFrom(copyDate) {
  if (!copyDate) return;
  if (copyDate === currentDate) {
    alert("Pick a different date to copy from.");
    return;
  }
  const sourceMeals = Store.getDayMeals(copyDate);
  const hasItems = SECTIONS.some((s) => sourceMeals[s].length > 0);
  if (!hasItems) {
    alert(`No meals found on ${copyDate}.`);
    return;
  }
  const targetMeals = Store.getDayMeals(currentDate);
  SECTIONS.forEach((s) => {
    targetMeals[s] = sourceMeals[s].map((row) => ({ food: row.food, qty: row.qty }));
  });
  Store.setDayMeals(currentDate, targetMeals);
  renderMealBuilder();
}

// Returns the date string (YYYY-MM-DD) of the most recent Sunday (today counts if it's Sunday).
function mostRecentSundayStr() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function renderCopyWeekendBtn() {
  const date = mostRecentSundayStr();
  const btn = document.getElementById("copy-weekend-btn");
  btn.textContent = `Copy from Weekend - (${date})`;
}

// Quick-pick buttons to set the "Copy meals from" date to one of the last 7 days.
function renderLast7DaysQuickPicks() {
  const container = document.getElementById("last-7-days");
  container.innerHTML = "";
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const btn = document.createElement("button");
    btn.className = "quick-date-btn";
    btn.textContent = dateStr;
    btn.addEventListener("click", () => {
      document.getElementById("copy-date").value = dateStr;
    });
    container.appendChild(btn);
  }
}

// Default the "copy from" date to yesterday.
function updateCopyDateDefault() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  document.getElementById("copy-date").value = d.toISOString().slice(0, 10);
}

function renderTargetsReadout() {
  const t = Store.getTargets();
  document.getElementById("targets-readout").textContent =
    `Target: ${t.calorie} kcal | Protein ${t.protein}g | Carb ${t.carb}g | Fat ${t.fatMin}-${t.fatMax}g | Fiber ${t.fiberMin}-${t.fiberMax}g`;
}

function renderMealBuilder() {
  const container = document.getElementById("sections-container");
  container.innerHTML = "";
  const dayMeals = Store.getDayMeals(currentDate);
  const foods = Store.getFoods();

  SECTIONS.forEach((section) => {
    const card = document.createElement("div");
    card.className = "section-card";

    const subtotal = computeSectionTotals(dayMeals[section]);
    card.innerHTML = `
      <h3>${section} <span class="section-subtotal">${fmt(subtotal.cal)} kcal | P ${fmt(subtotal.protein)} | C ${fmt(subtotal.carb)} | F ${fmt(subtotal.fat)} | Fib ${fmt(subtotal.fiber)}</span></h3>
      <table>
        <thead>
          <tr><th>Food</th><th>Quantity</th><th>Unit</th><th>Cal</th><th>Protein</th><th>Carb</th><th>Fat</th><th>Fiber</th><th></th></tr>
        </thead>
        <tbody></tbody>
      </table>
      <button class="add-row-btn">+ Add food</button>
    `;

    const tbody = card.querySelector("tbody");
    dayMeals[section].forEach((row, idx) => {
      tbody.appendChild(buildFoodRow(section, idx, row, foods));
    });

    card.querySelector(".add-row-btn").addEventListener("click", () => {
      const dm = Store.getDayMeals(currentDate);
      dm[section].push({ food: foods[0] ? foods[0].name : "", qty: 1 });
      Store.setDayMeals(currentDate, dm);
      renderMealBuilder();
    });

    container.appendChild(card);
  });

  renderDayTotals(dayMeals);
}

function buildFoodRow(section, idx, row, foods) {
  const tr = document.createElement("tr");
  tr.className = "food-row";

  const food = getFoodByName(row.food) || foods[0];
  const macros = computeRowMacros(row);

  const select = document.createElement("select");
  foods.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.name;
    opt.textContent = f.name;
    if (f.name === row.food) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => {
    const dm = Store.getDayMeals(currentDate);
    dm[section][idx].food = select.value;
    Store.setDayMeals(currentDate, dm);
    renderMealBuilder();
  });

  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.step = "any";
  qtyInput.value = row.qty || "";
  qtyInput.className = "qty-cell";
  qtyInput.addEventListener("input", () => {
    const dm = Store.getDayMeals(currentDate);
    dm[section][idx].qty = Number(qtyInput.value) || 0;
    Store.setDayMeals(currentDate, dm);
    // update only the macro cells + totals, avoid full re-render for smooth typing
    const updated = computeRowMacros(dm[section][idx]);
    tr.querySelector(".cal-cell").textContent = fmt(updated.cal);
    tr.querySelector(".protein-cell").textContent = fmt(updated.protein);
    tr.querySelector(".carb-cell").textContent = fmt(updated.carb);
    tr.querySelector(".fat-cell").textContent = fmt(updated.fat);
    tr.querySelector(".fiber-cell").textContent = fmt(updated.fiber);
    renderSectionSubtotalsAndTotals();
  });

  const tdFood = document.createElement("td");
  tdFood.appendChild(select);

  const tdQty = document.createElement("td");
  tdQty.appendChild(qtyInput);

  const tdUnit = document.createElement("td");
  tdUnit.className = "unit-cell";
  tdUnit.textContent = food ? food.unit : "";

  const tdCal = document.createElement("td");
  tdCal.className = "cal-cell";
  tdCal.textContent = fmt(macros.cal);

  const tdProtein = document.createElement("td");
  tdProtein.className = "protein-cell";
  tdProtein.textContent = fmt(macros.protein);

  const tdCarb = document.createElement("td");
  tdCarb.className = "carb-cell";
  tdCarb.textContent = fmt(macros.carb);

  const tdFat = document.createElement("td");
  tdFat.className = "fat-cell";
  tdFat.textContent = fmt(macros.fat);

  const tdFiber = document.createElement("td");
  tdFiber.className = "fiber-cell";
  tdFiber.textContent = fmt(macros.fiber);

  const tdRemove = document.createElement("td");
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "✕";
  removeBtn.title = "Remove";
  removeBtn.addEventListener("click", () => {
    const dm = Store.getDayMeals(currentDate);
    dm[section].splice(idx, 1);
    Store.setDayMeals(currentDate, dm);
    renderMealBuilder();
  });
  tdRemove.appendChild(removeBtn);

  tr.append(tdFood, tdQty, tdUnit, tdCal, tdProtein, tdCarb, tdFat, tdFiber, tdRemove);
  return tr;
}

// Lightweight refresh of subtotals/totals without rebuilding the whole DOM (used while typing qty)
function renderSectionSubtotalsAndTotals() {
  const dayMeals = Store.getDayMeals(currentDate);
  document.querySelectorAll(".section-card").forEach((card, i) => {
    const section = SECTIONS[i];
    const subtotal = computeSectionTotals(dayMeals[section]);
    card.querySelector(".section-subtotal").textContent =
      `${fmt(subtotal.cal)} kcal | P ${fmt(subtotal.protein)} | C ${fmt(subtotal.carb)} | F ${fmt(subtotal.fat)} | Fib ${fmt(subtotal.fiber)}`;
  });
  renderDayTotals(dayMeals);
}

function renderDayTotals(dayMeals) {
  const totals = computeDayTotals(dayMeals);
  const t = Store.getTargets();

  document.getElementById("tot-cal").textContent = fmt(totals.cal);
  document.getElementById("tot-protein").textContent = fmt(totals.protein);
  document.getElementById("tot-carb").textContent = fmt(totals.carb);
  document.getElementById("tot-fat").textContent = fmt(totals.fat);
  document.getElementById("tot-fiber").textContent = fmt(totals.fiber);

  document.getElementById("target-cal").textContent = t.calorie;
  document.getElementById("target-protein").textContent = t.protein;
  document.getElementById("target-carb").textContent = t.carb;
  document.getElementById("target-fat").textContent = `${t.fatMin}-${t.fatMax}`;
  document.getElementById("target-fiber").textContent = `${t.fiberMin}-${t.fiberMax}`;

  const barsContainer = document.getElementById("day-total-bars");
  barsContainer.innerHTML = "";
  barsContainer.appendChild(makeBar("Calories", totals.cal, 0, t.calorie, t.calorie));
  barsContainer.appendChild(makeBar("Protein", totals.protein, 0, t.protein, t.protein));
  barsContainer.appendChild(makeBar("Carb", totals.carb, 0, t.carb, t.carb));
  barsContainer.appendChild(makeBar("Fat", totals.fat, t.fatMin, t.fatMax, t.fatMax));
  barsContainer.appendChild(makeBar("Fiber", totals.fiber, t.fiberMin, t.fiberMax, t.fiberMax));
}

// Builds a labeled progress bar row. `min`/`max` define the "good" range; `scaleMax` is the bar's 100% point.
function makeBar(label, value, min, max, scaleMax) {
  const row = document.createElement("div");
  row.className = "macro-bar-row";

  const pct = Math.min(100, (value / scaleMax) * 100);
  const inRange = value >= min && value <= max;
  const over = value > max;

  let cls = "bar-fill";
  if (over) cls += " over";
  else if (inRange) cls += " in-range";

  row.innerHTML = `
    <span>${label}</span>
    <div class="bar-track"><div class="${cls}" style="width:${pct}%"></div></div>
    <span>${fmt(value)} / ${min === max ? max : `${min}-${max}`}</span>
  `;
  return row;
}

// ===================== 7-Day Summary =====================
function renderSummary() {
  const tbody = document.getElementById("summary-body");
  tbody.innerHTML = "";
  const t = Store.getTargets();
  const meals = Store.getMeals();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayMeals = meals[dateStr] || {};
    const totals = computeDayTotals(
      SECTIONS.reduce((acc, s) => ({ ...acc, [s]: dayMeals[s] || [] }), {})
    );

    const tr = document.createElement("tr");
    const calClass = totals.cal > t.calorie * 1.05 ? "over" : totals.cal > 0 ? "good" : "";
    const protClass = totals.protein >= t.protein ? "good" : "";
    const fatClass = totals.fat > t.fatMax ? "over" : (totals.fat >= t.fatMin && totals.fat > 0 ? "good" : "");
    const fiberClass = totals.fiber > t.fiberMax ? "over" : (totals.fiber >= t.fiberMin && totals.fiber > 0 ? "good" : "");

    tr.innerHTML = `
      <td>${dateStr}${dateStr === todayStr() ? " (today)" : ""}</td>
      <td class="${calClass}">${fmt(totals.cal)}</td>
      <td class="${protClass}">${fmt(totals.protein)}</td>
      <td>${fmt(totals.carb)}</td>
      <td class="${fatClass}">${fmt(totals.fat)}</td>
      <td class="${fiberClass}">${fmt(totals.fiber)}</td>
    `;
    tbody.appendChild(tr);
  }
}

// ===================== Health Data =====================
function renderHealth() {
  document.getElementById("height-input").value = Store.getHeight();

  document.getElementById("weight-date").value = todayStr();

  renderWeightTable();
  renderMeasurementsTable();
}

function renderWeightTable() {
  const weights = Store.getWeights();
  const tbody = document.getElementById("weight-body");
  tbody.innerHTML = "";
  Object.keys(weights)
    .sort((a, b) => (a < b ? 1 : -1))
    .forEach((date) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${date}</td><td>${weights[date]}</td><td><button class="delete-btn" data-date="${date}">✕</button></td>`;
      tr.querySelector(".delete-btn").addEventListener("click", () => {
        const w = Store.getWeights();
        delete w[date];
        Store.saveWeights(w);
        renderWeightTable();
      });
      tbody.appendChild(tr);
    });
}

const MEASUREMENT_FIELDS = [
  "date", "chest", "bicepsL", "bicepsR", "hips", "thighR", "thighL", "neck",
  "forearmR", "forearmL", "wristR", "wristL", "shoulder", "waist", "pant", "belly", "weight", "bfp",
];

function renderMeasurementsTable() {
  const list = Store.getMeasurements();
  const tbody = document.getElementById("measurements-body");
  tbody.innerHTML = "";
  list
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.date}</td>
        <td>${m.chest ?? ""}</td>
        <td>${m.bicepsL ?? ""}/${m.bicepsR ?? ""}</td>
        <td>${m.hips ?? ""}</td>
        <td>${m.thighR ?? ""}/${m.thighL ?? ""}</td>
        <td>${m.neck ?? ""}</td>
        <td>${m.forearmR ?? ""}/${m.forearmL ?? ""}</td>
        <td>${m.wristR ?? ""}/${m.wristL ?? ""}</td>
        <td>${m.shoulder ?? ""}</td>
        <td>${m.waist ?? ""}</td>
        <td>${m.pant ?? ""}</td>
        <td>${m.belly ?? ""}</td>
        <td>${m.weight ?? ""}</td>
        <td>${m.bfp ?? ""}</td>
        <td><button class="delete-btn" data-date="${m.date}">✕</button></td>
      `;
      tr.querySelector(".delete-btn").addEventListener("click", () => {
        const updated = Store.getMeasurements().filter((x) => x.date !== m.date);
        Store.saveMeasurements(updated);
        renderMeasurementsTable();
      });
      tbody.appendChild(tr);
    });
}

function initHealthForms() {
  document.getElementById("save-height-btn").addEventListener("click", () => {
    Store.saveHeight(document.getElementById("height-input").value.trim());
    alert("Height saved.");
  });

  document.getElementById("add-weight-btn").addEventListener("click", () => {
    const date = document.getElementById("weight-date").value;
    const value = document.getElementById("weight-input").value;
    if (!date || value === "") return;
    const weights = Store.getWeights();
    weights[date] = Number(value);
    Store.saveWeights(weights);
    document.getElementById("weight-input").value = "";
    renderWeightTable();
  });

  document.getElementById("add-measurement-btn").addEventListener("click", () => {
    const row = document.getElementById("measurement-form-row");
    const entry = {};
    MEASUREMENT_FIELDS.forEach((f) => {
      const input = row.querySelector(`[data-field="${f}"]`);
      const v = input.value;
      entry[f] = f === "date" ? v : (v === "" ? null : Number(v));
    });
    if (!entry.date) {
      alert("Please enter a date.");
      return;
    }
    const list = Store.getMeasurements().filter((m) => m.date !== entry.date);
    list.push(entry);
    Store.saveMeasurements(list);
    row.querySelectorAll("input").forEach((i) => (i.value = ""));
    renderMeasurementsTable();
  });
}

// ===================== Food Database =====================
function renderFoods() {
  const foods = Store.getFoods();
  const tbody = document.getElementById("food-body");
  tbody.innerHTML = "";
  foods.forEach((f, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${f.name}</td>
      <td>${f.unit}</td>
      <td>${f.cal}</td>
      <td>${f.protein}</td>
      <td>${f.carb}</td>
      <td>${f.fat}</td>
      <td>${f.fiber}</td>
      <td>${f.sugar}</td>
      <td><button class="delete-btn" data-idx="${idx}">✕</button></td>
    `;
    tr.querySelector(".delete-btn").addEventListener("click", () => {
      const updated = Store.getFoods().filter((_, i) => i !== idx);
      Store.saveFoods(updated);
      renderFoods();
    });
    tbody.appendChild(tr);
  });

  // targets form
  const t = Store.getTargets();
  document.getElementById("t-calorie").value = t.calorie;
  document.getElementById("t-protein").value = t.protein;
  document.getElementById("t-carb").value = t.carb;
  document.getElementById("t-fatmin").value = t.fatMin;
  document.getElementById("t-fatmax").value = t.fatMax;
  document.getElementById("t-fibermin").value = t.fiberMin;
  document.getElementById("t-fibermax").value = t.fiberMax;
}

function initFoodForms() {
  document.getElementById("add-food-btn").addEventListener("click", () => {
    const row = document.getElementById("food-form-row");
    const name = row.querySelector('[data-field="name"]').value.trim();
    if (!name) {
      alert("Please enter a food name.");
      return;
    }
    const food = { name, unit: row.querySelector('[data-field="unit"]').value.trim() || "gm" };
    ["cal", "protein", "carb", "fat", "fiber", "sugar"].forEach((f) => {
      const v = row.querySelector(`[data-field="${f}"]`).value;
      food[f] = v === "" ? 0 : Number(v);
    });
    const foods = Store.getFoods().filter((x) => x.name !== name);
    foods.push(food);
    Store.saveFoods(foods);
    row.querySelectorAll("input").forEach((i) => {
      if (i.dataset.field !== "unit") i.value = "";
    });
    renderFoods();
    renderMealBuilder();
  });

  document.getElementById("save-targets-btn").addEventListener("click", () => {
    const targets = {
      calorie: Number(document.getElementById("t-calorie").value) || 0,
      protein: Number(document.getElementById("t-protein").value) || 0,
      carb: Number(document.getElementById("t-carb").value) || 0,
      fatMin: Number(document.getElementById("t-fatmin").value) || 0,
      fatMax: Number(document.getElementById("t-fatmax").value) || 0,
      fiberMin: Number(document.getElementById("t-fibermin").value) || 0,
      fiberMax: Number(document.getElementById("t-fibermax").value) || 0,
    };
    Store.saveTargets(targets);
    renderTargetsReadout();
    renderMealBuilder();
    alert("Targets saved.");
  });
}

// ===================== Init =====================
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initMealBuilder();
  initHealthForms();
  initFoodForms();
});
