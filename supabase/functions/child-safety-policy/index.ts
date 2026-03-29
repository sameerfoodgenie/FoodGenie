import { corsHeaders } from '../_shared/cors.ts';

const APP_NAME = 'FoodGenie';
const CONTACT_EMAIL = 'chocohivepvtltd@gmail.com';
const COMPANY_NAME = 'ChocoHive Pvt Ltd';
const LAST_UPDATED = 'March 29, 2026';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME} - Child Safety Standards Policy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0A0A0A;
      color: rgba(255,255,255,0.75);
      line-height: 1.7;
      padding: 0;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 40px 24px 60px;
    }
    .hero {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 32px;
      border-bottom: 1px solid rgba(212,175,55,0.15);
    }
    .hero-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: rgba(212,175,55,0.10);
      border: 1px solid rgba(212,175,55,0.20);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 28px; margin-bottom: 16px;
    }
    h1 {
      font-size: 28px; font-weight: 800; color: #FFF;
      margin-bottom: 8px;
    }
    .date { font-size: 13px; color: rgba(255,255,255,0.40); }
    .intro { margin-bottom: 32px; font-size: 15px; }
    h2 {
      font-size: 18px; font-weight: 700; color: #D4AF37;
      margin: 32px 0 14px;
    }
    h3 {
      font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.80);
      margin: 16px 0 8px;
    }
    p { margin-bottom: 14px; font-size: 15px; }
    ul {
      list-style: none; padding: 0; margin-bottom: 14px;
    }
    ul li {
      position: relative; padding-left: 18px; margin-bottom: 10px; font-size: 14px;
      color: rgba(255,255,255,0.65);
    }
    ul li::before {
      content: '';
      position: absolute; left: 0; top: 9px;
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(212,175,55,0.50);
    }
    .highlight-box {
      background: rgba(212,175,55,0.06);
      border: 1px solid rgba(212,175,55,0.15);
      border-radius: 14px;
      padding: 20px;
      margin: 16px 0;
    }
    .highlight-box p { margin-bottom: 0; font-size: 14px; color: rgba(255,255,255,0.70); }
    .contact-card {
      background: rgba(212,175,55,0.06);
      border: 1px solid rgba(212,175,55,0.15);
      border-radius: 14px;
      padding: 20px;
      margin-top: 12px;
    }
    .contact-row {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 10px; font-size: 15px; color: rgba(255,255,255,0.70);
    }
    .contact-row:last-child { margin-bottom: 0; }
    .contact-icon { color: #D4AF37; font-size: 18px; }
    a { color: #D4AF37; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .footer {
      text-align: center; margin-top: 48px; padding-top: 24px;
      border-top: 1px solid rgba(212,175,55,0.10);
      font-size: 13px; color: rgba(255,255,255,0.30);
    }
    @media (max-width: 480px) {
      .container { padding: 24px 16px 40px; }
      h1 { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <div class="hero-icon">🛡️</div>
      <h1>${APP_NAME} Child Safety Standards Policy</h1>
      <div class="date">Last updated: ${LAST_UPDATED}</div>
    </div>

    <p class="intro">
      ${COMPANY_NAME} ("we", "our", or "us") is committed to the safety and protection of children. This Child Safety Standards Policy outlines our practices and commitments regarding child safety within the ${APP_NAME} mobile application.
    </p>

    <h2>1. Age Requirement</h2>
    <p>${APP_NAME} is a food-sharing social platform intended for users aged 13 and above. We do not target, direct, or knowingly allow children under the age of 13 to use our services.</p>
    <div class="highlight-box">
      <p><strong>Important:</strong> Users must be at least 13 years old to create an account and use ${APP_NAME}. We do not knowingly collect, store, or process personal information from children under 13.</p>
    </div>

    <h2>2. No Child Sexual Abuse Material (CSAM)</h2>
    <p>We have a zero-tolerance policy for Child Sexual Abuse Material (CSAM) and any content that sexually exploits or endangers children. This includes, but is not limited to:</p>
    <ul>
      <li>Any imagery, video, or text depicting the sexual exploitation or abuse of minors.</li>
      <li>Content that sexualizes minors in any way, including AI-generated or manipulated content.</li>
      <li>Links to external sites or resources containing CSAM or child exploitation material.</li>
      <li>Any attempt to solicit, distribute, or promote such material through our platform.</li>
    </ul>

    <h2>3. Content Moderation and Reporting</h2>
    <p>We employ the following measures to prevent and address child safety concerns:</p>

    <h3>a) Proactive Measures</h3>
    <ul>
      <li>All user-generated content (posts, images, videos, comments) is subject to our community guidelines which explicitly prohibit any content harmful to minors.</li>
      <li>Our moderation team reviews flagged content promptly to identify and remove violations.</li>
      <li>Admin and operations teams have tools to review, flag, and remove content that violates our policies.</li>
    </ul>

    <h3>b) Reporting Mechanisms</h3>
    <ul>
      <li>Users can report any content or behavior that they believe violates child safety standards directly within the app.</li>
      <li>Reports can also be sent via email to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</li>
      <li>All reports involving child safety are treated with the highest priority and reviewed within 24 hours.</li>
    </ul>

    <h3>c) Response Actions</h3>
    <ul>
      <li>Content that violates this policy is immediately removed upon verification.</li>
      <li>Accounts found to be in violation are permanently suspended without notice.</li>
      <li>We report confirmed CSAM and child exploitation activity to the National Center for Missing & Exploited Children (NCMEC) and relevant law enforcement authorities as required by law.</li>
      <li>We cooperate fully with law enforcement investigations related to child safety.</li>
    </ul>

    <h2>4. Data Protection for Minors</h2>
    <p>In the event that we discover a user is under 13 years of age:</p>
    <ul>
      <li>The account will be immediately suspended and subsequently deleted.</li>
      <li>All personal data associated with the account will be permanently deleted within 48 hours.</li>
      <li>Any content posted by the account will be removed from the platform.</li>
    </ul>

    <h2>5. User Interactions and Safety</h2>
    <ul>
      <li>Our platform focuses on food-related content sharing (recipes, restaurant reviews, meal posts) and does not include private messaging or direct communication features that could be used for grooming or exploitation.</li>
      <li>Public interactions (comments, likes) are visible to all users and subject to community moderation.</li>
      <li>We do not share user location data or personal contact information publicly.</li>
    </ul>

    <h2>6. Employee and Partner Standards</h2>
    <ul>
      <li>All team members with access to user data or content moderation tools are trained on child safety policies and reporting obligations.</li>
      <li>Third-party service providers are contractually required to comply with applicable child safety laws and regulations.</li>
    </ul>

    <h2>7. Compliance with Laws and Regulations</h2>
    <p>We comply with all applicable laws and regulations regarding child safety, including but not limited to:</p>
    <ul>
      <li>Children's Online Privacy Protection Act (COPPA) - United States</li>
      <li>General Data Protection Regulation (GDPR) - European Union, with specific provisions for minors</li>
      <li>Information Technology Act and POCSO Act - India</li>
      <li>Google Play Developer Program Policies on child safety</li>
      <li>Any other applicable local, national, or international child protection laws</li>
    </ul>

    <h2>8. Point of Contact for Child Safety Concerns</h2>
    <p>If you have any concerns about child safety on our platform, or wish to report a potential violation, please contact us immediately:</p>
    <div class="contact-card">
      <div class="contact-row">
        <span class="contact-icon">🏢</span>
        <span>${COMPANY_NAME}</span>
      </div>
      <div class="contact-row">
        <span class="contact-icon">📧</span>
        <span><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></span>
      </div>
      <div class="contact-row">
        <span class="contact-icon">⏱️</span>
        <span>Child safety reports are reviewed within 24 hours</span>
      </div>
    </div>

    <h2>9. Updates to This Policy</h2>
    <p>We may update this Child Safety Standards Policy as needed to reflect changes in our practices or legal requirements. Material changes will be communicated through the app and this page will reflect the updated date. Continued use of ${APP_NAME} constitutes acceptance of the updated policy.</p>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.<br/>
      <a href="https://amijhtmyxspkhsuramij.backend.onspace.ai/functions/v1/privacy-policy">Privacy Policy</a> &nbsp;|&nbsp;
      <a href="https://amijhtmyxspkhsuramij.backend.onspace.ai/functions/v1/delete-account">Account Deletion</a>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
});
