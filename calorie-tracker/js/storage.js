// Thin wrapper around localStorage for all app data.
const STORAGE_KEYS = {
  foods: "ct_foods",
  meals: "ct_meals",          // { "YYYY-MM-DD": { "Breakfast/Lunch/Dinner": [{food, qty}], ... } }
  weights: "ct_weights",      // { "YYYY-MM-DD": number }
  measurements: "ct_measurements", // [{date, chest, bicepsL, bicepsR, hips, thighR, thighL, neck, forearmR, forearmL, wristR, wristL, shoulder, waist, pant, belly, weight, bfp}]
  height: "ct_height",        // number (cm or inches, user's choice, stored as string)
  targets: "ct_targets",      // { calorie, protein, carb, fatMin, fatMax, fiberMin, fiberMax }
  unitsMigrated: "ct_units_migrated_v1", // flag: meal qty values converted from old serving units to grams
  templateUnitsMigrated: "ct_template_units_migrated_v1", // flag: TEMPLATE_DATE qty values converted
  foodsVersion: "ct_foods_version", // tracks which version of DEFAULT_FOODS has been merged in
  jun12MovedToJun11: "ct_2026_06_12_moved_to_06_11_v1", // flag: 2026-06-12 entries moved to 2026-06-11
};

// One-time move of meals entered under 2026-06-12 to 2026-06-11 (they were meant for that day).
const MOVE_DATE_FROM = "2026-06-12";
const MOVE_DATE_TO = "2026-06-11";

// Bump this whenever DEFAULT_FOODS changes so existing users pick up the new values.
const FOODS_VERSION = 2;

const DEFAULT_TARGETS = {
  calorie: 2000,
  protein: 180,
  carb: 200,
  fatMin: 50,
  fatMax: 55,
  fiberMin: 25,
  fiberMax: 30,
};

const SECTIONS = ["Breakfast/Lunch/Dinner", "Snack 1", "Snack 2", "Snack 3", "Evening Snack"];

// Template day seeded from the user's "9 Jun" Excel sheet. Use the "Copy meals from" feature
// (copy from 2025-06-09) to reuse this as a starting point for other days.
const TEMPLATE_DATE = "2025-06-09";
const DEFAULT_MEALS = {
  [TEMPLATE_DATE]: {
    "Breakfast/Lunch/Dinner": [
      { food: "Egg", qty: 2 },
      { food: "Egg White", qty: 273 },
      { food: "Baked Walmart drumstick99", qty: 140 },
      { food: "Baked Beef15", qty: 65.01 },
      { food: "whole moong dal", qty: 80 },
      { food: "Rice", qty: 30 },
      { food: "Broccoli", qty: 30 },
      { food: "Palak", qty: 30 },
      { food: "Beans", qty: 30 },
      { food: "Onion", qty: 50 },
      { food: "Tomato", qty: 50 },
    ],
    "Snack 1": [
      { food: "nature own bread", qty: 60 },
    ],
    "Snack 2": [
      { food: "Almonds", qty: 3 },
      { food: "Walnut", qty: 3 },
      { food: "Dates", qty: 30 },
    ],
    "Snack 3": [
      { food: "Oats", qty: 40 },
      { food: "Whey Protein", qty: 1.1 },
      { food: "Milk", qty: 120 },
      { food: "Mango", qty: 150 },
    ],
    "Evening Snack": [
      { food: "Milk", qty: 199.99 },
      { food: "cow ghee", qty: 10 },
    ],
  },
};

// The TEMPLATE_DATE quantities as they were before the per-gram unit conversion (PR#8),
// keyed by food name. Used to detect whether a user's saved TEMPLATE_DATE entry still
// has the old serving-based quantities, so the migration can be applied exactly once
// regardless of when it ran relative to the main unit migration.
const OLD_TEMPLATE_QTY = {
  "Egg White": [5.9348],
  "Baked Walmart drumstick99": [0.2179],
  "Baked Beef15": [0.2121],
  "whole moong dal": [1.5385],
  "Rice": [0.6667],
  "Broccoli": [0.3],
  "Palak": [0.3529],
  "Beans": [0.3],
  "Onion": [0.5],
  "Tomato": [0.5],
  "nature own bread": [2.4],
  "Almonds": [0.1],
  "Walnut": [0.1],
  "Dates": [0.75],
  "Oats": [1],
  "Milk": [0.5, 0.8333],
  "Mango": [0.9091],
  "cow ghee": [0.6667],
};

// Maps food names to their old per-serving gram size, used once to migrate
// existing meal quantities from the old "servings" units to grams.
const OLD_SERVING_GRAMS = {
  "chicken drumstick": 112,
  "Atta": 30,
  "Masoor Red Dal": 42,
  "Toor Dal": 47,
  "Oil": 13.65,
  "Yogurt": 170,
  "Psyllium Husk": 5.6,
  "Sooji": 40,
  "Green split Moong Dal": 52,
  "Peanuts": 29,
  "Frozen Vegetables": 73,
  "Mango": 165,
  "Paneer": 28,
  "Tinda": 100,
  "Avacado": 201,
  "Bread": 26,
  "Milk": 240,
  "Chicken Breast": 112,
  "Chana Dal": 47,
  "Soya Granules": 25,
  "peas": 85,
  "Sugar": 8,
  "Cashews": 28,
  "Almonds": 30,
  "Raisins": 25,
  "Onion": 100,
  "Tomato": 100,
  "Garlic": 3,
  "Biryani Masala": 7,
  "Rice": 45,
  "Eggplant": 82,
  "Shrimp": 84,
  "Besan": 30,
  "kala chana besan": 30,
  "Potato": 100,
  "Greek Yogurt": 170,
  "Plum": 100,
  "Kefiar": 240,
  "Vermicelli": 15,
  "Chhole": 49,
  "Arbi": 132,
  "Sweet Potato": 100,
  "Oats": 40,
  "Kaddu": 245,
  "Poha": 45,
  "Makhana": 15,
  "Lauki": 100,
  "Rajma": 36,
  "Pineapple": 100,
  "Watermelon": 152,
  "Popcorn": 28,
  "Cucumber": 301,
  "Raddish1": 6,
  "Raddish": 100,
  "Bhindi": 100,
  "Palak": 85,
  "Kroger Chicken Breast": 112,
  "Peanut Butter": 32,
  "Dates": 40,
  "Banana": 100,
  "Kundru": 100,
  "Gud": 8,
  "Kala Chana": 48,
  "Coconut Milk": 85,
  "Beans": 100,
  "Zucchini": 223,
  "Karela": 100,
  "Almond Milk": 240,
  "Mashroom": 96,
  "Coconut Almond Milk": 240,
  "Coconut Yogurt": 170,
  "Pasta": 56,
  "Shimla Mirch": 100,
  "Pea Snack": 28,
  "Walmart chicken breast": 112,
  "Honey": 21,
  "Quinoa": 100,
  "Broccoli": 100,
  "Cottage Cheese": 113,
  "Mixed Nuts": 100,
  "Desi Dahi": 170,
  "Black Grapes": 138,
  "Salmon": 113,
  "Wheat Bread": 28,
  "Coconut Powder": 100,
  "Achaar": 15,
  "Veggie crisp": 28,
  "Tomato Sauce": 16,
  "Guar Phali": 100,
  "Ghee": 14,
  "Cooked Chicken Breast1": 172,
  "Cooked Chicken Breast": 100,
  "Egg White": 46,
  "Kroger Yogurt": 170,
  "Samosa": 15,
  "Whole grain Bread": 25,
  "Urad Dal": 49,
  "Chocolate cookie": 40,
  "Kirkland Ghee": 13,
  "Hippeas": 28,
  "Costco Dahi": 227,
  "Chocolate Chip": 15,
  "Lobia": 35,
  "Sattu": 100,
  "Cooked Kroger Drumstick": 100,
  "Mandarin": 88,
  "Kroger Greek Yogurt": 170,
  "Blueberry": 100,
  "Cauliflower": 100,
  "whole moong dal": 52,
  "Yellow moong dal": 51,
  "pista": 30,
  "Carrot": 78,
  "Mathri": 14,
  "Lal mirch achaar": 15,
  "juice": 8,
  "kroger greek yogurt vanilla": 170,
  "Methi": 100,
  "Gond": 25,
  "Maggi sauce": 32,
  "Anaar": 100,
  "Soya chunk": 15,
  "Bun": 39,
  "Dhuli Urad Dal": 47,
  "Whole Urad Dal": 49,
  "Kroger Whole Milk Yogurt": 170,
  "kroger lowfat yogurt vanilla": 170,
  "guava": 100,
  "Paneer Kulcha": 80,
  "Tandoori Garlic Naan": 80,
  "Gulab Jamun": 83,
  "Moong Dal Halwa": 70,
  "Whole Masoor dal": 45,
  "bell peppers": 100,
  "turnip": 130,
  "Apple": 182,
  "purple cabbage": 89,
  "Chicken Broth": 240,
  "Naval Orange": 100,
  "Dairy milk": 100,
  "Dark chocolate": 14,
  "cow ghee": 15,
  "chicken patties": 113,
  "Glaze": 46,
  "Ground chicken": 112,
  "Kerla mixture": 30,
  "Real Chhole": 45,
  "Cantaloupe": 100,
  "real soyachunk": 40,
  "Papaya": 100,
  "sweet potato chips": 28,
  "Kind dark choco": 20,
  "Kind cherry": 20,
  "Atta mg": 30,
  "Good Thins cracker": 38,
  "Raw mango": 100,
  "Cabot yogurt": 170,
  "walmart greek yogurt": 170,
  "coconut laddu": 43,
  "bansi soya chunk": 40,
  "laxmi lobia": 45,
  "imli": 40,
  "banana bread": 365,
  "chia seed": 24,
  "Daves Bread": 45,
  "Walnut": 30,
  "Brami Pasta": 56,
  "Cabot yogurt LF": 170,
  "nature own bread": 25,
  "chia seed costco": 30,
  "swad urad dal": 52,
  "swad masoor red dal": 48,
  "swad whole urad dal": 52,
  "swad toor dal": 51,
  "swad yellow moong dal": 52,
  "swad lobia": 42,
  "swad kala chana": 44,
  "roasted kala chana": 30,
  "sheep Cheese": 28,
  "Feta cheese": 28,
  "oats cake": 50,
  "Frozen Fruits": 140,
  "Mozz cheese": 30,
  "Homemade curd_1": 250,
  "Milk_1": 400,
  "Homemade curd": 170,
  "Murmura": 33,
  "Black raisin": 20,
  "HM Sauce": 5,
  "Cake": 264.5,
  "Amla Achaar": 10,
  "Mix dal": 56,
  "choco chip muffins": 99,
  "Aam Achaar": 5,
  "Mozzarella Low Moisture": 28,
  "cookie": 25,
  "Jalebi": 58,
  "Besan Ladoo": 36,
  "Beef93": 112,
  "Beef": 112,
  "Cooker Drumstick1": 100,
  "Walmart drumstick with skin": 112,
  "Walmart drumstick without skin": 112,
  "Kroger drumstick with skin": 112,
  "Kroger drumstick skinless": 112,
  "Raw kroger drumstick": 1785,
  "Baked kroger drumstick": 1174,
  "for 28th feb raw": 406,
  "Raw kroger drumstick1": 1312,
  "Baked kroger drumstick1": 915,
  "Raw kroger drumstick_1mar": 385,
  "Raw kroger drumstick2": 380,
  "Baked kroger drumstick2": 245.5,
  "Raw kroger drumstick3": 1558,
  "Baked kroger drumstick3": 1052,
  "Raw kroger drumstick4": 1235,
  "Baked kroger drumstick4": 862,
  "Raw kroger drumstick_8mar": 381,
  "Raw kroger drumstick5": 1885,
  "Baked kroger drumstick5": 1238,
  "Raw kroger drumstick6": 1184,
  "Baked kroger drumstick6": 760,
  "Raw kroger drumstick_15mar": 387.5,
  "Raw kroger drumstick7": 1924,
  "Baked kroger drumstick7": 1365,
  "Raw kroger drumstick8": 1371,
  "Raw kroger drumstick_22mar": 390,
  "Baked kroger drumstick8": 976.5,
  "Raw kroger drumstick9": 1765,
  "Baked kroger drumstick9": 1134,
  "Raw kroger drumstick10": 1399,
  "Baked kroger drumstick10": 972.5,
  "Raw kroger drumstick_29mar": 353.5,
  "Raw kroger drumstick11": 1767,
  "Baked kroger drumstick11": 1129,
  "Raw kroger drumstick12": 1634,
  "Baked kroger drumstick12": 1194,
  "Raw kroger drumstick_5Apr": 359,
  "Raw kroger drumstick13": 1724,
  "Baked kroger drumstick13": 1158,
  "Raw kroger drumstick14": 1623,
  "Baked kroger drumstick14": 1135,
  "Raw kroger drumstick_12Apr": 378,
  "Raw kroger drumstick15": 1746,
  "Baked kroger drumstick15": 1246,
  "Raw kroger drumstick16": 1869,
  "Baked kroger drumstick16": 1335,
  "Raw Kroger drumstick17": 2170,
  "Baked kroger drumstick17": 1539,
  "Raw Kroger drumstick18": 2387,
  "Baked kroger drumstick18": 1643,
  "Raw Kroger drumstick19": 1637,
  "Baked kroger drumstick19": 1186,
  "Raw Kroger drumstick20": 1485,
  "Baked kroger drumstick20": 1063,
  "Raw Kroger drumstick21Jun": 407,
  "Raw Kroger drumstick21": 1746,
  "Baked kroger drumstick21": 1227,
  "Raw Kroger drumstick22": 1246,
  "Baked kroger drumstick22": 859.5,
  "Raw Kroger drumstick28Jun": 396,
  "Raw Kroger drumstick23": 2000,
  "Baked kroger drumstick23": 1326,
  "Raw Kroger drumstick24": 1338,
  "Baked kroger drumstick24": 935.5,
  "Raw Kroger drumstick5Jul": 365,
  "Raw Kroger drumstick25": 1813,
  "Baked kroger drumstick25": 1178,
  "Raw Kroger drumstick26": 1968,
  "Baked kroger drumstick26": 1325,
  "Raw Walmart drumstick27": 2237,
  "Baked walmarrt drumstick27": 1511.2,
  "Raw Walmart drumstick28": 2175,
  "Baked walmarrt drumstick28": 1483,
  "Raw Walmart drumstick29": 1807,
  "Baked walmarrt drumstick29": 1266,
  "Raw Walmart drumstick30": 1975,
  "Baked walmarrt drumstick30": 1300,
  "Raw Walmart drumstick31": 2083,
  "Baked walmarrt drumstick31": 1406,
  "Raw Walmart drumstick32": 1832,
  "Baked walmarrt drumstick32": 1305,
  "Raw Walmart drumstick33": 1591,
  "Baked walmarrt drumstick33": 1078,
  "Raw Walmart drumstick34": 367,
  "Raw Walmart drumstick35": 2062,
  "Baked walmarrt drumstick35": 1435,
  "Raw Walmart drumstick36": 2040,
  "Baked Walmart drumstick36": 1478,
  "Raw Walmart drumstick37": 2132,
  "Baked Walmart drumstick37": 1532,
  "Raw Walmart drumstick38": 2027,
  "Baked Walmart drumstick38": 1450,
  "Raw Walmart drumstick39": 1873,
  "Baked Walmart drumstick39": 1290,
  "Raw Walmart drumstick40": 2047,
  "Baked Walmart drumstick40": 1411,
  "Raw Walmart drumstick41": 1964,
  "Baked Walmart drumstick41": 1294,
  "Raw Walmart drumstick42": 2147,
  "Baked Walmart drumstick42": 1505,
  "Raw Walmart drumstick43": 2062,
  "Baked Walmart drumstick43": 1438,
  "Raw Walmart drumstick44": 1813,
  "Baked Walmart drumstick44": 1272,
  "Raw Walmart drumstick45": 2113,
  "Baked Walmart drumstick45": 1457,
  "Raw Walmart drumstick46": 2000,
  "Baked Walmart drumstick46": 1301,
  "Raw Walmart drumstick47": 1751,
  "Baked Walmart drumstick47": 1293,
  "Raw Walmart drumstick48": 1693,
  "Baked Walmart drumstick48": 1108,
  "Raw Walmart drumstick49": 1495,
  "Baked Walmart drumstick49": 1029,
  "Raw Walmart drumstick26Oct": 271.5,
  "Raw Walmart drumstick50": 1898,
  "Baked Walmart drumstick50": 1327,
  "Raw Walmart drumstick51": 1740,
  "Baked Walmart drumstick51": 1192,
  "Raw Beef1": 100,
  "Baked Beef1": 43,
  "Raw Walmart drumstick52": 1991,
  "Baked Walmart drumstick52": 1490,
  "Raw beef2": 218,
  "Baked Beef2": 117,
  "Raw Walmart drumstick53": 2124,
  "Baked Walmart drumstick53": 1519,
  "Raw Walmart drumstick54": 1703,
  "Baked Walmart drumstick54": 1188,
  "Raw Walmart drumstick55": 1782,
  "Baked Walmart drumstick55": 1283,
  "Raw Walmart drumstick56": 1727,
  "Baked Walmart drumstick56": 1268,
  "Raw Walmart drumstick57": 1967,
  "Baked Walmart drumstick57": 1349,
  "Milk_2": 300,
  "Homemade curd_2": 199,
  "Milk_3": 400,
  "Homemade curd_3": 130,
  "Milk_4": 550,
  "Homemade curd_4": 200,
  "Sarso sag": 310,
  "Raw Walmart drumstick58": 1588,
  "Baked Walmart drumstick58": 1086,
  "Raw Walmart drumstick_14dec": 1888,
  "Raw Walmart drumstick_20dec": 282,
  "Raw Walmart drumstick_21dec": 307,
  "Raw Walmart drumstick59": 1091,
  "Baked Walmart drumstick59": 757.5,
  "Raw Walmart drumstick60": 1596,
  "Baked Walmart drumstick60": 1147,
  "Raw Walmart drumstick61": 975.5,
  "Baked Walmart drumstick61": 663,
  "Raw Walmart drumstick62": 1826,
  "Baked Walmart drumstick62": 1258,
  "Raw Walmart drumstick_3Jan": 300,
  "Raw Walmart drumstick63": 1071,
  "Baked Walmart drumstick63": 683.5,
  "Raw Walmart drumstick64": 1850,
  "Baked Walmart drumstick64": 1329,
  "Raw Walmart drumstick65": 1187,
  "Baked Walmart drumstick65": 833.5,
  "Raw Walmart drumstick66": 1959,
  "Baked Walmart drumstick66": 1404,
  "Raw Walmart drumstick67": 886,
  "Baked Walmart drumstick67": 590.5,
  "Raw Walmart drumstick68": 1129,
  "Baked Walmart drumstick68": 771,
  "Raw Walmart drumstick69": 1357,
  "Baked Walmart drumstick69": 921,
  "Raw Walmart drumstick70": 741,
  "Baked Walmart drumstick70": 485,
  "Raw Walmart drumstick71": 1675,
  "Baked Walmart drumstick71": 1211,
  "Raw Walmart drumstick72": 1659,
  "Baked Walmart drumstick72": 1208,
  "Raw Walmart drumstick73": 899,
  "Baked Walmart drumstick73": 625.5,
  "Raw Walmart drumstick74": 277.5,
  "Raw Walmart drumstick75": 266.5,
  "Raw Walmart drumstick76": 265,
  "Baked Walmart drumstick76": 1297,
  "Beef_80_lean": 112,
  "Raw Beef3": 443.5,
  "Baked Beef3": 255,
  "Raw Walmart drumstick78": 1065,
  "Baked Walmart drumstick78": 740.5,
  "Raw Walmart drumstick77": 248,
  "Beef_93_lean": 112,
  "Raw Beef4": 442.5,
  "Baked Beef4": 274.5,
  "Beef_85_lean": 112,
  "Raw Walmart drumstic80": 915.5,
  "Baked Walmart drumstick80": 532.5,
  "Raw Walmart drumstick79": 821,
  "Baked Walmart drumstick79": 641.5,
  "Raw Beef5": 80,
  "Baked Beef5": 56.3,
  "Raw Beef6": 528.5,
  "Baked Beef6": 338,
  "Raw Walmart drumstick81": 823.5,
  "Baked Walmart drumstick81": 529,
  "Raw Walmart drumstick82": 943,
  "Baked Walmart drumstick82": 641.5,
  "Raw Beef7": 518.5,
  "Baked Beef7": 326.5,
  "Raw Walmart drumstick83": 810.5,
  "Baked Walmart drumstick83": 558.5,
  "Raw Walmart drumstick84": 405.5,
  "Baked Walmart drumstick84": 290,
  "Raw Walmart drumstick85": 434,
  "Raw Beef8": 518.5,
  "Baked Beef8": 306.5,
  "Raw Walmart drumstick86": 886,
  "Baked Walmart drumstick86": 612,
  "Raw Walmart drumstick87": 447,
  "Baked Walmart drumstick87": 327,
  "Raw Beef9": 438.5,
  "Baked Beef9": 278,
  "Raw Walmart drumstick88": 431.5,
  "Baked Walmart drumstick88": 317.5,
  "Raw Walmart drumstick89": 882,
  "Baked Walmart drumstick89": 652,
  "Raw Walmart drumstick90": 428.5,
  "Raw Walmart drumstick90_1": 416,
  "Baked Walmart drumstick90_1": 306,
  "Raw Beef10": 441,
  "Baked Beef10": 327,
  "Raw Walmart drumstick91": 1029,
  "Baked Walmart drumstick91": 735,
  "Raw Walmart drumstick92": 805,
  "Baked Walmart drumstick92": 529,
  "Raw Beef11": 436,
  "Baked Beef11": 270.5,
  "Raw Beef12": 450,
  "Baked Beef12": 322.5,
  "Raw Walmart drumstick93": 408,
  "Baked Walmart drumstick93": 295.5,
  "Raw Walmart drumstick95": 402,
  "Baked Walmart drumstick95": 274,
  "Raw Walmart drumstick94": 444.5,
  "Baked Walmart drumstick94": 331,
  "Raw Beef13": 434,
  "Baked Beef13": 270,
  "Raw Walmart drumstick96": 1340,
  "Baked Walmart drumstick96": 928.5,
  "Raw Walmart drumstick97": 1016,
  "Baked Walmart drumstick97": 658.5,
  "Raw Beef14": 450.5,
  "Baked Beef14": 295.5,
  "Raw Walmart drumstick98": 820,
  "Baked Walmart drumstick98": 550.6,
  "Raw Walmart drumstick99": 962,
  "Baked Walmart drumstick99": 642.5,
  "Raw Beef15": 449,
  "Baked Beef15": 306.5,
  "Raw Walmart drumstick100": 1750,
  "Raw Beef16": 439,
};

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
    const storedVersion = localStorage.getItem(STORAGE_KEYS.foodsVersion);
    let foods = loadJSON(STORAGE_KEYS.foods, DEFAULT_FOODS);
    if (storedVersion !== String(FOODS_VERSION)) {
      // Refresh built-in foods with the latest values, keeping any custom foods the user added.
      const defaultNames = new Set(DEFAULT_FOODS.map((f) => f.name));
      const customFoods = foods.filter((f) => !defaultNames.has(f.name));
      foods = [...DEFAULT_FOODS, ...customFoods];
      this.saveFoods(foods);
      localStorage.setItem(STORAGE_KEYS.foodsVersion, String(FOODS_VERSION));
    }
    return foods;
  },
  saveFoods(foods) {
    saveJSON(STORAGE_KEYS.foods, foods);
  },
  getMeals() {
    const isNewUser = localStorage.getItem(STORAGE_KEYS.meals) === null;
    const meals = loadJSON(STORAGE_KEYS.meals, DEFAULT_MEALS);
    const templateInjected = !meals[TEMPLATE_DATE];
    if (templateInjected) {
      meals[TEMPLATE_DATE] = DEFAULT_MEALS[TEMPLATE_DATE];
    }
    if (!isNewUser && !localStorage.getItem(STORAGE_KEYS.unitsMigrated)) {
      // Convert quantities for foods whose units changed from "Xg serving" to per-gram.
      Object.keys(meals).forEach((dateStr) => {
        if (dateStr === TEMPLATE_DATE && templateInjected) return; // freshly injected, already in grams
        Object.values(meals[dateStr]).forEach((rows) => {
          (rows || []).forEach((row) => {
            const grams = OLD_SERVING_GRAMS[row.food];
            if (grams) row.qty = Math.round(row.qty * grams * 100) / 100;
          });
        });
      });
    }
    if (!isNewUser && !templateInjected && !localStorage.getItem(STORAGE_KEYS.templateUnitsMigrated)) {
      // The earlier migration skipped TEMPLATE_DATE on the assumption it was always freshly
      // injected, but users with real data saved on that date never got converted. Only convert
      // rows whose quantity still matches the old serving-based template value, so this stays
      // idempotent whether or not the main migration above already converted this date.
      Object.values(meals[TEMPLATE_DATE]).forEach((rows) => {
        (rows || []).forEach((row) => {
          const grams = OLD_SERVING_GRAMS[row.food];
          const oldQtys = OLD_TEMPLATE_QTY[row.food];
          const isOldQty = oldQtys && oldQtys.some((q) => Math.abs(row.qty - q) < 0.0001);
          if (grams && isOldQty) row.qty = Math.round(row.qty * grams * 100) / 100;
        });
      });
    }
    if (!isNewUser && meals[MOVE_DATE_FROM] && !localStorage.getItem(STORAGE_KEYS.jun12MovedToJun11)) {
      meals[MOVE_DATE_TO] = meals[MOVE_DATE_TO] || {};
      SECTIONS.forEach((s) => {
        meals[MOVE_DATE_TO][s] = (meals[MOVE_DATE_TO][s] || []).concat(meals[MOVE_DATE_FROM][s] || []);
      });
      delete meals[MOVE_DATE_FROM];
    }
    this.saveMeals(meals);
    localStorage.setItem(STORAGE_KEYS.unitsMigrated, "1");
    localStorage.setItem(STORAGE_KEYS.templateUnitsMigrated, "1");
    localStorage.setItem(STORAGE_KEYS.jun12MovedToJun11, "1");
    return meals;
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
    // Migrate old separate Breakfast/Lunch/Dinner sections into the combined section.
    const old = ["Breakfast", "Lunch", "Dinner"];
    if (old.some((s) => meals[dateStr][s])) {
      meals[dateStr]["Breakfast/Lunch/Dinner"] = meals[dateStr]["Breakfast/Lunch/Dinner"] || [];
      old.forEach((s) => {
        if (meals[dateStr][s]) {
          meals[dateStr]["Breakfast/Lunch/Dinner"].push(...meals[dateStr][s]);
          delete meals[dateStr][s];
        }
      });
      this.saveMeals(meals);
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
