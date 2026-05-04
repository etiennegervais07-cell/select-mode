// ══════════════════════════════════════
// SÉLECT — Emails automatiques
// Fichier : api/send-email.js
// ══════════════════════════════════════

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Utilise le domaine Resend gratuit pour l'instant
// Une fois que tu as un vrai domaine, change pour: noreply@select-mode.com
const FROM_EMAIL = 'SÉLECT <onboarding@resend.dev>';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, to, data } = req.body;

  if (!type || !to) {
    return res.status(400).json({ error: 'Missing type or to' });
  }

  let subject, html;

  switch (type) {

    // ── Email de bienvenue marque ──
    case 'welcome_brand':
      subject = `Bienvenue sur SÉLECT, ${data.brandName} !`;
      html = `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#fafaf7;">
          <div style="background:#0a0a0a;padding:32px;text-align:center;">
            <h1 style="font-family:Georgia,serif;color:#fff;font-size:2rem;letter-spacing:0.2em;margin:0;">SÉL<span style="color:#b8964a;">✦</span>CT</h1>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="font-family:Georgia,serif;font-size:1.6rem;color:#0a0a0a;margin-bottom:8px;">Bienvenue, ${data.brandName} ! 🎉</h2>
            <p style="color:#666;line-height:1.7;margin-bottom:20px;">Votre marque est maintenant sur SÉLECT. Votre premier mois est <strong>100% gratuit</strong>.</p>
            <div style="background:#f2ede3;padding:20px;margin:20px 0;border-left:3px solid #b8964a;">
              <p style="margin:0;color:#555;font-size:0.9rem;line-height:1.7;">
                ✦ Ajoutez vos produits dans votre dashboard<br>
                ✦ Uploadez vos photos de collections<br>
                ✦ Ajoutez le lien vers votre boutique<br>
                ✦ Votre abonnement commence dans 30 jours
              </p>
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="https://select-mode.vercel.app" style="background:#b8964a;color:#0a0a0a;padding:14px 36px;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;display:inline-block;">Accéder à mon espace →</a>
            </div>
            <p style="color:#999;font-size:0.8rem;line-height:1.6;">Des questions ? Contactez-nous à <a href="mailto:etiennegervais07@gmail.com" style="color:#b8964a;">etiennegervais07@gmail.com</a></p>
          </div>
          <div style="background:#0a0a0a;padding:20px;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">© 2026 SÉLECT · Québec, Canada</p>
          </div>
        </div>`;
      break;

    // ── Email de bienvenue visiteur ──
    case 'welcome_visitor':
      subject = `Bienvenue sur SÉLECT, ${data.firstName} !`;
      html = `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#fafaf7;">
          <div style="background:#0a0a0a;padding:32px;text-align:center;">
            <h1 style="font-family:Georgia,serif;color:#fff;font-size:2rem;letter-spacing:0.2em;margin:0;">SÉL<span style="color:#b8964a;">✦</span>CT</h1>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="font-family:Georgia,serif;font-size:1.6rem;color:#0a0a0a;margin-bottom:8px;">Bonjour ${data.firstName} ! 👋</h2>
            <p style="color:#666;line-height:1.7;margin-bottom:20px;">Votre compte SÉLECT est créé. Découvrez maintenant les meilleures marques de mode.</p>
            <div style="background:#f2ede3;padding:20px;margin:20px 0;border-left:3px solid #b8964a;">
              <p style="margin:0;color:#555;font-size:0.9rem;line-height:1.7;">
                ✦ Explorez les collections de 200+ marques<br>
                ✦ Sauvegardez vos marques favorites<br>
                ✦ Recevez les nouvelles collections en avant-première
              </p>
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="https://select-mode.vercel.app" style="background:#b8964a;color:#0a0a0a;padding:14px 36px;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;display:inline-block;">Explorer les marques →</a>
            </div>
          </div>
          <div style="background:#0a0a0a;padding:20px;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">© 2026 SÉLECT · Québec, Canada</p>
          </div>
        </div>`;
      break;

    // ── Confirmation de paiement ──
    case 'payment_confirmed':
      subject = `✅ Paiement confirmé — Plan ${data.plan} activé`;
      html = `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#fafaf7;">
          <div style="background:#0a0a0a;padding:32px;text-align:center;">
            <h1 style="font-family:Georgia,serif;color:#fff;font-size:2rem;letter-spacing:0.2em;margin:0;">SÉL<span style="color:#b8964a;">✦</span>CT</h1>
          </div>
          <div style="padding:40px 32px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="width:60px;height:60px;background:#27ae60;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:1.5rem;color:#fff;">✓</div>
            </div>
            <h2 style="font-family:Georgia,serif;font-size:1.6rem;color:#0a0a0a;margin-bottom:8px;text-align:center;">Paiement confirmé !</h2>
            <p style="color:#666;line-height:1.7;text-align:center;margin-bottom:24px;">Votre abonnement <strong>Plan ${data.plan}</strong> est maintenant actif.</p>
            <div style="background:#f2ede3;padding:20px;border-left:3px solid #b8964a;margin-bottom:28px;">
              <p style="margin:0;color:#555;font-size:0.85rem;line-height:1.8;">
                Plan : <strong>${data.plan}</strong><br>
                Montant : <strong>${data.amount || '—'}</strong><br>
                Date : <strong>${new Date().toLocaleDateString('fr-CA')}</strong>
              </p>
            </div>
            <div style="text-align:center;">
              <a href="https://select-mode.vercel.app" style="background:#b8964a;color:#0a0a0a;padding:14px 36px;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;display:inline-block;">Accéder à mon dashboard →</a>
            </div>
          </div>
          <div style="background:#0a0a0a;padding:20px;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">© 2026 SÉLECT · Québec, Canada</p>
          </div>
        </div>`;
      break;

    // ── Paiement échoué ──
    case 'payment_failed':
      subject = `⚠️ Problème de paiement — Action requise`;
      html = `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#fafaf7;">
          <div style="background:#0a0a0a;padding:32px;text-align:center;">
            <h1 style="font-family:Georgia,serif;color:#fff;font-size:2rem;letter-spacing:0.2em;margin:0;">SÉL<span style="color:#b8964a;">✦</span>CT</h1>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="font-family:Georgia,serif;font-size:1.6rem;color:#0a0a0a;margin-bottom:16px;">Problème de paiement ⚠️</h2>
            <p style="color:#666;line-height:1.7;margin-bottom:24px;">Nous n'avons pas pu traiter votre paiement. Votre page reste visible pendant 7 jours.</p>
            <div style="text-align:center;">
              <a href="https://select-mode.vercel.app" style="background:#e74c3c;color:#fff;padding:14px 36px;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;display:inline-block;">Mettre à jour mon paiement →</a>
            </div>
          </div>
          <div style="background:#0a0a0a;padding:20px;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">© 2026 SÉLECT · Québec, Canada</p>
          </div>
        </div>`;
      break;

    // ── Abonnement annulé ──
    case 'subscription_cancelled':
      subject = `Abonnement annulé — SÉLECT`;
      html = `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#fafaf7;">
          <div style="background:#0a0a0a;padding:32px;text-align:center;">
            <h1 style="font-family:Georgia,serif;color:#fff;font-size:2rem;letter-spacing:0.2em;margin:0;">SÉL<span style="color:#b8964a;">✦</span>CT</h1>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="font-family:Georgia,serif;font-size:1.6rem;color:#0a0a0a;margin-bottom:8px;">Abonnement annulé</h2>
            <p style="color:#666;line-height:1.7;margin-bottom:24px;">Votre abonnement SÉLECT a été annulé. Vos produits ne sont plus visibles sur la plateforme.</p>
            <p style="color:#666;line-height:1.7;">Vous pouvez vous réabonner à tout moment pour retrouver votre visibilité.</p>
            <div style="text-align:center;margin-top:28px;">
              <a href="https://select-mode.vercel.app" style="background:#b8964a;color:#0a0a0a;padding:14px 36px;text-decoration:none;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;display:inline-block;">Se réabonner →</a>
            </div>
          </div>
          <div style="background:#0a0a0a;padding:20px;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">© 2026 SÉLECT · Québec, Canada</p>
          </div>
        </div>`;
      break;

    default:
      return res.status(400).json({ error: 'Unknown email type' });
  }

  // Envoyer via Resend
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return res.status(500).json({ error: result });
    }

    return res.status(200).json({ success: true, id: result.id });

  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: err.message });
  }
};
