// ══════════════════════════════════════
// SÉLECT — Webhook Stripe
// Fichier : api/webhook.js
// ══════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

// Config Supabase
const SUPABASE_URL = 'https://ivhdcfyddhmskjuyxoha.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Clé secrète Supabase
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET; // Secret webhook Stripe

module.exports = async (req, res) => {
  // Seulement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  // Récupérer le body brut pour vérifier la signature
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Vérifier que la requête vient vraiment de Stripe
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Connecter Supabase avec la clé service (accès complet)
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ══ GÉRER LES ÉVÉNEMENTS STRIPE ══
  try {
    switch (event.type) {

      // ── Paiement réussi ──
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email;
        const planId = session.metadata?.plan || 'starter';

        console.log(`✅ Paiement reçu: ${customerEmail} — Plan: ${planId}`);

        if (customerEmail) {
          // Trouver l'utilisateur dans Supabase par email
          const { data: users } = await sb
            .from('marques')
            .select('id, user_id')
            .eq('email', customerEmail)
            .limit(1);

          if (users && users.length > 0) {
            // Activer l'abonnement
            await sb.from('marques').update({
              abonnement_actif: true,
              plan: planId,
              stripe_customer_id: session.customer
            }).eq('id', users[0].id);

            console.log(`✅ Abonnement activé pour: ${customerEmail}`);
          }
        }
        break;
      }

      // ── Abonnement activé ──
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status; // active, past_due, canceled

        console.log(`📋 Abonnement ${status}: customer ${customerId}`);

        // Mettre à jour le statut dans Supabase
        await sb.from('marques').update({
          abonnement_actif: status === 'active',
          stripe_customer_id: customerId
        }).eq('stripe_customer_id', customerId);

        break;
      }

      // ── Abonnement annulé ──
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        console.log(`❌ Abonnement annulé: customer ${customerId}`);

        await sb.from('marques').update({
          abonnement_actif: false,
          plan: 'starter'
        }).eq('stripe_customer_id', customerId);

        break;
      }

      // ── Paiement échoué ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        console.log(`⚠️ Paiement échoué: customer ${customerId}`);

        // Désactiver temporairement l'abonnement
        await sb.from('marques').update({
          abonnement_actif: false
        }).eq('stripe_customer_id', customerId);

        break;
      }

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper pour lire le body brut
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
