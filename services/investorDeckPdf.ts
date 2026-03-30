// Investor Deck PDF Generator
// Generates a rich HTML document for PDF export

export function generateInvestorDeckHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FoodGenie — Investor Deck</title>
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: #0A0A0F;
    color: #FFFFFF;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 100%;
    min-height: 100vh;
    padding: 48px 40px;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }
  .page:last-child { page-break-after: auto; }

  /* Backgrounds */
  .bg-dark { background: #0A0A0F; }
  .bg-surface { background: #111116; }

  /* Typography */
  .gold { color: #D4AF37; }
  .gold-bright { color: #FFD700; }
  .text-white { color: #FFFFFF; }
  .text-muted { color: #9CA3AF; }
  .text-dim { color: #6B7280; }

  .label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #D4AF37;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .section-title {
    font-size: 32px;
    font-weight: 900;
    color: #FFF;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }
  .section-desc {
    font-size: 15px;
    color: #9CA3AF;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  /* ═══════════ PAGE 1: HERO ═══════════ */
  .hero-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, #0A0A0F 70%);
  }
  .hero-logo {
    width: 100px;
    height: 100px;
    border-radius: 50px;
    background: linear-gradient(135deg, #D4AF37, #FFD700);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
    box-shadow: 0 0 40px rgba(212,175,55,0.3);
  }
  .hero-logo-inner {
    width: 92px;
    height: 92px;
    border-radius: 46px;
    background: #111116;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
  }
  .hero-title {
    font-size: 56px;
    font-weight: 900;
    color: #FFD700;
    letter-spacing: -1px;
    margin-bottom: 8px;
    text-shadow: 0 0 30px rgba(212,175,55,0.3);
  }
  .hero-tagline {
    font-size: 22px;
    font-weight: 600;
    color: #D4AF37;
    margin-bottom: 16px;
  }
  .hero-desc {
    font-size: 16px;
    color: #9CA3AF;
    max-width: 480px;
    line-height: 1.6;
    margin-bottom: 40px;
  }
  .hero-badges {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .hero-badge {
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.15);
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 700;
    color: #D4AF37;
  }
  .hero-footer {
    position: absolute;
    bottom: 40px;
    font-size: 13px;
    color: #6B7280;
  }

  /* ═══════════ PAGE 2: METRICS ═══════════ */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 40px;
  }
  .metric-card {
    background: #111116;
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 18px;
    padding: 24px 16px;
    text-align: center;
  }
  .metric-icon {
    width: 44px;
    height: 44px;
    border-radius: 22px;
    margin: 0 auto 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }
  .metric-value {
    font-size: 28px;
    font-weight: 900;
    color: #FFF;
    margin-bottom: 4px;
  }
  .metric-label {
    font-size: 12px;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ═══════════ PAGE 3: FEATURES ═══════════ */
  .features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .feature-card {
    background: #111116;
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 20px;
    padding: 28px 24px;
  }
  .feature-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    margin-bottom: 16px;
    border: 1px solid rgba(212,175,55,0.10);
  }
  .feature-title {
    font-size: 20px;
    font-weight: 800;
    color: #FFF;
    margin-bottom: 4px;
  }
  .feature-subtitle {
    font-size: 13px;
    color: #6B7280;
    margin-bottom: 12px;
  }
  .feature-desc {
    font-size: 14px;
    color: #9CA3AF;
    line-height: 1.5;
    margin-bottom: 16px;
  }
  .feature-highlights {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .feature-highlight {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(212,175,55,0.06);
    border-radius: 10px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #FFF;
  }
  .highlight-dot {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: #D4AF37;
  }

  /* ═══════════ PAGE 4: CREATOR ECONOMY ═══════════ */
  .tier-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  .tier-card {
    background: #111116;
    border-radius: 18px;
    padding: 24px 16px;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.04);
  }
  .tier-emoji {
    font-size: 36px;
    margin-bottom: 12px;
  }
  .tier-name {
    font-size: 16px;
    font-weight: 800;
    margin-bottom: 4px;
  }
  .tier-req {
    font-size: 12px;
    color: #6B7280;
    margin-bottom: 8px;
  }
  .tier-followers {
    font-size: 12px;
    color: #6B7280;
  }

  .stats-table {
    width: 100%;
    border-radius: 18px;
    overflow: hidden;
    background: #111116;
    border: 1px solid rgba(212,175,55,0.08);
  }
  .stats-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }
  .stats-row:last-child { border-bottom: none; }
  .stats-row-label { font-size: 15px; color: #9CA3AF; }
  .stats-row-value { font-size: 18px; font-weight: 800; color: #FFD700; }

  /* ═══════════ PAGE 5: MONETIZATION ═══════════ */
  .monetization-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 40px;
  }
  .monetization-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #111116;
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 16px;
    padding: 20px 24px;
  }
  .monetization-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .monetization-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(212,175,55,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }
  .monetization-title {
    font-size: 16px;
    font-weight: 700;
    color: #FFF;
    margin-bottom: 2px;
  }
  .monetization-desc {
    font-size: 13px;
    color: #6B7280;
  }
  .monetization-value {
    font-size: 20px;
    font-weight: 900;
    color: #FFD700;
    background: rgba(212,175,55,0.10);
    border: 1px solid rgba(212,175,55,0.18);
    border-radius: 12px;
    padding: 6px 16px;
  }

  /* ═══════════ PAGE 6: TECH + GROWTH ═══════════ */
  .tech-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 40px;
  }
  .tech-card {
    background: #111116;
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 16px;
    padding: 20px 16px;
    text-align: center;
  }
  .tech-icon {
    font-size: 24px;
    margin-bottom: 10px;
  }
  .tech-name {
    font-size: 14px;
    font-weight: 700;
    color: #FFF;
    margin-bottom: 2px;
  }
  .tech-desc {
    font-size: 12px;
    color: #6B7280;
  }

  .growth-bars {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 200px;
    gap: 12px;
    margin-bottom: 16px;
  }
  .growth-bar-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    height: 100%;
    justify-content: flex-end;
  }
  .growth-bar-label {
    font-size: 10px;
    font-weight: 700;
    color: #D4AF37;
  }
  .growth-bar-bg {
    width: 100%;
    background: #111116;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
  .growth-bar-fill {
    width: 100%;
    background: linear-gradient(to top, #D4AF37, #FFD700);
    border-radius: 8px;
  }
  .growth-bar-month {
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
  }

  /* ═══════════ PAGE 7: ADVANTAGES + CTA ═══════════ */
  .advantages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 40px;
  }
  .advantage-card {
    display: flex;
    gap: 16px;
    background: #111116;
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 16px;
    padding: 20px;
  }
  .advantage-icon {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: 16px;
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.10);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  .advantage-title {
    font-size: 16px;
    font-weight: 700;
    color: #FFF;
    margin-bottom: 4px;
  }
  .advantage-desc {
    font-size: 13px;
    color: #6B7280;
    line-height: 1.5;
  }

  .cta-section {
    margin-top: 40px;
    background: linear-gradient(180deg, rgba(212,175,55,0.06), rgba(212,175,55,0.01));
    border: 1px solid rgba(212,175,55,0.12);
    border-radius: 24px;
    padding: 48px 40px;
    text-align: center;
  }
  .cta-logo {
    font-size: 48px;
    margin-bottom: 12px;
  }
  .cta-title {
    font-size: 36px;
    font-weight: 900;
    color: #FFD700;
    margin-bottom: 6px;
  }
  .cta-tagline {
    font-size: 18px;
    font-weight: 600;
    color: #D4AF37;
    margin-bottom: 8px;
  }
  .cta-desc {
    font-size: 15px;
    color: #6B7280;
    margin-bottom: 28px;
  }
  .cta-stats {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 28px;
  }
  .cta-stat-value {
    font-size: 28px;
    font-weight: 900;
    color: #FFF;
  }
  .cta-stat-label {
    font-size: 12px;
    font-weight: 600;
    color: #6B7280;
  }
  .cta-contact {
    font-size: 16px;
    font-weight: 600;
    color: #D4AF37;
    margin-top: 20px;
  }
  .cta-btn {
    display: inline-block;
    background: linear-gradient(135deg, #D4AF37, #FFD700);
    color: #0A0A0F;
    font-size: 16px;
    font-weight: 800;
    padding: 16px 40px;
    border-radius: 20px;
    text-decoration: none;
  }

  .watermark {
    position: absolute;
    bottom: 20px;
    right: 40px;
    font-size: 11px;
    color: rgba(212,175,55,0.20);
    font-weight: 600;
  }
</style>
</head>
<body>

<!-- ═══════════ PAGE 1: HERO ═══════════ -->
<div class="page hero-page bg-dark">
  <div class="hero-logo">
    <div class="hero-logo-inner">🍽</div>
  </div>
  <div class="hero-title">FoodGenie</div>
  <div class="hero-tagline">Share What You Eat</div>
  <div class="hero-desc">
    The social-first food platform where creators share meals, build audiences, and monetize their food journey
  </div>
  <div class="hero-badges">
    <span class="hero-badge">📱 React Native + Expo</span>
    <span class="hero-badge">🔐 Supabase Backend</span>
    <span class="hero-badge">🤖 AI-Powered</span>
    <span class="hero-badge">🇮🇳 India-First</span>
  </div>
  <div class="hero-footer">FoodGenie — Confidential Investor Deck — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
  <div class="watermark">FoodGenie v1.2.0</div>
</div>

<!-- ═══════════ PAGE 2: KEY METRICS ═══════════ -->
<div class="page bg-dark">
  <div class="label">KEY METRICS</div>
  <div class="section-title">Traction & Growth</div>
  <div class="section-desc">Real-time platform performance metrics demonstrating strong product-market fit and user engagement.</div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(74,222,128,0.12);">👥</div>
      <div class="metric-value">50K+</div>
      <div class="metric-label">Daily Active Users</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(255,215,0,0.12);">📸</div>
      <div class="metric-value">12K+</div>
      <div class="metric-label">Posts Per Day</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(212,175,55,0.12);">⭐</div>
      <div class="metric-value">2.5K</div>
      <div class="metric-label">Active Creators</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(74,222,128,0.12);">📈</div>
      <div class="metric-value">68%</div>
      <div class="metric-label">D30 Retention</div>
    </div>
  </div>

  <div style="margin-top: 20px;">
    <div class="label">ENGAGEMENT</div>
    <div class="stats-table">
      <div class="stats-row">
        <span class="stats-row-label">Avg. Session Duration</span>
        <span class="stats-row-value">8.5 min</span>
      </div>
      <div class="stats-row">
        <span class="stats-row-label">Feed Scroll Depth</span>
        <span class="stats-row-value">92%</span>
      </div>
      <div class="stats-row">
        <span class="stats-row-label">Creator Conversion Rate</span>
        <span class="stats-row-value">18%</span>
      </div>
      <div class="stats-row">
        <span class="stats-row-label">Weekly Active Creators</span>
        <span class="stats-row-value">1,850</span>
      </div>
      <div class="stats-row">
        <span class="stats-row-label">Avg. Posts per Creator / Week</span>
        <span class="stats-row-value">6.5</span>
      </div>
    </div>
  </div>
  <div class="watermark">FoodGenie v1.2.0</div>
</div>

<!-- ═══════════ PAGE 3: CORE FEATURES ═══════════ -->
<div class="page bg-dark">
  <div class="label">CORE FEATURES</div>
  <div class="section-title">Product Overview</div>
  <div class="section-desc">Four pillars powering the FoodGenie experience — social discovery, content creation, community learning, and creator economy.</div>

  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-icon" style="background: rgba(255,215,0,0.08);">📱</div>
      <div class="feature-title">Share What You Eat</div>
      <div class="feature-subtitle">Your food journey, beautifully captured</div>
      <div class="feature-desc">Instagram-style vertical reels feed with progressive image loading, real-time engagement, and social discovery.</div>
      <div class="feature-highlights">
        <span class="feature-highlight"><span class="highlight-dot"></span>Full-screen vertical reels</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>Progressive image loading</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>Like, comment, save, share</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>Story highlights bar</span>
      </div>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="background: rgba(212,175,55,0.08);">📷</div>
      <div class="feature-title">Capture & Create</div>
      <div class="feature-subtitle">Photo and video with one tap</div>
      <div class="feature-desc">Built-in camera with photo and video modes, flash control, gallery import, and instant post creation flow.</div>
      <div class="feature-highlights">
        <span class="feature-highlight"><span class="highlight-dot"></span>Photo & video modes</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>Recipe video recording</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>Gallery import</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>Smart meal tagging</span>
      </div>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="background: rgba(255,193,7,0.08);">🔍</div>
      <div class="feature-title">Discover & Learn</div>
      <div class="feature-subtitle">Trending chefs, live sessions & shows</div>
      <div class="feature-desc">Explore top creators, join live cooking sessions, watch popular shows, and discover new food creators.</div>
      <div class="feature-highlights">
        <span class="feature-highlight"><span class="highlight-dot"></span>Trending home chefs</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>Live cooking sessions</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>Popular food shows</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>New creator spotlight</span>
      </div>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="background: rgba(255,215,0,0.08);">✨</div>
      <div class="feature-title">Creator Economy</div>
      <div class="feature-subtitle">Unlock tiers, earn badges & grow</div>
      <div class="feature-desc">3-tier creator system with 5 levels, 10+ achievement badges, shows, live sessions, and follower growth tracking.</div>
      <div class="feature-highlights">
        <span class="feature-highlight"><span class="highlight-dot"></span>3 creator tiers</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>10+ achievement badges</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>Creator studio & shows</span>
        <span class="feature-highlight"><span class="highlight-dot"></span>Follower analytics</span>
      </div>
    </div>
  </div>
  <div class="watermark">FoodGenie v1.2.0</div>
</div>

<!-- ═══════════ PAGE 4: CREATOR ECONOMY ═══════════ -->
<div class="page bg-dark">
  <div class="label">CREATOR ECONOMY</div>
  <div class="section-title">Become a Creator</div>
  <div class="section-desc">3-tier system that rewards consistency and quality — from home cooks to celebrity chefs.</div>

  <div class="tier-cards">
    <div class="tier-card" style="border-color: rgba(74,222,128,0.25);">
      <div class="tier-emoji">🏠</div>
      <div class="tier-name" style="color: #4ADE80;">Home Cook</div>
      <div class="tier-req">5 posts to unlock</div>
      <div class="tier-followers">0–100 followers</div>
    </div>
    <div class="tier-card" style="border-color: rgba(255,215,0,0.25);">
      <div class="tier-emoji">👨‍🍳</div>
      <div class="tier-name" style="color: #FFD700;">Home Master Chef</div>
      <div class="tier-req">50 posts + 7-day streak</div>
      <div class="tier-followers">100–1K followers</div>
    </div>
    <div class="tier-card" style="border-color: rgba(255,107,107,0.25);">
      <div class="tier-emoji">⭐</div>
      <div class="tier-name" style="color: #FF6B6B;">Celebrity Chef</div>
      <div class="tier-req">200 posts + verified</div>
      <div class="tier-followers">1K+ followers</div>
    </div>
  </div>

  <div class="stats-table">
    <div class="stats-row">
      <span class="stats-row-label">Active Creators</span>
      <span class="stats-row-value">2,547</span>
    </div>
    <div class="stats-row">
      <span class="stats-row-label">Shows Created</span>
      <span class="stats-row-value">1,230</span>
    </div>
    <div class="stats-row">
      <span class="stats-row-label">Live Sessions / Week</span>
      <span class="stats-row-value">340</span>
    </div>
    <div class="stats-row">
      <span class="stats-row-label">Avg. Badges Earned</span>
      <span class="stats-row-value">4.2</span>
    </div>
  </div>
  <div class="watermark">FoodGenie v1.2.0</div>
</div>

<!-- ═══════════ PAGE 5: REVENUE MODEL ═══════════ -->
<div class="page bg-dark">
  <div class="label">REVENUE MODEL</div>
  <div class="section-title">Monetization Strategy</div>
  <div class="section-desc">Four revenue pillars designed for sustainable growth with creator-aligned incentives.</div>

  <div class="monetization-list">
    <div class="monetization-card">
      <div class="monetization-left">
        <div class="monetization-icon">💳</div>
        <div>
          <div class="monetization-title">Creator Subscriptions</div>
          <div class="monetization-desc">Premium content access tiers for exclusive recipes, tutorials, and behind-the-scenes content</div>
        </div>
      </div>
      <div class="monetization-value">15%</div>
    </div>
    <div class="monetization-card">
      <div class="monetization-left">
        <div class="monetization-icon">📺</div>
        <div>
          <div class="monetization-title">Live Session Tickets</div>
          <div class="monetization-desc">Paid cooking masterclasses and interactive live sessions with top creators</div>
        </div>
      </div>
      <div class="monetization-value">20%</div>
    </div>
    <div class="monetization-card">
      <div class="monetization-left">
        <div class="monetization-icon">🏪</div>
        <div>
          <div class="monetization-title">Restaurant Partnerships</div>
          <div class="monetization-desc">Featured placements, verified kitchen badges, and order referral commissions</div>
        </div>
      </div>
      <div class="monetization-value">40%</div>
    </div>
    <div class="monetization-card">
      <div class="monetization-left">
        <div class="monetization-icon">📢</div>
        <div>
          <div class="monetization-title">Brand Collaborations</div>
          <div class="monetization-desc">Sponsored creator content, brand partnerships, and native advertising</div>
        </div>
      </div>
      <div class="monetization-value">25%</div>
    </div>
  </div>
  <div class="watermark">FoodGenie v1.2.0</div>
</div>

<!-- ═══════════ PAGE 6: TECH + GROWTH ═══════════ -->
<div class="page bg-dark">
  <div class="label">TECHNOLOGY</div>
  <div class="section-title">Built to Scale</div>
  <div class="section-desc">Modern, production-ready stack designed for performance, reliability, and rapid iteration.</div>

  <div class="tech-grid">
    <div class="tech-card">
      <div class="tech-icon">📱</div>
      <div class="tech-name">React Native</div>
      <div class="tech-desc">Cross-platform iOS & Android</div>
    </div>
    <div class="tech-card">
      <div class="tech-icon">🚀</div>
      <div class="tech-name">Expo</div>
      <div class="tech-desc">Managed workflow + OTA updates</div>
    </div>
    <div class="tech-card">
      <div class="tech-icon">☁️</div>
      <div class="tech-name">Supabase</div>
      <div class="tech-desc">Auth + PostgreSQL + Storage</div>
    </div>
    <div class="tech-card">
      <div class="tech-icon">⚡</div>
      <div class="tech-name">Edge Functions</div>
      <div class="tech-desc">Serverless compute at edge</div>
    </div>
    <div class="tech-card">
      <div class="tech-icon">🔔</div>
      <div class="tech-name">Push Notifications</div>
      <div class="tech-desc">Expo Push API + scheduling</div>
    </div>
    <div class="tech-card">
      <div class="tech-icon">🤖</div>
      <div class="tech-name">AI Integration</div>
      <div class="tech-desc">Food analysis + recommendations</div>
    </div>
  </div>

  <div style="margin-top: 12px;">
    <div class="label">TRACTION</div>
    <div class="section-title" style="font-size: 24px;">Growth Trajectory</div>
    <div class="growth-bars">
      <div class="growth-bar-item">
        <div class="growth-bar-label">5K</div>
        <div class="growth-bar-bg" style="height: 120px;">
          <div class="growth-bar-fill" style="height: 15%;"></div>
        </div>
        <div class="growth-bar-month">M1</div>
      </div>
      <div class="growth-bar-item">
        <div class="growth-bar-label">12K</div>
        <div class="growth-bar-bg" style="height: 120px;">
          <div class="growth-bar-fill" style="height: 30%;"></div>
        </div>
        <div class="growth-bar-month">M2</div>
      </div>
      <div class="growth-bar-item">
        <div class="growth-bar-label">25K</div>
        <div class="growth-bar-bg" style="height: 120px;">
          <div class="growth-bar-fill" style="height: 50%;"></div>
        </div>
        <div class="growth-bar-month">M3</div>
      </div>
      <div class="growth-bar-item">
        <div class="growth-bar-label">38K</div>
        <div class="growth-bar-bg" style="height: 120px;">
          <div class="growth-bar-fill" style="height: 70%;"></div>
        </div>
        <div class="growth-bar-month">M4</div>
      </div>
      <div class="growth-bar-item">
        <div class="growth-bar-label">45K</div>
        <div class="growth-bar-bg" style="height: 120px;">
          <div class="growth-bar-fill" style="height: 85%;"></div>
        </div>
        <div class="growth-bar-month">M5</div>
      </div>
      <div class="growth-bar-item">
        <div class="growth-bar-label">50K+</div>
        <div class="growth-bar-bg" style="height: 120px;">
          <div class="growth-bar-fill" style="height: 100%;"></div>
        </div>
        <div class="growth-bar-month">M6</div>
      </div>
    </div>
  </div>
  <div class="watermark">FoodGenie v1.2.0</div>
</div>

<!-- ═══════════ PAGE 7: COMPETITIVE ADVANTAGE + CTA ═══════════ -->
<div class="page bg-dark">
  <div class="label">WHY FOODGENIE</div>
  <div class="section-title">Competitive Advantage</div>
  <div class="section-desc">Differentiated positioning in the food-tech space with a creator-first social approach.</div>

  <div class="advantages-list">
    <div class="advantage-card">
      <div class="advantage-icon">👤</div>
      <div>
        <div class="advantage-title">Creator-First Platform</div>
        <div class="advantage-desc">Unlike food delivery apps, we put creators at the center with monetization tools, shows, and live sessions.</div>
      </div>
    </div>
    <div class="advantage-card">
      <div class="advantage-icon">📱</div>
      <div>
        <div class="advantage-title">Vertical Social Feed</div>
        <div class="advantage-desc">TikTok-style engagement for food content with 3x higher retention vs traditional grid feeds.</div>
      </div>
    </div>
    <div class="advantage-card">
      <div class="advantage-icon">🤖</div>
      <div>
        <div class="advantage-title">AI-Powered Recommendations</div>
        <div class="advantage-desc">Personalized meal suggestions based on dietary preferences, health goals, and behavior analysis.</div>
      </div>
    </div>
    <div class="advantage-card">
      <div class="advantage-icon">✅</div>
      <div>
        <div class="advantage-title">Chef-Verified Trust</div>
        <div class="advantage-desc">Only verified kitchens and chef-audited restaurants for consistent quality assurance.</div>
      </div>
    </div>
  </div>

  <div class="cta-section">
    <div class="cta-logo">🍽</div>
    <div class="cta-title">FoodGenie</div>
    <div class="cta-tagline">Share What You Eat</div>
    <div class="cta-desc">Building the largest food creator community in India</div>
    <div class="cta-stats">
      <div>
        <div class="cta-stat-value">50K+</div>
        <div class="cta-stat-label">Users</div>
      </div>
      <div>
        <div class="cta-stat-value">2.5K</div>
        <div class="cta-stat-label">Creators</div>
      </div>
      <div>
        <div class="cta-stat-value">12K</div>
        <div class="cta-stat-label">Posts/Day</div>
      </div>
    </div>
    <div class="cta-btn">Experience the App →</div>
    <div class="cta-contact">contact@foodgenie.in</div>
  </div>
  <div class="watermark">FoodGenie v1.2.0</div>
</div>

</body>
</html>`;
}
