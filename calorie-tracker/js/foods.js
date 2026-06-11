// Default food database, extracted from the user's Excel macro sheet.
// Each food's macro values are "per 1 unit" (see `unit`), so totals = value * quantity.
const DEFAULT_FOODS = [
  { name: "Egg",                      unit: "egg", cal: 70.0,   protein: 6.0,    carb: 0.0,    fat: 5.0,    fiber: 0.0,    sugar: 0.0 },
  { name: "Egg White",                unit: "gm", cal: 0.54348, protein: 0.1087, carb: 0.0,    fat: 0.0,    fiber: 0.0,    sugar: 0.0 },
  { name: "Baked walmart drumstick99",unit: "gm", cal: 1.63096, protein: 0.29411,carb: 0.0,    fat: 0.03636,fiber: 0.0,    sugar: 0.0 },
  { name: "Baked Beef15",             unit: "gm", cal: 2.22355, protein: 0.30083,carb: 0.0,    fat: 0.08894,fiber: 0.0,    sugar: 0.0 },
  { name: "Whole Moong Dal",          unit: "gm", cal: 3.46154, protein: 0.23077,carb: 0.61538,fat: 0.00962,fiber: 0.15385,sugar: 0.0 },
  { name: "Rice",                     unit: "gm", cal: 3.55556, protein: 0.08889,carb: 0.8,    fat: 0.0,    fiber: 0.02222,sugar: 0.0 },
  { name: "Broccoli",                 unit: "gm", cal: 0.38889, protein: 0.02556,carb: 0.06222,fat: 0.00333,fiber: 0.00333,sugar: 0.0 },
  { name: "Palak",                    unit: "gm", cal: 0.23529, protein: 0.02353,carb: 0.03529,fat: 0.0,    fiber: 0.02353,sugar: 0.0 },
  { name: "Beans",                    unit: "gm", cal: 0.31,    protein: 0.018,  carb: 0.07,   fat: 0.002,  fiber: 0.027,  sugar: 0.0 },
  { name: "Onion",                    unit: "gm", cal: 0.4,     protein: 0.011,  carb: 0.093,  fat: 0.001,  fiber: 0.017,  sugar: 0.0 },
  { name: "Tomato",                   unit: "gm", cal: 0.18,    protein: 0.009,  carb: 0.039,  fat: 0.002,  fiber: 0.012,  sugar: 0.0 },
  { name: "Nature Own Bread",         unit: "gm", cal: 2.4,     protein: 0.16,   carb: 0.44,   fat: 0.04,   fiber: 0.08,   sugar: 0.0 },
  { name: "Almonds",                  unit: "gm", cal: 5.66667, protein: 0.2,    carb: 0.2,    fat: 0.5,    fiber: 0.13333,sugar: 0.0 },
  { name: "Walnut",                   unit: "gm", cal: 6.66667, protein: 0.16667,carb: 0.13333,fat: 0.66667,fiber: 0.06667,sugar: 0.0 },
  { name: "Dates",                    unit: "gm", cal: 2.75,    protein: 0.025,  carb: 0.75,   fat: 0.0,    fiber: 0.075,  sugar: 0.0 },
  { name: "Oats",                     unit: "gm", cal: 3.75,    protein: 0.125,  carb: 0.675,  fat: 0.0625, fiber: 0.075,  sugar: 0.0 },
  { name: "Whey Protein",             unit: "scoop", cal: 120.0,protein: 24.0,  carb: 3.0,    fat: 1.5,    fiber: 0.0,    sugar: 1.0 },
  { name: "Milk",                     unit: "gm", cal: 0.66667, protein: 0.03333,carb: 0.05,   fat: 0.03333,fiber: 0.0,    sugar: 0.05 },
  { name: "Mango",                    unit: "gm", cal: 0.6,     protein: 0.00848,carb: 0.1497, fat: 0.00364,fiber: 0.01576,sugar: 0.0 },
  { name: "Cow Ghee",                 unit: "gm", cal: 9.33333, protein: 0.0,    carb: 0.0,    fat: 0.73333,fiber: 0.0,    sugar: 0.0 },
];
