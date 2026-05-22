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
  lightGold: '#FDD85D',
  white: '#FFFFFF',
  cream: '#FFFBF0',
  darkText: '#1A1A2E',
  mutedText: '#6B7280',
  lightBg: '#F8F5FF',
  border: '#E8E0F0',
  cardBg: '#FEFCFF',
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
    case 'breakfast': return `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.lightGold} 100%)`;
    case 'lunch': return `linear-gradient(135deg, ${COLORS.deepPurple} 0%, ${COLORS.purple} 100%)`;
    case 'snack': return `linear-gradient(135deg, ${COLORS.magenta} 0%, ${COLORS.purple} 100%)`;
    case 'dinner': return `linear-gradient(135deg, ${COLORS.purple} 0%, ${COLORS.deepPurple} 100%)`;
    default: return `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.darkGold} 100%)`;
  }
}

function getMealAccentColor(type: string): string {
  switch (type) {
    case 'breakfast': return COLORS.gold;
    case 'lunch': return COLORS.deepPurple;
    case 'snack': return COLORS.magenta;
    case 'dinner': return COLORS.purple;
    default: return COLORS.gold;
  }
}

function generateMealCardHTML(meal: MealItem, index: number): string {
  const gradient = getMealGradient(meal.type);
  const accent = getMealAccentColor(meal.type);
  const emoji = meal.emoji || getMealEmoji(meal.type);

  return `
    <div class="meal-card" style="border-left: 4px solid ${accent};">
      <div class="meal-header">
        <div class="meal-icon" style="background: ${gradient}">
          <span>${emoji}</span>
        </div>
        <div class="meal-info">
          <div class="meal-type" style="color: ${accent};">${meal.type.toUpperCase()}</div>
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
        <span class="tip-emoji">💡</span>
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
          <div class="chart-label-row">
            <span class="chart-label-name">💪 Protein</span>
            <span class="chart-label-value">${plan.totalProtein}g (${proteinPct}%)</span>
          </div>
          <div class="chart-bar">
            <div class="chart-fill protein-fill" style="width: ${proteinPct}%"></div>
          </div>
        </div>
        <div class="chart-bar-group">
          <div class="chart-label-row">
            <span class="chart-label-name">🌾 Carbs</span>
            <span class="chart-label-value">${plan.totalCarbs}g (${carbsPct}%)</span>
          </div>
          <div class="chart-bar">
            <div class="chart-fill carbs-fill" style="width: ${carbsPct}%"></div>
          </div>
        </div>
        <div class="chart-bar-group">
          <div class="chart-label-row">
            <span class="chart-label-name">🥑 Fat</span>
            <span class="chart-label-value">${plan.totalFat}g (${fatPct}%)</span>
          </div>
          <div class="chart-bar">
            <div class="chart-fill fat-fill" style="width: ${fatPct}%"></div>
          </div>
        </div>
      </div>
      <div class="chart-summary">
        <div class="summary-item">
          <span class="summary-icon">🔥</span>
          <span class="summary-value">${plan.totalCalories}</span>
          <span class="summary-label">Total kcal</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-icon">💪</span>
          <span class="summary-value">${plan.totalProtein}g</span>
          <span class="summary-label">Protein</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-icon">🌾</span>
          <span class="summary-value">${plan.totalCarbs}g</span>
          <span class="summary-label">Carbs</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-icon">🥑</span>
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
      <div class="grocery-header">
        <div class="grocery-title">🛒 Grocery List</div>
        <div class="grocery-badge">${ingredientArray.length} items</div>
      </div>
      <div class="grocery-subtitle">All ingredients from your meal plan — check items as you shop</div>
      <div class="grocery-grid">
        ${ingredientArray.map((ing, i) => `
          <div class="grocery-item" style="border-left: 3px solid ${i % 5 === 0 ? COLORS.gold : i % 5 === 1 ? COLORS.purple : i % 5 === 2 ? COLORS.magenta : i % 5 === 3 ? COLORS.coral : COLORS.deepPurple};">
            <span class="grocery-check">☐</span>
            <span class="grocery-name">${ing}</span>
          </div>
        `).join('')}
      </div>
      <div class="grocery-footer">
        <div class="grocery-tip">
          <span>💡</span>
          <span>Pro tip: Buy in bulk for weekly plans to save ~15% on groceries</span>
        </div>
      </div>
    </div>
  `;
}

function getBaseStyles(): string {
  return `
    <style>
      @page { margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: ${COLORS.darkText};
        background: ${COLORS.white};
        padding: 0;
        line-height: 1.5;
      }
      .page {
        padding: 36px;
        min-height: 100vh;
        background: linear-gradient(180deg, ${COLORS.cream} 0%, ${COLORS.white} 30%);
      }
      
      /* Header */
      .header {
        background: linear-gradient(135deg, ${COLORS.deepPurple} 0%, ${COLORS.purple} 40%, ${COLORS.magenta} 80%, ${COLORS.coral} 100%);
        padding: 36px 40px;
        border-radius: 20px;
        color: white;
        margin-bottom: 28px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(30,20,86,0.20);
      }
      .header::before {
        content: '';
        position: absolute;
        top: -60%;
        right: -15%;
        width: 280px;
        height: 280px;
        background: radial-gradient(circle, rgba(245,183,49,0.15) 0%, transparent 70%);
        border-radius: 50%;
      }
      .header::after {
        content: '';
        position: absolute;
        bottom: -40%;
        left: -10%;
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
        border-radius: 50%;
      }
      .header-brand {
        font-size: 12px;
        font-weight: 700;
        opacity: 0.85;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin-bottom: 10px;
        color: ${COLORS.lightGold};
      }
      .header-title {
        font-size: 30px;
        font-weight: 900;
        letter-spacing: -0.5px;
        margin-bottom: 6px;
      }
      .header-meta {
        font-size: 13px;
        opacity: 0.85;
        margin-bottom: 4px;
      }
      .header-stats {
        display: flex;
        gap: 20px;
        margin-top: 20px;
        padding-top: 18px;
        border-top: 1px solid rgba(255,255,255,0.12);
      }
      .header-stat {
        text-align: center;
        flex: 1;
      }
      .header-stat-value {
        font-size: 22px;
        font-weight: 900;
        color: ${COLORS.lightGold};
        text-shadow: 0 2px 4px rgba(0,0,0,0.15);
      }
      .header-stat-label {
        font-size: 10px;
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-top: 2px;
      }
      
      /* Meal Cards */
      .meal-card {
        background: ${COLORS.cardBg};
        border: 1px solid ${COLORS.border};
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 16px rgba(30,20,86,0.04);
        page-break-inside: avoid;
        position: relative;
      }
      .meal-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 14px;
      }
      .meal-icon {
        width: 50px;
        height: 50px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(30,20,86,0.12);
      }
      .meal-info { flex: 1; }
      .meal-type {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.5px;
      }
      .meal-name {
        font-size: 18px;
        font-weight: 800;
        color: ${COLORS.darkText};
        margin-top: 3px;
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
        background: linear-gradient(135deg, rgba(245,183,49,0.08), rgba(245,183,49,0.02));
        padding: 8px 12px;
        border-radius: 12px;
        border: 1px solid rgba(245,183,49,0.15);
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
      
      /* Macros */
      .macro-row {
        display: flex;
        gap: 8px;
      }
      .macro-item {
        flex: 1;
        text-align: center;
        padding: 10px 8px;
        border-radius: 12px;
        border: 1px solid transparent;
      }
      .macro-item.protein { background: rgba(123,47,160,0.06); border-color: rgba(123,47,160,0.10); }
      .macro-item.carbs { background: rgba(245,183,49,0.06); border-color: rgba(245,183,49,0.12); }
      .macro-item.fat { background: rgba(240,78,80,0.06); border-color: rgba(240,78,80,0.10); }
      .macro-item.prep { background: rgba(30,20,86,0.04); border-color: rgba(30,20,86,0.08); }
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
        margin-top: 2px;
      }
      
      /* Ingredients */
      .ingredients-section {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px dashed ${COLORS.border};
      }
      .ingredients-title {
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 8px;
        color: ${COLORS.darkText};
      }
      .ingredients-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .ingredient-tag {
        background: ${COLORS.lightBg};
        padding: 5px 11px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        color: ${COLORS.purple};
        border: 1px solid rgba(123,47,160,0.08);
      }
      .tip-box {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 12px;
        padding: 12px 14px;
        background: linear-gradient(135deg, rgba(245,183,49,0.05), rgba(245,183,49,0.02));
        border: 1px solid rgba(245,183,49,0.15);
        border-radius: 12px;
        font-size: 12px;
        color: ${COLORS.mutedText};
        line-height: 1.5;
      }
      .tip-emoji { font-size: 14px; margin-top: 1px; }
      
      /* Nutrition Chart */
      .nutrition-chart {
        background: ${COLORS.cardBg};
        border: 1px solid ${COLORS.border};
        border-radius: 18px;
        padding: 24px;
        margin-bottom: 24px;
        page-break-inside: avoid;
        box-shadow: 0 2px 16px rgba(30,20,86,0.03);
      }
      .chart-title {
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 18px;
        color: ${COLORS.darkText};
      }
      .chart-container { margin-bottom: 20px; }
      .chart-bar-group { margin-bottom: 14px; }
      .chart-label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }
      .chart-label-name {
        font-size: 12px;
        font-weight: 700;
        color: ${COLORS.darkText};
      }
      .chart-label-value {
        font-size: 12px;
        font-weight: 700;
        color: ${COLORS.mutedText};
      }
      .chart-bar {
        height: 14px;
        background: ${COLORS.lightBg};
        border-radius: 7px;
        overflow: hidden;
        border: 1px solid rgba(30,20,86,0.04);
      }
      .chart-fill {
        height: 100%;
        border-radius: 7px;
      }
      .protein-fill { background: linear-gradient(90deg, ${COLORS.purple}, #9B4DCA); }
      .carbs-fill { background: linear-gradient(90deg, ${COLORS.gold}, ${COLORS.lightGold}); }
      .fat-fill { background: linear-gradient(90deg, ${COLORS.coral}, #FF8A7B); }
      .chart-summary {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 18px 12px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(30,20,86,0.03), rgba(123,47,160,0.03));
        border: 1px solid ${COLORS.border};
      }
      .summary-item { text-align: center; }
      .summary-icon { font-size: 16px; display: block; margin-bottom: 4px; }
      .summary-value {
        font-size: 20px;
        font-weight: 900;
        color: ${COLORS.darkText};
        display: block;
      }
      .summary-label {
        font-size: 9px;
        font-weight: 700;
        color: ${COLORS.mutedText};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .summary-divider {
        width: 1px;
        height: 40px;
        background: ${COLORS.border};
      }
      
      /* Grocery Section */
      .grocery-section {
        background: ${COLORS.cardBg};
        border: 1px solid ${COLORS.border};
        border-radius: 18px;
        padding: 24px;
        margin-top: 24px;
        page-break-inside: avoid;
      }
      .grocery-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      .grocery-title {
        font-size: 18px;
        font-weight: 800;
        color: ${COLORS.darkText};
      }
      .grocery-badge {
        background: linear-gradient(135deg, ${COLORS.gold}, ${COLORS.lightGold});
        color: ${COLORS.deepPurple};
        font-size: 11px;
        font-weight: 800;
        padding: 4px 12px;
        border-radius: 20px;
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
        padding: 9px 12px;
        background: ${COLORS.lightBg};
        border-radius: 10px;
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
        margin-top: 18px;
        padding-top: 14px;
        border-top: 1px dashed ${COLORS.border};
      }
      .grocery-tip {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: ${COLORS.mutedText};
        background: rgba(245,183,49,0.05);
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid rgba(245,183,49,0.12);
      }
      
      /* Footer */
      .footer {
        text-align: center;
        margin-top: 36px;
        padding: 24px;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(30,20,86,0.03), rgba(123,47,160,0.03));
        border: 1px solid ${COLORS.border};
      }
      .footer-brand {
        font-size: 16px;
        font-weight: 900;
        background: linear-gradient(135deg, ${COLORS.gold}, ${COLORS.darkGold});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 6px;
      }
      .footer-tagline {
        font-size: 12px;
        color: ${COLORS.mutedText};
        margin-bottom: 4px;
      }
      .footer-date {
        font-size: 10px;
        color: ${COLORS.mutedText};
        opacity: 0.7;
      }
      .footer-palette {
        display: flex;
        justify-content: center;
        gap: 4px;
        margin-top: 12px;
      }
      .footer-palette-dot {
        width: 12px;
        height: 12px;
        border-radius: 6px;
      }
    </style>
  `;
}

function getFooterHTML(): string {
  return `
    <div class="footer">
      <div class="footer-brand">FoodGenie AI 🧞‍♂️</div>
      <div class="footer-tagline">Your personal AI-powered meal planning companion</div>
      <div class="footer-date">Generated on ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div class="footer-palette">
        <div class="footer-palette-dot" style="background: ${COLORS.deepPurple}"></div>
        <div class="footer-palette-dot" style="background: ${COLORS.purple}"></div>
        <div class="footer-palette-dot" style="background: ${COLORS.magenta}"></div>
        <div class="footer-palette-dot" style="background: ${COLORS.coral}"></div>
        <div class="footer-palette-dot" style="background: ${COLORS.gold}"></div>
      </div>
    </div>
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

        ${getFooterHTML()}
      </div>
    </body>
    </html>
  `;
}

export function generateWeeklyPlanHTML(plan: WeeklyPlan, persons: number): string {
  const dayColors = [COLORS.deepPurple, COLORS.purple, COLORS.gold, COLORS.magenta, COLORS.coral, COLORS.purple, COLORS.darkGold];

  const dayCards = plan.days.map((day, di) => {
    const dayColor = dayColors[di % dayColors.length];
    const mealRows = day.meals.map(m => `
      <tr>
        <td style="padding: 10px 12px; font-size: 12px; border-bottom: 1px solid ${COLORS.border};">${m.emoji || getMealEmoji(m.type)} ${m.type}</td>
        <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; border-bottom: 1px solid ${COLORS.border};">${m.name}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: ${COLORS.gold}; font-weight: 800; border-bottom: 1px solid ${COLORS.border};">${m.calories} kcal</td>
        <td style="padding: 10px 12px; font-size: 11px; color: ${COLORS.mutedText}; border-bottom: 1px solid ${COLORS.border};">P:${m.protein}g C:${m.carbs}g F:${m.fat}g</td>
      </tr>
    `).join('');

    return `
      <div class="meal-card" style="border-left: 4px solid ${dayColor}; page-break-inside: avoid;">
        <div class="meal-header" style="margin-bottom: 12px;">
          <div class="meal-icon" style="background: linear-gradient(135deg, ${dayColor}, ${dayColor}CC);">
            <span style="color: white; font-weight: 900; font-size: 13px;">${day.day.slice(0, 3)}</span>
          </div>
          <div class="meal-info">
            <div class="meal-name">${day.day}</div>
            <div class="meal-desc">${day.meals.length} meals planned</div>
          </div>
          <div class="meal-cal">
            <span class="cal-value">${day.totalCalories}</span>
            <span class="cal-unit">kcal</span>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden;">
          <thead>
            <tr style="background: ${COLORS.lightBg};">
              <th style="padding: 10px 12px; font-size: 10px; text-align: left; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 0.5px;">Meal</th>
              <th style="padding: 10px 12px; font-size: 10px; text-align: left; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 0.5px;">Dish</th>
              <th style="padding: 10px 12px; font-size: 10px; text-align: left; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 0.5px;">Calories</th>
              <th style="padding: 10px 12px; font-size: 10px; text-align: left; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 0.5px;">Macros</th>
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

        ${getFooterHTML()}
      </div>
    </body>
    </html>
  `;
}

export function generateMonthlyPlanHTML(plan: MonthlyPlan, persons: number): string {
  const weekColors = [COLORS.deepPurple, COLORS.purple, COLORS.magenta, COLORS.coral];

  const weekCards = plan.weeks.map((week, wi) => {
    const weekColor = weekColors[wi % weekColors.length];
    const highlights = (week.highlights || []).map(h => `
      <div class="grocery-item" style="border-left: 3px solid ${weekColor};">
        <span>${h.emoji || '🍽️'}</span>
        <span class="grocery-name">${h.name} (${h.day} ${h.mealType})</span>
      </div>
    `).join('');

    return `
      <div class="meal-card" style="border-left: 4px solid ${weekColor}; page-break-inside: avoid;">
        <div class="meal-header" style="margin-bottom: 12px;">
          <div class="meal-icon" style="background: linear-gradient(135deg, ${weekColor}, ${weekColor}CC);">
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

        ${getFooterHTML()}
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
