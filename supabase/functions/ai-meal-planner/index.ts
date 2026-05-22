import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, preferences, message, history } = await req.json();

    let systemPrompt = '';
    let userMessage = '';

    if (action === 'generate_meal_plan') {
      const { diet, budgetMin, budgetMax, spiceLevel, healthGoal, cuisineBias, avoidTags, planType, persons } = preferences || {};
      const personCount = persons || 1;
      
      systemPrompt = `You are FoodGenie AI, an expert Indian meal planner and nutritionist. Generate meal plans based on user preferences.

RULES:
- Always respond in valid JSON format
- Include Indian meals primarily, with variety
- Each meal must include: name, calories (kcal), protein (g), carbs (g), fat (g), fiber (g)
- Include preparation time in minutes
- Budget values are in Indian Rupees (₹)
- Spice level: 1=Mild, 2=Medium, 3=Spicy, 4=Very Spicy, 5=Extra Hot
- Diet: veg=vegetarian only, egg=vegetarian+eggs, nonveg=all
- Generate realistic calorie counts for Indian food portions
- IMPORTANT: This meal plan is for ${personCount} person(s). Scale all ingredient quantities accordingly. Calorie/nutrition values should be PER PERSON.
- If cooking for multiple persons, mention serving size in descriptions (e.g. "Serves ${personCount}")

User Preferences:
- Diet: ${diet || 'veg'}
- Number of Persons: ${personCount}
- Budget: ₹${budgetMin || 100}-₹${budgetMax || 500} per meal per person
- Spice Level: ${spiceLevel || 2}/5
- Health Goal: ${healthGoal || 'balanced'}
- Preferred Cuisines: ${(cuisineBias || []).join(', ') || 'North Indian, South Indian'}
- Avoid: ${(avoidTags || []).join(', ') || 'none'}`;

      if (planType === 'today') {
        userMessage = `Generate today's complete meal plan with 4 meals: breakfast, lunch, snack, dinner.

Respond ONLY with this JSON structure:
{
  "date": "today's date in DD MMM YYYY format",
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "totalFiber": number,
  "meals": [
    {
      "type": "breakfast",
      "name": "meal name",
      "description": "brief description with key ingredients",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "prepTime": number,
      "emoji": "relevant food emoji",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "tip": "nutrition tip"
    }
  ]
}`;
      } else if (planType === 'weekly') {
        userMessage = `Generate a 7-day meal plan (Monday to Sunday) with 4 meals each day: breakfast, lunch, snack, dinner. Ensure variety across days.

Respond ONLY with this JSON structure:
{
  "weekStart": "start date",
  "weekEnd": "end date",
  "avgDailyCalories": number,
  "days": [
    {
      "day": "Monday",
      "totalCalories": number,
      "meals": [
        {
          "type": "breakfast",
          "name": "meal name",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "emoji": "emoji",
          "prepTime": number
        }
      ]
    }
  ]
}`;
      } else if (planType === 'monthly') {
        userMessage = `Generate a 4-week monthly meal plan overview. For each week, provide a theme and daily calorie target, plus 3 highlighted meals per week.

Respond ONLY with this JSON structure:
{
  "month": "current month name",
  "avgDailyCalories": number,
  "totalEstimatedCost": number,
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "week theme like High Protein Week",
      "dailyCalorieTarget": number,
      "estimatedWeeklyCost": number,
      "highlights": [
        {
          "day": "Monday",
          "mealType": "dinner",
          "name": "special meal name",
          "calories": number,
          "emoji": "emoji"
        }
      ],
      "nutritionFocus": "what this week focuses on"
    }
  ]
}`;
      }
    } else if (action === 'generate_cooking_steps') {
      const { mealName, mealType, ingredients, persons: stepPersons } = preferences || {};
      const personCount = stepPersons || 1;

      systemPrompt = `You are FoodGenie AI, an expert Indian chef. Generate detailed step-by-step cooking instructions.

RULES:
- Respond ONLY in valid JSON format
- Steps should be clear, concise, and beginner-friendly
- Include timing for each step
- Scale ingredient quantities for ${personCount} person(s)
- Include pro tips where relevant
- Keep steps between 5-10 for most dishes`;

      userMessage = `Generate detailed cooking steps for: ${mealName || 'Unknown dish'}
Meal type: ${mealType || 'lunch'}
Ingredients available: ${(ingredients || []).join(', ') || 'standard ingredients'}
Serving: ${personCount} person(s)

Respond ONLY with this JSON structure:
{
  "dishName": "${mealName}",
  "servings": ${personCount},
  "totalTime": "estimated total time",
  "difficulty": "Easy|Medium|Hard",
  "steps": [
    {
      "step": 1,
      "title": "short step title",
      "instruction": "detailed instruction",
      "duration": "2 min",
      "tip": "optional pro tip or null"
    }
  ],
  "chefTip": "one final pro tip for this dish"
}`;
    } else if (action === 'swap_meal') {
      const { mealName, mealType, calories, protein, carbs, fat, diet, spiceLevel, cuisineBias, persons: swapPersons } = preferences || {};
      const personCount = swapPersons || 1;

      systemPrompt = `You are FoodGenie AI, an expert Indian meal planner. Generate alternative meal options that match a similar nutritional profile.

RULES:
- Respond ONLY in valid JSON format
- Generate exactly 3 alternative meals
- Each alternative must be close to the target calories (within ±15%)
- Maintain similar macronutrient ratios
- Ensure variety - different dishes, not just variations
- Diet: ${diet || 'veg'} (veg=vegetarian, egg=vegetarian+eggs, nonveg=all)
- Spice level: ${spiceLevel || 2}/5
- Preferred cuisines: ${(cuisineBias || []).join(', ') || 'Indian'}
- Scale for ${personCount} person(s)`;

      userMessage = `Generate 3 alternative meals to replace: ${mealName || 'Unknown'}
Meal type: ${mealType || 'lunch'}
Target nutrition per person: ~${calories || 400} kcal, ~${protein || 15}g protein, ~${carbs || 50}g carbs, ~${fat || 12}g fat

Respond ONLY with this JSON structure:
{
  "alternatives": [
    {
      "name": "meal name",
      "description": "brief description",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "prepTime": number,
      "emoji": "food emoji",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "whySwap": "one-line reason why this is a good alternative"
    }
  ]
}`;
    } else if (action === 'chat') {
      systemPrompt = `You are FoodGenie AI, an expert Indian meal planner, nutritionist, and grocery budget advisor. Help users plan their meals and grocery budgets.

You can help with:
1. Planning daily, weekly, or monthly meals
2. Calculating grocery budgets for meal plans
3. Suggesting healthy alternatives
4. Providing nutrition information
5. Creating shopping lists with estimated costs in ₹
6. Meal prep tips and batch cooking advice

Always be friendly, use food emojis, and give practical Indian food advice. When providing grocery budgets, use Indian Rupee (₹) prices.
When users ask for meal plans, present them in a clear, organized format.
When calculating grocery budgets, break down by category (vegetables, grains, dairy, spices, etc.).

User preferences: ${JSON.stringify(preferences || {})}`;

      userMessage = message || 'Help me plan my meals';
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add chat history if available
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: userMessage });

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', errText);
      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
