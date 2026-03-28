import { corsHeaders } from '../_shared/cors.ts';

const APP_NAME = 'FoodGenie';
const CONTACT_EMAIL = 'chocohivepvtltd@gmail.com';
const COMPANY_NAME = 'ChocoHive Pvt Ltd';
const LAST_UPDATED = 'March 28, 2026';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME} - Privacy Policy</title>
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
      <h1>${APP_NAME} Privacy Policy</h1>
      <div class="date">Last updated: ${LAST_UPDATED}</div>
    </div>

    <p class="intro">
      ${APP_NAME} ("we", "our", or "us") is operated by ${COMPANY_NAME}. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this policy carefully. By using ${APP_NAME}, you agree to the collection and use of information in accordance with this policy.
    </p>

    <h2>1. Information We Collect</h2>

    <h3>a) Information You Provide</h3>
    <ul>
      <li>Account information: email address, username, and profile details (name, bio, avatar) you provide during registration and profile setup.</li>
      <li>Content you create: food posts, photos, videos, captions, recipe instructions, comments, and likes.</li>
      <li>Preferences: dietary preferences, budget range, spice level, health goals, cuisine preferences, and other settings you configure.</li>
      <li>Communications: messages you send to us for support or feedback.</li>
    </ul>

    <h3>b) Information Collected Automatically</h3>
    <ul>
      <li>Device information: device type, operating system, unique device identifiers, and mobile network information.</li>
      <li>Usage data: features used, pages viewed, actions taken, time and date of visits, and interaction patterns.</li>
      <li>Push notification tokens: device tokens for delivering notifications, stored securely on our servers.</li>
    </ul>

    <h3>c) Camera and Media</h3>
    <ul>
      <li>Photos and videos captured through the app are processed locally on your device and uploaded to our servers only when you choose to create a post.</li>
      <li>We request camera and microphone permissions solely for capturing food content. These permissions can be revoked at any time through your device settings.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>To create and manage your account, and personalize your experience.</li>
      <li>To display your posts, comments, and interactions in the social feed.</li>
      <li>To provide meal recommendations and food insights based on your preferences.</li>
      <li>To send push notifications about activity on your posts, new followers, and app updates (with your consent).</li>
      <li>To improve our app, analyze usage trends, and develop new features.</li>
      <li>To detect, prevent, and address technical issues or policy violations.</li>
      <li>To facilitate the creator program, including tracking milestones and badges.</li>
    </ul>

    <h2>3. Information Sharing and Disclosure</h2>
    <p>We do not sell your personal information to third parties. We may share information in the following circumstances:</p>
    <ul>
      <li>Public content: Posts, comments, likes, and profile information you make public are visible to other users of the app.</li>
      <li>Service providers: We use trusted third-party services (cloud hosting, analytics, push notification delivery) that process data on our behalf under strict confidentiality agreements.</li>
      <li>Legal requirements: We may disclose information if required by law, regulation, legal process, or government request.</li>
      <li>Business transfers: In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction.</li>
    </ul>

    <h2>4. Data Storage and Security</h2>
    <p>Your data is stored on secure cloud servers with encryption in transit and at rest. We implement industry-standard security measures including:</p>
    <ul>
      <li>Row-level security policies ensuring users can only access their own private data.</li>
      <li>Encrypted authentication tokens and secure session management.</li>
      <li>Regular security audits and monitoring.</li>
    </ul>
    <p>While we strive to protect your information, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.</p>

    <h2>5. Your Rights and Choices</h2>
    <ul>
      <li>Access and update: You can view and update your profile information, preferences, and settings at any time through the app.</li>
      <li>Delete content: You can delete your posts, comments, and other content you have created.</li>
      <li>Account deletion: You may request deletion of your account and associated data by visiting our <a href="https://amijhtmyxspkhsuramij.backend.onspace.ai/functions/v1/delete-account" style="color:#D4AF37;text-decoration:none;">Account Deletion</a> page or contacting us at ${CONTACT_EMAIL}.</li>
      <li>Notifications: You can manage push notification preferences through your device settings.</li>
      <li>Camera permissions: You can revoke camera and microphone access at any time through your device settings.</li>
    </ul>

    <h2>6. Data Retention</h2>
    <p>We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal data within 30 days, except where retention is required by law or for legitimate business purposes.</p>

    <h2>7. Children's Privacy</h2>
    <p>${APP_NAME} is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided us with personal information, we will delete it promptly. If you believe a child under 13 has provided us with personal data, please contact us at ${CONTACT_EMAIL}.</p>

    <h2>8. Third-Party Services</h2>
    <p>Our app may contain links to or integrations with third-party services (e.g., food delivery platforms, social sharing). These third parties have their own privacy policies, and we are not responsible for their practices. We encourage you to review their privacy policies before engaging with them.</p>

    <h2>9. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy within the app and updating the "Last updated" date. Your continued use of the app after changes constitutes acceptance of the updated policy.</p>

    <h2>10. Contact Us</h2>
    <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
    <div class="contact-card">
      <div class="contact-row">
        <span class="contact-icon">🏢</span>
        <span>${COMPANY_NAME}</span>
      </div>
      <div class="contact-row">
        <span class="contact-icon">📧</span>
        <span>${CONTACT_EMAIL}</span>
      </div>
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
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
