import express from 'express';
import { requireAuth, supabaseAdmin } from '../middleware/auth.js';
import logger from '../logger.js';

const router = express.Router();

// PayPal API base URLs
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal access token using client credentials
 */
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * GET /api/paypal/pricing — Return pricing information
 */
router.get('/pricing', (_req, res) => {
  res.json({
    success: true,
    pricing: {
      free: {
        name: 'Free',
        price: '$0',
        limit: 3,
        features: ['3 generations/month', 'Standard resolution', 'Basic styles'],
      },
      pro: {
        name: 'Pro',
        price: '$9.9/mo',
        limit: 50,
        planId: process.env.PAYPAL_PRO_PLAN_ID || '',
        features: ['50 generations/month', 'No watermark', 'High resolution', 'Priority support'],
      },
      premium: {
        name: 'Premium',
        price: '$19.9/mo',
        limit: -1,
        planId: process.env.PAYPAL_PREMIUM_PLAN_ID || '',
        features: ['Unlimited generations', 'No watermark', 'Highest resolution', 'Priority queue', 'API access'],
      },
    },
  });
});

/**
 * POST /api/paypal/create-subscription — Create a PayPal subscription
 * The frontend PayPal button handles the approval flow,
 * but we use this to validate and record the subscription server-side.
 */
router.post('/create-subscription', requireAuth, async (req, res) => {
  try {
    const { planId, tier } = req.body;
    if (!planId) {
      return res.status(400).json({ success: false, error: 'Plan ID is required' });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          brand_name: 'SummaGraph',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}?subscription=success`,
          cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}?subscription=canceled`,
        },
        custom_id: JSON.stringify({ user_id: req.user.id, tier: tier || 'pro' }),
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      logger.error('PayPal create subscription failed', { error: err });
      return res.status(500).json({ success: false, error: 'Failed to create subscription' });
    }

    const subscription = await response.json();

    // Find the approval link
    const approvalLink = subscription.links?.find(l => l.rel === 'approve')?.href;

    res.json({
      success: true,
      subscriptionId: subscription.id,
      approvalUrl: approvalLink,
    });
  } catch (error) {
    logger.error('Error creating PayPal subscription', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to create subscription' });
  }
});

/**
 * POST /api/paypal/activate-subscription — Called after user approves on PayPal
 * Verifies subscription status and updates database
 */
router.post('/activate-subscription', requireAuth, async (req, res) => {
  try {
    const { subscriptionId, tier } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ success: false, error: 'Subscription ID is required' });
    }

    const accessToken = await getPayPalAccessToken();

    // Verify subscription with PayPal
    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(400).json({ success: false, error: 'Invalid subscription' });
    }

    const subscription = await response.json();

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'APPROVED') {
      return res.status(400).json({ success: false, error: `Subscription status: ${subscription.status}` });
    }

    const userId = req.user.id;
    const subscriberEmail = subscription.subscriber?.email_address;
    const resolvedTier = tier || 'pro';

    // Update profile
    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: resolvedTier,
        subscription_status: 'active',
        paypal_subscriber_id: subscriberEmail || subscription.subscriber?.payer_id || null,
      })
      .eq('id', userId);

    // Upsert subscription record
    const billingInfo = subscription.billing_info;
    await supabaseAdmin.from('subscriptions').upsert({
      user_id: userId,
      paypal_subscription_id: subscription.id,
      paypal_plan_id: subscription.plan_id,
      status: 'active',
      current_period_start: billingInfo?.last_payment?.time || new Date().toISOString(),
      current_period_end: billingInfo?.next_billing_time || null,
    }, { onConflict: 'paypal_subscription_id' });

    logger.info('PayPal subscription activated', { userId, tier: resolvedTier, subscriptionId });

    res.json({ success: true, subscription_tier: resolvedTier });
  } catch (error) {
    logger.error('Error activating PayPal subscription', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to activate subscription' });
  }
});

/**
 * POST /api/paypal/cancel-subscription — Cancel a subscription
 */
router.post('/cancel-subscription', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's active subscription
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('paypal_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!sub?.paypal_subscription_id) {
      return res.status(400).json({ success: false, error: 'No active subscription found' });
    }

    const accessToken = await getPayPalAccessToken();

    // Cancel on PayPal
    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${sub.paypal_subscription_id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'User requested cancellation' }),
      }
    );

    if (!response.ok && response.status !== 204) {
      const err = await response.text();
      logger.error('PayPal cancel failed', { error: err });
      return res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
    }

    // Update database
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('paypal_subscription_id', sub.paypal_subscription_id);

    await supabaseAdmin
      .from('profiles')
      .update({ subscription_tier: 'free', subscription_status: 'canceled' })
      .eq('id', userId);

    logger.info('PayPal subscription canceled', { userId });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error canceling subscription', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
});

/**
 * POST /api/paypal/webhook — Handle PayPal webhook notifications
 */
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const event = req.body;
    const eventType = event.event_type;

    logger.info('PayPal webhook received', { type: eventType, id: event.id });

    // Optionally verify webhook signature (recommended for production)
    // See: https://developer.paypal.com/api/rest/webhooks/#link-verifywebhooksignaturepost
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      try {
        const accessToken = await getPayPalAccessToken();
        const verifyResponse = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth_algo: req.headers['paypal-auth-algo'],
            cert_url: req.headers['paypal-cert-url'],
            transmission_id: req.headers['paypal-transmission-id'],
            transmission_sig: req.headers['paypal-transmission-sig'],
            transmission_time: req.headers['paypal-transmission-time'],
            webhook_id: webhookId,
            webhook_event: event,
          }),
        });

        const verifyData = await verifyResponse.json();
        if (verifyData.verification_status !== 'SUCCESS') {
          logger.warn('PayPal webhook verification failed', { status: verifyData.verification_status });
          return res.status(400).json({ error: 'Webhook verification failed' });
        }
      } catch (verifyErr) {
        logger.warn('PayPal webhook verification error', { error: verifyErr.message });
        // Continue processing in sandbox mode, reject in production
        if (process.env.PAYPAL_MODE === 'live') {
          return res.status(400).json({ error: 'Webhook verification failed' });
        }
      }
    }

    const resource = event.resource;

    switch (eventType) {
      // Subscription activated (user completed payment)
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subscriptionId = resource.id;
        let customData = {};
        try { customData = JSON.parse(resource.custom_id || '{}'); } catch {}

        const userId = customData.user_id;
        const tier = customData.tier || 'pro';

        if (userId) {
          await supabaseAdmin.from('profiles').update({
            subscription_tier: tier,
            subscription_status: 'active',
          }).eq('id', userId);

          await supabaseAdmin.from('subscriptions').upsert({
            user_id: userId,
            paypal_subscription_id: subscriptionId,
            paypal_plan_id: resource.plan_id,
            status: 'active',
            current_period_start: resource.start_time,
            current_period_end: resource.billing_info?.next_billing_time || null,
          }, { onConflict: 'paypal_subscription_id' });

          logger.info('Webhook: Subscription activated', { userId, tier });
        }
        break;
      }

      // Payment completed for subscription cycle
      case 'PAYMENT.SALE.COMPLETED': {
        const billingAgreementId = resource.billing_agreement_id;
        if (billingAgreementId) {
          const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id')
            .eq('paypal_subscription_id', billingAgreementId)
            .single();

          if (sub) {
            await supabaseAdmin.from('subscriptions').update({ status: 'active' }).eq('paypal_subscription_id', billingAgreementId);
            await supabaseAdmin.from('profiles').update({ subscription_status: 'active' }).eq('id', sub.user_id);
            logger.info('Webhook: Payment received', { userId: sub.user_id });
          }
        }
        break;
      }

      // Subscription cancelled
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = resource.id;
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('paypal_subscription_id', subscriptionId)
          .single();

        if (sub) {
          await supabaseAdmin.from('subscriptions').update({ status: 'canceled' }).eq('paypal_subscription_id', subscriptionId);
          await supabaseAdmin.from('profiles').update({ subscription_tier: 'free', subscription_status: 'canceled' }).eq('id', sub.user_id);
          logger.info('Webhook: Subscription canceled', { userId: sub.user_id });
        }
        break;
      }

      // Subscription suspended (payment failed)
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subscriptionId = resource.id;
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('paypal_subscription_id', subscriptionId)
          .single();

        if (sub) {
          await supabaseAdmin.from('subscriptions').update({ status: 'past_due' }).eq('paypal_subscription_id', subscriptionId);
          await supabaseAdmin.from('profiles').update({ subscription_status: 'past_due' }).eq('id', sub.user_id);
          logger.info('Webhook: Subscription suspended', { userId: sub.user_id });
        }
        break;
      }

      default:
        logger.debug('Unhandled PayPal webhook event', { type: eventType });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('PayPal webhook processing error', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
