// ══════════════════════════════════════
// SÉLECT — Webhook Stripe
// Fichier : api/webhook.js
// ══════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ivhdcfyddhmskjuyxoha.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Envoyer un email via Resend
async function sendEmail(type, to, data) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SÉLECT <noreply@select-mode.vercel.app>',
        to,
        subject: getSubject(type, data),
        html: getEmailHtml(type, data)
      })
    });
  } catch(err) {
    console.error('Email error:', err);
  }
}

function getSubject(type, data) {
  switch(type) {
    case 'payment_confirmed': return `✅ Paiement confirmé — Plan ${data.plan} activé`;
    case 'payment_failed': return `⚠️ Problème de paiement — Action requise`;
    case 'subscription_cancelled': return `❌ Abonnement annulé — SÉLECT`;
    default: return 'SÉLECT — Notification';
  }
}

function getEmailHtml(type, data) {
  const header = `<div style="background:#0a0a0a;padding:32px;text-align:center;"><h1 style="font-family:Georgia,serif;color:#fff;font-size:2rem;letter-spacing:0.2em;margin:0;">SÉL<span style="color:#b8964a;">✦</span>CT</h1></div>`;
  const footer = `<div style="background:#0a0a0a;padding:20px;text-align:center;"><p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">© 2026 SÉLECT · Victoriaville, Québec, Canada</p></div>`;

  switch(type) {
    case 'payment_confirmed':
      return `<div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#fafaf7;">${header}<div style="padding:40px 32px;"><div style="text-align:center;margin-bottom:24px;"><div style="width:60px;height:60px;background:#27ae60;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:1.5rem;color:#fff;">✓</div></div><h2 style="font-family:Georgia,serif;font-size:1.6rem;color:#0a0a0a;text-align:center;margin-bottom:16px;">Paiement confirmé !</h2><p style="color:#666;text-align:center;margin-bottom:24px;">Votre abonnement <strong>Plan ${data.plan}</strong> est actif.</p><div style="background:#f2ede3;padding:20px;border-left:3px solid #b8964a;margin-bottom:28px;"><p style="margin:0;color:#555;font-size:0.85rem;line-height:1.8;">Plan : <strong>${data.plan}</strong><br>Montant : <strong>${data.amount || '—'}</strong><br>Date : <strong>${new Date().toLocaleDateString('fr-CA')}</strong></p></div><div style="text-align:center;"><a href="https://select-mode.vercel.app" style="background:#b8964a;color:#0a0a0a;padding:14px 36px;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">Accéder à mon dashboard →</a></div></div>${footer}</div>`;

    case 'payment_failed':
      return `<div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#fafaf7;">${header}<div style="padding:40px 32px;"><h2 style="font-family:Georgia,serif;font-size:1.6rem;color:#0a0a0a;margin-bottom:16px;">Problème de paiement ⚠️</h2><p style="color:#666;line-height:1.7;margin-bottom:24px;">Nous n'avons pas pu traiter votre paiement. Votre page reste visible pendant 7 jours.</p><div style="text-align:center;"><a href="https://select-mode.vercel.app" style="background:#e74c3c;color:#fff;padding:14px 36px;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">Mettre à jour mon paiement →</a></div></div>${footer}</div>`;

    case 'subscription_cancelled':
      return `<div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#fafaf7;">${header}<div style="padding:40px 32px;"><h2 style="font-family:Georgia,serif;font-size:1.6rem;color:#0a0a0a;margin-bottom:16px;">Abonnement annulé</h2><p style="color:#666;line-height:1.7;margin-bottom:24px;">Votre abonnement SÉLECT a été annulé. Vos produits ne sont plus visibles sur la plateforme.</p><p style="color:#666;line-height:1.7;">Vous pouvez vous réabonner à tout moment.</p><div style="text-align:center;margin-top:28px;"><a href="https://select-mode.vercel.app" style="background:#b8964a;color:#0a0a0a;padding:14px 36px;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">Se réabonner →</a></div></div>${footer}</div>`;

    default: return `<div>${header}<div style="padding:40px;">Notification SÉLECT</div>${footer}</div>`;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email;
        const planId = session.metadata?.plan || 'pro';
        const amount = session.amount_total ? `${(session.amount_total/100).toFixed(2)} $` : '—';

        if (customerEmail) {
          const { data: marques } = await sb
            .from('marques')
            .select('id')
            .eq('email', customerEmail)
            .limit(1);

          if (marques && marques.length > 0) {
            await sb.from('marques').update({
              abonnement_actif: true,
              plan: planId,
              stripe_customer_id: session.customer
            }).eq('id', marques[0].id);
          }

          // Email de confirmation
          await sendEmail('payment_confirmed', customerEmail, { plan: planId, amount });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;

        await sb.from('marques').update({
          abonnement_actif: status === 'active',
          stripe_customer_id: customerId
        }).eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: marque } = await sb
          .from('marques')
          .select('email')
          .eq('stripe_customer_id', customerId)
          .single();

        await sb.from('marques').update({
          abonnement_actif: false,
          plan: 'starter'
        }).eq('stripe_customer_id', customerId);

        if (marque?.email) {
          await sendEmail('subscription_cancelled', marque.email, {});
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: marque } = await sb
          .from('marques')
          .select('email')
          .eq('stripe_customer_id', customerId)
          .single();

        await sb.from('marques').update({
          abonnement_actif: false
        }).eq('stripe_customer_id', customerId);

        if (marque?.email) {
          await sendEmail('payment_failed', marque.email, {});
        }
        break;
      }
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
