import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TodayPlan, WeeklyPlan, MonthlyPlan, MealItem } from './mealPlannerService';

const COLORS = {
  deepPurple: '#1E1456',
  purple: '#7B2FA0',
  magenta: '#C41E7A',
  coral: '#F04E50',
  gold: '#F5B731',
  darkGold: '#D9A020',
  white: '#FFFFFF',
  cream: '#FFF9F0',
  darkText: '#1A1A2E',
  mutedText: '#6B7280',
  lightBg: '#F8F9FA',
  border: '#E5E7EB',
};

function getMealEmoji(type: string): string {
  switch (type) {
    case 'breakfast': return '☀️';
    case 'lunch': return '🍽️';
    case 'snack': return '🍿';
    case 'dinner': return '🌙';
    default: return '🍽️';
  }
}

function getMealGradient(type: string): string {
  switch (type) {
    case 'breakfast': return `linear-gradient(135deg, ${COLORS.gold}, #FDD85D)`;
    case 'lunch': return `linear-gradient(135deg, ${COLORS.deepPurple}, ${COLORS.purple})`;
    case 'snack': return `linear-gradient(135deg, ${COLORS.magenta}, ${COLORS.purple})`;
    case 'dinner': return `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.deepPurple})`;
    default: return `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.darkGold})`;
  }
}

function generateMealCardHTML(meal: MealItem, index: number): string {
  const gradient = getMealGradient(meal.type);
  const emoji = meal.emoji || getMealEmoji(meal.type);

  return `
    <div class="meal-card" style="animation-delay: ${index * 0.1}s">
      <div class="meal-header">
        <div class="meal-icon" style="background: ${gradient}">
          <span>${emoji}</span>
        </div>
        <div class="meal-info">
          <div class="meal-type">${meal.type.toUpperCase()}</div>
          <div class="meal-name">${meal.name}</div>
          ${meal.description ? `<div class="meal-desc">${meal.description}</div>` : ''}
        </div>
        <div class="meal-cal">
          <span class="cal-value">${meal.calories}</span>
          <span class="cal-unit">kcal</span>
        </div>
      </div>
      <div class="macro-row">
        <div class="macro-item protein">
          <span class="macro-value">${meal.protein}g</span>
          <span class="macro-label">Protein</span>
        </div>
        <div class="macro-item carbs">
          <span class="macro-value">${meal.carbs}g</span>
          <span class="macro-label">Carbs</span>
        </div>
        <div class="macro-item fat">
          <span class="macro-value">${meal.fat}g</span>
          <span class="macro-label">Fat</span>
        </div>
        ${meal.prepTime ? `
        <div class="macro-item prep">
          <span class="macro-value">${meal.prepTime}m</span>
          <span class="macro-label">Prep</span>
        </div>` : ''}
      </div>
      ${meal.ingredients && meal.ingredients.length > 0 ? `
      <div class="ingredients-section">
        <div class="ingredients-title">📝 Ingredients</div>
        <div class="ingredients-list">
          ${meal.ingredients.map(ing => `<span class="ingredient-tag">${ing}</span>`).join('')}
        </div>
      </div>` : ''}
      ${meal.tip ? `
      <div class="tip-box">
        <span>💡</span>
        <span>${meal.tip}</span>
      </div>` : ''}
    </div>
  `;
}

function generateNutritionChartHTML(plan: TodayPlan): string {
  const total = plan.totalProtein + plan.totalCarbs + plan.totalFat;
  const proteinPct = Math.round((plan.totalProtein / total) * 100);
  const carbsPct = Math.round((plan.totalCarbs / total) * 100);
  const fatPct = 100 - proteinPct - carbsPct;

  return `
    <div class="nutrition-chart">
      <div class="chart-title">📊 Nutrition Breakdown</div>
      <div class="chart-container">
        <div class="chart-bar-group">
          <div class="chart-bar">
            <div class="chart-fill protein-fill" style="width: ${proteinPct}%"></div>
          </div>
          <div class="chart-legend">
            <span class="legend-dot protein-dot"></span>
            <span>Protein ${plan.totalProtein}g (${proteinPct}%)</span>
          </div>
        </div>
        <div class="chart-bar-group">
          <div class="chart-bar">
            <div class="chart-fill carbs-fill" style="width: ${carbsPct}%"></div>
          </div>
          <div class="chart-legend">
            <span class="legend-dot carbs-dot"></span>
            <span>Carbs ${plan.totalCarbs}g (${carbsPct}%)</span>
          </div>
        </div>
        <div class="chart-bar-group">
          <div class="chart-bar">
            <div class="chart-fill fat-fill" style="width: ${fatPct}%"></div>
          </div>
          <div class="chart-legend">
            <span class="legend-dot fat-dot"></span>
            <span>Fat ${plan.totalFat}g (${fatPct}%)</span>
          </div>
        </div>
      </div>
      <div class="chart-summary">
        <div class="summary-item">
          <span class="summary-value">${plan.totalCalories}</span>
          <span class="summary-label">Total kcal</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-value">${plan.totalProtein}g</span>
          <span class="summary-label">Protein</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-value">${plan.totalCarbs}g</span>
          <span class="summary-label">Carbs</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-value">${plan.totalFat}g</span>
          <span class="summary-label">Fat</span>
        </div>
      </div>
    </div>
  `;
}

function generateGroceryListHTML(meals: MealItem[]): string {
  const allIngredients = new Set<string>();
  meals.forEach(meal => {
    (meal.ingredients || []).forEach(ing => allIngredients.add(ing));
  });

  if (allIngredients.size === 0) return '';

  const ingredientArray = Array.from(allIngredients).sort();

  return `
    <div class="grocery-section">
      <div class="grocery-title">🛒 Grocery List</div>
      <div class="grocery-subtitle">All ingredients from your meal plan</div>
      <div class="grocery-grid">
        ${ingredientArray.map(ing => `
          <div class="grocery-item">
            <span class="grocery-check">☐</span>
            <span class="grocery-name">${ing}</span>
          </div>
        `).join('')}
      </div>
      <div class="grocery-footer">
        <span>📦 ${ingredientArray.length} items total</span>
        <span>💡 Check items as you shop</span>
      </div>
    </div>
  `;
}

function getBaseStyles(): string {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: ${COLORS.darkText};
        background: ${COLORS.white};
        padding: 0;
        line-height: 1.5;
      }
      .page {
        padding: 40px;
        min-height: 100vh;
      }
      .header {
        background: linear-gradient(135deg, ${COLORS.deepPurple}, ${COLORS.purple}, ${COLORS.magenta});
        padding: 40px;
        border-radius: 20px;
        color: white;
        margin-bottom: 30px;
        position: relative;
        overflow: hidden;
      }
      .header::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 300px;
        height: 300px;
        background: rgba(255,255,255,0.05);
        border-radius: 50%;
      }
      .header-brand {
        font-size: 14px;
        font-weight: 600;
        opacity: 0.8;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .header-title {
        font-size: 32px;
        font-weight: 900;
        letter-spacing: -0.5px;
        margin-bottom: 6px;
      }
      .header-meta {
        font-size: 14px;
        opacity: 0.85;
      }
      .header-stats {
        display: flex;
        gap: 24px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid rgba(255,255,255,0.15);
      }
      .header-stat {
        text-align: center;
      }
      .header-stat-value {
        font-size: 24px;
        font-weight: 900;
        color: ${COLORS.gold};
      }
      .header-stat-label {
        font-size: 11px;
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .meal-card {
        background: ${COLORS.white};
        border: 1px solid ${COLORS.border};
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        page-break-inside: avoid;
      }
      .meal-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 14px;
      }
      .meal-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
      }
      .meal-info { flex: 1; }
      .meal-type {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1px;
        color: ${COLORS.mutedText};
      }
      .meal-name {
        font-size: 18px;
        font-weight: 800;
        color: ${COLORS.darkText};
        margin-top: 2px;
      }
      .meal-desc {
        font-size: 12px;
        color: ${COLORS.mutedText};
        margin-top: 3px;
        line-height: 1.4;
      }
      .meal-cal {
        text-align: center;
        flex-shrink: 0;
      }
      .cal-value {
        font-size: 22px;
        font-weight: 900;
        color: ${COLORS.gold};
        display: block;
      }
      .cal-unit {
        font-size: 10px;
        font-weight: 600;
        color: ${COLORS.darkGold};
      }
      
      .macro-row {
        display: flex;
        gap: 8px;
      }
      .macro-item {
        flex: 1;
        text-align: center;
        padding: 10px 8px;
        border-radius: 10px;
      }
      .macro-item.protein { background: rgba(123,47,160,0.06); }
      .macro-item.carbs { background: rgba(245,183,49,0.08); }
      .macro-item.fat { background: rgba(240,78,80,0.06); }
      .macro-item.prep { background: rgba(30,20,86,0.05); }
      .macro-value {
        font-size: 14px;
        font-weight: 800;
        display: block;
      }
      .macro-item.protein .macro-value { color: ${COLORS.purple}; }
      .macro-item.carbs .macro-value { color: ${COLORS.darkGold}; }
      .macro-item.fat .macro-value { color: ${COLORS.coral}; }
      .macro-item.prep .macro-value { color: ${COLORS.deepPurple}; }
      .macro-label {
        font-size: 9px;
        font-weight: 600;
        color: ${COLORS.mutedText};
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      
      .ingredients-section {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid ${COLORS.border};
      }
      .ingredients-title {
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .ingredients-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .ingredient-tag {
        background: ${COLORS.lightBg};
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        color: ${COLORS.mutedText};
      }
      .tip-box {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 12px;
        padding: 10px 14px;
        background: rgba(245,183,49,0.06);
        border: 1px solid rgba(245,183,49,0.15);
        border-radius: 10px;
        font-size: 12px;
        color: ${COLORS.mutedText};
      }
      
      .nutrition-chart {
        background: ${COLORS.white};
        border: 1px solid ${COLORS.border};
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        page-break-inside: avoid;
      }
      .chart-title {
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 16px;
      }
      .chart-container { margin-bottom: 20px; }
      .chart-bar-group { margin-bottom: 12px; }
      .chart-bar {
        height: 12px;
        background: ${COLORS.lightBg};
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 4px;
      }
      .chart-fill {
        height: 100%;
        border-radius: 6px;
        transition: width 0.5s ease;
      }
      .protein-fill { background: linear-gradient(90deg, ${COLORS.purple}, #9B4DCA); }
      .carbs-fill { background: linear-gradient(90deg, ${COLORS.gold}, #FDD85D); }
      .fat-fill { background: linear-gradient(90deg, ${COLORS.coral}, #FF7B7B); }
      .chart-legend {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: ${COLORS.mutedText};
      }
      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 4px;
      }
      .protein-dot { background: ${COLORS.purple}; }
      .carbs-dot { background: ${COLORS.gold}; }
      .fat-dot { background: ${COLORS.coral}; }
      .chart-summary {
        display: flex;
        justify-content: space-around;
        padding-top: 16px;
        border-top: 1px solid ${COLORS.border};
      }
      .summary-item { text-align: center; }
      .summary-value {
        font-size: 20px;
        font-weight: 900;
        color: ${COLORS.darkText};
        display: block;
      }
      .summary-label {
        font-size: 10px;
        font-weight: 600;
        color: ${COLORS.mutedText};
        text-transform: uppercase;
      }
      .summary-divider {
        width: 1px;
        background: ${COLORS.border};
        align-self: stretch;
      }
      
      .grocery-section {
        background: ${COLORS.white};
        border: 1px solid ${COLORS.border};
        border-radius: 16px;
        padding: 24px;
        margin-top: 24px;
        page-break-inside: avoid;
      }
      .grocery-title {
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 4px;
      }
      .grocery-subtitle {
        font-size: 12px;
        color: ${COLORS.mutedText};
        margin-bottom: 16px;
      }
      .grocery-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .grocery-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: ${COLORS.lightBg};
        border-radius: 8px;
      }
      .grocery-check {
        font-size: 14px;
        color: ${COLORS.mutedText};
      }
      .grocery-name {
        font-size: 12px;
        font-weight: 600;
        color: ${COLORS.darkText};
      }
      .grocery-footer {
        display: flex;
        justify-content: space-between;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid ${COLORS.border};
        font-size: 11px;
        color: ${COLORS.mutedText};
      }
      
      .footer {
        text-align: center;
        margin-top: 32px;
        padding-top: 20px;
        border-top: 1px solid ${COLORS.border};
        color: ${COLORS.mutedText};
        font-size: 11px;
      }
      .footer-brand {
        font-size: 14px;
        font-weight: 800;
        color: ${COLORS.gold};
        margin-bottom: 4px;
      }
    </style>
  `;
}

export function generateTodayPlanHTML(plan: TodayPlan, persons: number): string {
  const mealCards = plan.meals.map((meal, i) => generateMealCardHTML(meal, i)).join('');
  const nutritionChart = generateNutritionChartHTML(plan);
  const groceryList = generateGroceryListHTML(plan.meals);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${getBaseStyles()}
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="header-brand">🧞‍♂️ FOODGENIE AI</div>
          <div class="header-title">Daily Meal Plan</div>
          <div class="header-meta">📅 ${plan.date} &nbsp;|&nbsp; 👤 ${persons} person${persons > 1 ? 's' : ''}</div>
          <div class="header-stats">
            <div class="header-stat">
              <div class="header-stat-value">${plan.totalCalories}</div>
              <div class="header-stat-label">Total kcal</div>
            </div>
            <div class="header-stat">
              <div class="header-stat-value">${plan.totalProtein}g</div>
              <div class="header-stat-label">Protein</div>
            </div>
            <div class="header-stat">
              <div class="header-stat-value">${plan.totalCarbs}g</div>
              <div class="header-stat-label">Carbs</div>
            </div>
            <div class="header-stat">
              <div class="header-stat-value">${plan.totalFat}g</div>
              <div class="header-stat-label">Fat</div>
            </div>
            <div class="header-stat">
              <div class="header-stat-value">${plan.meals.length}</div>
              <div class="header-stat-label">Meals</div>
            </div>
          </div>
        </div>

        ${nutritionChart}
        
        ${mealCards}
        
        ${groceryList}

        <div class="footer">
          <div class="footer-brand">FoodGenie AI 🧞‍♂️</div>
          <div>Your personal AI-powered meal planning companion</div>
          <div style="margin-top: 4px;">Generated on ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateWeeklyPlanHTML(plan: WeeklyPlan, persons: number): string {
  const dayCards = plan.days.map((day, di) => {
    const mealRows = day.meals.map(m => `
      <tr>
        <td style="padding: 8px 12px; font-size: 12px;">${m.emoji || getMealEmoji(m.type)} ${m.type}</td>
        <td style="padding: 8px 12px; font-size: 12px; font-weight: 700;">${m.name}</td>
        <td style="padding: 8px 12px; font-size: 12px; color: ${COLORS.gold}; font-weight: 800;">${m.calories} kcal</td>
        <td style="padding: 8px 12px; font-size: 11px; color: ${COLORS.mutedText};">P:${m.protein}g C:${m.carbs}g F:${m.fat}g</td>
      </tr>
    `).join('');

    return `
      <div class="meal-card" style="page-break-inside: avoid;">
        <div class="meal-header" style="margin-bottom: 12px;">
          <div class="meal-icon" style="background: linear-gradient(135deg, ${COLORS.deepPurple}, ${COLORS.purple});">
            <span style="color: white; font-weight: 900; font-size: 14px;">${day.day.slice(0, 3)}</span>
          </div>
          <div class="meal-info">
            <div class="meal-name">${day.day}</div>
          </div>
          <div class="meal-cal">
            <span class="cal-value">${day.totalCalories}</span>
            <span class="cal-unit">kcal</span>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: ${COLORS.lightBg};">
              <th style="padding: 8px 12px; font-size: 10px; text-align: left; color: ${COLORS.mutedText}; text-transform: uppercase;">Meal</th>
              <th style="padding: 8px 12px; font-size: 10px; text-align: left; color: ${COLORS.mutedText}; text-transform: uppercase;">Dish</th>
              <th style="padding: 8px 12px; font-size: 10px; text-align: left; color: ${COLORS.mutedText}; text-transform: uppercase;">Calories</th>
              <th style="padding: 8px 12px; font-size: 10px; text-align: left; color: ${COLORS.mutedText}; text-transform: uppercase;">Macros</th>
            </tr>
          </thead>
          <tbody>${mealRows}</tbody>
        </table>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${getBaseStyles()}
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="header-brand">🧞‍♂️ FOODGENIE AI</div>
          <div class="header-title">Weekly Meal Plan</div>
          <div class="header-meta">📅 ${plan.weekStart} – ${plan.weekEnd} &nbsp;|&nbsp; 👤 ${persons} person${persons > 1 ? 's' : ''}</div>
          <div class="header-stats">
            <div class="header-stat">
              <div class="header-stat-value">${plan.avgDailyCalories}</div>
              <div class="header-stat-label">Avg kcal/day</div>
            </div>
            <div class="header-stat">
              <div class="header-stat-value">7</div>
              <div class="header-stat-label">Days</div>
            </div>
            <div class="header-stat">
              <div class="header-stat-value">${plan.days.reduce((s, d) => s + d.meals.length, 0)}</div>
              <div class="header-stat-label">Total Meals</div>
            </div>
          </div>
        </div>
        
        ${dayCards}

        <div class="footer">
          <div class="footer-brand">FoodGenie AI 🧞‍♂️</div>
          <div>Your personal AI-powered meal planning companion</div>
          <div style="margin-top: 4px;">Generated on ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateMonthlyPlanHTML(plan: MonthlyPlan, persons: number): string {
  const weekCards = plan.weeks.map((week, wi) => {
    const highlights = (week.highlights || []).map(h => `
      <div class="grocery-item">
        <span>${h.emoji || '🍽️'}</span>
        <span class="grocery-name">${h.name} (${h.day} ${h.mealType})</span>
      </div>
    `).join('');

    return `
      <div class="meal-card" style="page-break-inside: avoid;">
        <div class="meal-header" style="margin-bottom: 12px;">
          <div class="meal-icon" style="background: linear-gradient(135deg, ${COLORS.deepPurple}, ${COLORS.purple});">
            <span style="color: white; font-weight: 900; font-size: 12px;">W${week.weekNumber}</span>
          </div>
          <div class="meal-info">
            <div class="meal-name">${week.theme}</div>
            <div class="meal-desc">${week.nutritionFocus}</div>
          </div>
          <div class="meal-cal">
            <span class="cal-value">₹${(week.estimatedWeeklyCost / 1000).toFixed(1)}K</span>
            <span class="cal-unit">est. cost</span>
          </div>
        </div>
        <div class="macro-row">
          <div class="macro-item protein">
            <span class="macro-value">🔥 ${week.dailyCalorieTarget}</span>
            <span class="macro-label">kcal/day</span>
          </div>
          <div class="macro-item carbs">
            <span class="macro-value">₹${(week.estimatedWeeklyCost / 1000).toFixed(1)}K</span>
            <span class="macro-label">Weekly Cost</span>
          </div>
          <div class="macro-item fat">
            <span class="macro-value">${(week.highlights || []).length}</span>
            <span class="macro-label">Highlights</span>
          </div>
        </div>
        ${highlights ? `
        <div class="ingredients-section">
          <div class="ingredients-title">⭐ Week Highlights</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 8px;">
            ${highlights}
          </div>
        </div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${getBaseStyles()}
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="header-brand">🧞‍♂️ FOODGENIE AI</div>
          <div class="header-title">${plan.month} Meal Plan</div>
          <div class="header-meta">🗓️ Monthly Overview &nbsp;|&nbsp; 👤 ${persons} person${persons > 1 ? 's' : ''}</div>
          <div class="header-stats">
            <div class="header-stat">
              <div class="header-stat-value">${plan.avgDailyCalories}</div>
              <div class="header-stat-label">Avg kcal/day</div>
            </div>
            <div class="header-stat">
              <div class="header-stat-value">₹${(plan.totalEstimatedCost / 1000).toFixed(1)}K</div>
              <div class="header-stat-label">Est. Cost</div>
            </div>
            <div class="header-stat">
              <div class="header-stat-value">4</div>
              <div class="header-stat-label">Weeks</div>
            </div>
          </div>
        </div>
        
        ${weekCards}

        <div class="footer">
          <div class="footer-brand">FoodGenie AI 🧞‍♂️</div>
          <div>Your personal AI-powered meal planning companion</div>
          <div style="margin-top: 4px;">Generated on ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function exportMealPlanPDF(
  plan: TodayPlan | WeeklyPlan | MonthlyPlan | null,
  planType: 'today' | 'weekly' | 'monthly',
  persons: number,
): Promise<{ success: boolean; error?: string }> {
  if (!plan) return { success: false, error: 'No meal plan available to export' };

  try {
    let html = '';

    if (planType === 'today') {
      html = generateTodayPlanHTML(plan as TodayPlan, persons);
    } else if (planType === 'weekly') {
      html = generateWeeklyPlanHTML(plan as WeeklyPlan, persons);
    } else {
      html = generateMonthlyPlanHTML(plan as MonthlyPlan, persons);
    }

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `FoodGenie ${planType} Meal Plan`,
        UTI: 'com.adobe.pdf',
      });
      return { success: true };
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate PDF' };
  }
}
