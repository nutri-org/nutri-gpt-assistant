
# API Endpoint Examples

## POST /api/chat

### Example 1: Meal Plan Strict Mode

Request a structured meal plan with nutritional data:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "meal_plan_strict",
    "userId": "user123",
    "messages": [
      {
        "role": "user", 
        "content": "Create a meal plan for muscle building"
      }
    ],
    "context": {
      "allergies": ["nuts", "shellfish"],
      "medications": [],
      "goal": "build muscle mass"
    }
  }'
```

Response:
```json
{
  "role": "assistant",
  "content": {
    "breakfast": [
      {
        "food": "Scrambled eggs with spinach",
        "calories": 320,
        "protein": 25,
        "carbs": 8,
        "fat": 22
      }
    ],
    "lunch": [
      {
        "food": "Grilled chicken breast with quinoa",
        "calories": 480,
        "protein": 45,
        "carbs": 35,
        "fat": 18
      }
    ],
    "dinner": [
      {
        "food": "Lean beef with sweet potato",
        "calories": 550,
        "protein": 42,
        "carbs": 40,
        "fat": 20
      }
    ],
    "snacks": [
      {
        "food": "Greek yogurt with berries",
        "calories": 180,
        "protein": 20,
        "carbs": 15,
        "fat": 6
      }
    ]
  }
}
```

### Example 2: Goal Motivation Mode

Request motivational guidance and support:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "goal_motivation",
    "userId": "user123", 
    "messages": [
      {
        "role": "user",
        "content": "I am struggling to stick to my diet plan"
      }
    ],
    "context": {
      "goal": "lose 20 pounds",
      "allergies": [],
      "medications": []
    }
  }'
```

Response:
```json
{
  "role": "assistant",
  "content": "I understand how challenging it can be to stay consistent! 💪 Remember that losing 20 pounds is absolutely achievable - you've already taken the hardest step by starting! Try focusing on one meal at a time instead of the entire day. Small victories add up to big results! 🌟 What specific part of your diet plan feels most challenging right now? Let's tackle it together! 🎯"
}
```

### Error Responses

#### Allergen Conflict (422)
```json
{
  "error": "ALLERGEN_CONFLICT", 
  "details": "Detected allergen: peanuts"
}
```

#### OpenAI API Error (500)
```json
{
  "error": "UPSTREAM_ERROR"
}
```
