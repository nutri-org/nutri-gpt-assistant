
function checkAllergenConflicts(content, allergies = [], medications = []) {
  if (!allergies.length && !medications.length) {
    return { safe: true };
  }

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const lowerContent = contentStr.toLowerCase();

  // Basic allergen checking
  for (const allergen of allergies) {
    if (lowerContent.includes(allergen.toLowerCase())) {
      return {
        safe: false,
        violation: 'ALLERGEN_CONFLICT',
        details: `Detected allergen: ${allergen}`
      };
    }
  }

  // Basic medication interaction checking (simplified for R2)
  const riskFoods = ['grapefruit', 'alcohol', 'caffeine'];
  if (medications.length > 0) {
    for (const food of riskFoods) {
      if (lowerContent.includes(food)) {
        return {
          safe: false,
          violation: 'ALLERGEN_CONFLICT',
          details: `Potential medication interaction with: ${food}`
        };
      }
    }
  }

  return { safe: true };
}

module.exports = { checkAllergenConflicts };
