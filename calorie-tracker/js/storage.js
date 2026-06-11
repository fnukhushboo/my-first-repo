// Thin wrapper around localStorage for all app data.
const STORAGE_KEYS = {
  foods: "ct_foods",
  meals: "ct_meals",          // { "YYYY-MM-DD": { "Breakfast": [{food, qty}], ... } }
  weights: "ct_weights",      // { "YYYY-MM-DD": number }
  measurements: "ct_measurements", // [{date, chest, bicepsL, bicepsR, hips, thighR, thighL, neck, forearmR, forearmL, wristR, wristL, shoulder, waist, pant, belly, weight, bfp}]
  height: "ct_height",        // number (cm or inches, user's choice, stored as string)
  targets: "ct_targets",      // { calorie, protein, carb, fatMin, fatMax, fiberMin, fiberMax }
};

const DEFAULT_TARGETS = {
  calorie: 2000,
  protein: 180,
  carb: 200,
  fatMin: 50,
  fatMax: 55,
  fiberMin: 25,
  fiberMax: 30,
};

const SECTIONS = ["Breakfast", "Lunch", "Dinner", "Snack 1", "Snack 2", "Snack 3", "Evening Snack"];

// Seed measurement entry from the user's existing tracking sheet.
const DEFAULT_MEASUREMENTS = [
  {
    date: "2025-05-26", chest: 41, bicepsL: 15.5, bicepsR: 16, hips: 37,
    thighR: 22, thighL: 21, neck: 14.6, forearmR: 12, forearmL: 11.5,
    wristR: 7, wristL: 7, shoulder: 45.5, waist: 31.5, pant: 33.2,
    belly: 33.8, weight: 164.6, bfp: 19.23663342,
  },
];

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Failed to load", key, e);
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const Store = {
  getFoods() {
    return loadJSON(STORAGE_KEYS.foods, DEFAULT_FOODS);
  },
  saveFoods(foods) {
    saveJSON(STORAGE_KEYS.foods, foods);
  },
  getMeals() {
    return loadJSON(STORAGE_KEYS.meals, {});
  },
  saveMeals(meals) {
    saveJSON(STORAGE_KEYS.meals, meals);
  },
  getDayMeals(dateStr) {
    const meals = this.getMeals();
    if (!meals[dateStr]) {
      meals[dateStr] = {};
      SECTIONS.forEach((s) => (meals[dateStr][s] = []));
    }
    SECTIONS.forEach((s) => {
      if (!meals[dateStr][s]) meals[dateStr][s] = [];
    });
    return meals[dateStr];
  },
  setDayMeals(dateStr, dayMeals) {
    const meals = this.getMeals();
    meals[dateStr] = dayMeals;
    this.saveMeals(meals);
  },
  getWeights() {
    return loadJSON(STORAGE_KEYS.weights, {});
  },
  saveWeights(weights) {
    saveJSON(STORAGE_KEYS.weights, weights);
  },
  getMeasurements() {
    return loadJSON(STORAGE_KEYS.measurements, DEFAULT_MEASUREMENTS);
  },
  saveMeasurements(list) {
    saveJSON(STORAGE_KEYS.measurements, list);
  },
  getHeight() {
    const v = localStorage.getItem(STORAGE_KEYS.height);
    return v !== null ? v : "5' 7\"";
  },
  saveHeight(value) {
    localStorage.setItem(STORAGE_KEYS.height, value);
  },
  getTargets() {
    return loadJSON(STORAGE_KEYS.targets, DEFAULT_TARGETS);
  },
  saveTargets(targets) {
    saveJSON(STORAGE_KEYS.targets, targets);
  },
};
