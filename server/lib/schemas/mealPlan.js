
// MealPlan schema definition for strict mode validation
const MealPlanSchema = {
  type: "object",
  properties: {
    breakfast: {
      type: "array",
      items: {
        type: "object",
        properties: {
          food: { type: "string" },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" }
        },
        required: ["food", "calories", "protein", "carbs", "fat"]
      }
    },
    lunch: {
      type: "array",
      items: {
        type: "object",
        properties: {
          food: { type: "string" },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" }
        },
        required: ["food", "calories", "protein", "carbs", "fat"]
      }
    },
    dinner: {
      type: "array",
      items: {
        type: "object",
        properties: {
          food: { type: "string" },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" }
        },
        required: ["food", "calories", "protein", "carbs", "fat"]
      }
    },
    snacks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          food: { type: "string" },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" }
        },
        required: ["food", "calories", "protein", "carbs", "fat"]
      }
    }
  },
  required: ["breakfast", "lunch", "dinner", "snacks"]
};

function getMealPlanSchema() {
  return MealPlanSchema;
}

module.exports = {
  MealPlanSchema,
  getMealPlanSchema
};
