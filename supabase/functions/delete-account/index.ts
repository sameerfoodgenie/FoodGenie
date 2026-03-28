import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_NAME = 'FoodGenie';
const CONTACT_EMAIL = 'chocohivepvtltd@gmail.com';
const COMPANY_NAME = 'ChocoHive Pvt Ltd';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Handle form submission
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const email = (body.email || '').trim().toLowerCase();
      const reason = (body.reason || '').trim();

      if (!email || !email.includes('@')) {
        return new Response(
          JSON.stringify({ error: 'Please provide a valid email address.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      const { error } = await supabaseAdmin
        .from('deletion_requests')
        .insert({ email, reason: reason || null });

      if (error) {
        console.error('Insert error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to submit request. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } catch (e) {
      console.error('POST error:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  }

  // Serve HTML page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME} - Delete Account</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0A0A0A;
      color: rgba(255,255,255,0.75);
      line-height: 1.7;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      padding: 40px 24px 60px;
    }
    .hero {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 28px;
      border-bottom: 1px solid rgba(212,175,55,0.15);
    }
    .hero-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: rgba(255,59,48,0.10);
      border: 1px solid rgba(255,59,48,0.20);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 28px; margin-bottom: 16px;
    }
    h1 {
      font-size: 26px; font-weight: 800; color: #FFF;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px; color: rgba(255,255,255,0.45);
    }
    .info-card {
      background: rgba(255,59,48,0.06);
      border: 1px solid rgba(255,59,48,0.15);
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 28px;
    }
    .info-card h3 {
      font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.85);
      margin-bottom: 10px;
    }
    .info-card ul {
      list-style: none; padding: 0;
    }
    .info-card li {
      position: relative; padding-left: 18px; margin-bottom: 8px;
      font-size: 13px; color: rgba(255,255,255,0.55);
    }
    .info-card li::before {
      content: '';
      position: absolute; left: 0; top: 8px;
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255,59,48,0.50);
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 14px; font-weight: 600;
      color: rgba(255,255,255,0.70);
      margin-bottom: 8px;
    }
    .required { color: #FF3B30; }
    input, textarea {
      width: 100%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 15px;
      color: #FFF;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    input:focus, textarea:focus {
      border-color: rgba(212,175,55,0.40);
    }
    input::placeholder, textarea::placeholder {
      color: rgba(255,255,255,0.25);
    }
    textarea {
      resize: vertical;
      min-height: 80px;
    }
    .submit-btn {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #FF3B30, #FF6B6B);
      color: #FFF;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      margin-top: 8px;
    }
    .submit-btn:hover { opacity: 0.9; }
    .submit-btn:active { transform: scale(0.98); }
    .submit-btn:disabled {
      opacity: 0.5; cursor: not-allowed; transform: none;
    }
    .success-card {
      display: none;
      text-align: center;
      background: rgba(74,222,128,0.08);
      border: 1px solid rgba(74,222,128,0.20);
      border-radius: 14px;
      padding: 32px 20px;
      margin-top: 20px;
    }
    .success-card .icon { font-size: 48px; margin-bottom: 16px; }
    .success-card h2 { font-size: 20px; color: #FFF; margin-bottom: 8px; }
    .success-card p { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.6; }
    .error-msg {
      display: none;
      background: rgba(255,59,48,0.10);
      border: 1px solid rgba(255,59,48,0.25);
      border-radius: 10px;
      padding: 12px 16px;
      margin-top: 12px;
      font-size: 14px;
      color: #FF6B6B;
    }
    .note {
      text-align: center;
      margin-top: 24px;
      font-size: 13px;
      color: rgba(255,255,255,0.35);
    }
    .note a {
      color: #D4AF37;
      text-decoration: none;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(212,175,55,0.10);
      font-size: 13px;
      color: rgba(255,255,255,0.25);
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
      <div class="hero-icon">🗑️</div>
      <h1>Delete Your Account</h1>
      <div class="subtitle">${APP_NAME} by ${COMPANY_NAME}</div>
    </div>

    <div class="info-card">
      <h3>What happens when you delete your account</h3>
      <ul>
        <li>Your profile, posts, photos, videos, and captions will be permanently deleted</li>
        <li>Your comments, likes, saves, and follow connections will be removed</li>
        <li>Your preferences, meal history, and creator data will be erased</li>
        <li>This action is irreversible and will be processed within 30 days</li>
        <li>You will receive a confirmation email once deletion is complete</li>
      </ul>
    </div>

    <form id="deleteForm">
      <div class="form-group">
        <label>Email Address <span class="required">*</span></label>
        <input
          type="email"
          id="email"
          placeholder="Enter the email linked to your account"
          required
          autocomplete="email"
        />
      </div>
      <div class="form-group">
        <label>Reason for leaving (optional)</label>
        <textarea
          id="reason"
          placeholder="Help us improve — why are you deleting your account?"
          rows="3"
        ></textarea>
      </div>
      <button type="submit" class="submit-btn" id="submitBtn">
        Request Account Deletion
      </button>
      <div class="error-msg" id="errorMsg"></div>
    </form>

    <div class="success-card" id="successCard">
      <div class="icon">✅</div>
      <h2>Request Submitted</h2>
      <p>
        We have received your account deletion request. Your account and all associated data
        will be permanently deleted within 30 days. You will receive a confirmation email
        at the address you provided.
      </p>
    </div>

    <p class="note">
      Questions? Contact us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
    </p>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
    </div>
  </div>

  <script>
    const form = document.getElementById('deleteForm');
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('errorMsg');
    const successCard = document.getElementById('successCard');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.style.display = 'none';

      const email = document.getElementById('email').value.trim();
      const reason = document.getElementById('reason').value.trim();

      if (!email) {
        errorMsg.textContent = 'Please enter your email address.';
        errorMsg.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        const res = await fetch(window.location.href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, reason }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Something went wrong.');
        }

        form.style.display = 'none';
        successCard.style.display = 'block';
      } catch (err) {
        errorMsg.textContent = err.message || 'Failed to submit. Please try again.';
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request Account Deletion';
      }
    });
  </script>
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
