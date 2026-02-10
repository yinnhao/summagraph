import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PricingTier {
  name: string;
  price: string;
  limit: number;
  features: string[];
  planId?: string;
  tier: string;
  popular?: boolean;
}

const TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    limit: 3,
    tier: 'free',
    features: [
      '3 generations / month',
      'Standard resolution',
      'Basic styles',
    ],
  },
  {
    name: 'Pro',
    price: '$9.9',
    limit: 50,
    tier: 'pro',
    popular: true,
    planId: import.meta.env.VITE_PAYPAL_PRO_PLAN_ID || '',
    features: [
      '50 generations / month',
      'No watermark',
      'High resolution',
      'Priority support',
    ],
  },
  {
    name: 'Premium',
    price: '$19.9',
    limit: -1,
    tier: 'premium',
    planId: import.meta.env.VITE_PAYPAL_PREMIUM_PLAN_ID || '',
    features: [
      'Unlimited generations',
      'No watermark',
      'Highest resolution',
      'Priority queue',
      'API access',
    ],
  },
];

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);

  // Load PayPal JS SDK when a paid tier is selected
  useEffect(() => {
    if (!selectedTier || selectedTier.tier === 'free' || !selectedTier.planId) return;

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError('PayPal is not configured. Please contact support.');
      return;
    }

    // Check if PayPal script is already loaded
    const existingScript = document.getElementById('paypal-sdk-script');
    if (existingScript) {
      existingScript.remove();
      // Reset PayPal namespace
      if ((window as any).paypal) {
        delete (window as any).paypal;
      }
    }

    setPaypalReady(false);

    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
    script.setAttribute('data-sdk-integration-source', 'button-factory');

    script.onload = () => {
      setPaypalReady(true);
    };
    script.onerror = () => {
      setError('Failed to load PayPal. Please try again.');
    };

    document.body.appendChild(script);

    return () => {
      const s = document.getElementById('paypal-sdk-script');
      if (s) s.remove();
    };
  }, [selectedTier]);

  // Render PayPal button when SDK is ready
  useEffect(() => {
    if (!paypalReady || !selectedTier || !selectedTier.planId) return;

    const paypal = (window as any).paypal;
    if (!paypal) return;

    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    // Clear any existing buttons
    container.innerHTML = '';

    paypal.Buttons({
      style: {
        shape: 'pill',
        color: 'blue',
        layout: 'vertical',
        label: 'subscribe',
      },
      createSubscription: (_data: any, actions: any) => {
        return actions.subscription.create({
          plan_id: selectedTier.planId,
          custom_id: JSON.stringify({ user_id: user?.id, tier: selectedTier.tier }),
        });
      },
      onApprove: async (data: any) => {
        setLoading('activating');
        setError('');
        try {
          // Activate subscription on our backend
          const response = await fetch('/api/paypal/activate-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              subscriptionId: data.subscriptionID,
              tier: selectedTier.tier,
            }),
          });

          const result = await response.json();
          if (result.success) {
            onClose();
            // Reload to reflect new subscription status
            window.location.reload();
          } else {
            setError(result.error || 'Failed to activate subscription');
          }
        } catch {
          setError('Failed to activate subscription. Please contact support.');
        } finally {
          setLoading(null);
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        setError('PayPal encountered an error. Please try again.');
        setLoading(null);
      },
      onCancel: () => {
        setLoading(null);
      },
    }).render('#paypal-button-container');
  }, [paypalReady, selectedTier, user, session, onClose]);

  const handleCancelSubscription = async () => {
    if (!session) return;
    setLoading('cancel');
    setError('');
    try {
      const response = await fetch('/api/paypal/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        onClose();
        window.location.reload();
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch {
      setError('Failed to cancel subscription');
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-midnight-950/90 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl glass-alchemy p-8 animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-alchemy"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-midnight-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-midnight-700 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-display font-bold text-gradient-alchemy">
            {selectedTier ? `Subscribe to ${selectedTier.name}` : 'Choose Your Plan'}
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            {selectedTier
              ? 'Complete your subscription with PayPal'
              : 'Unlock more generations and premium features'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {selectedTier ? '通过 PayPal 完成订阅' : '解锁更多生成次数和高级功能'}
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {loading === 'activating' && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-holo-cyan/10 border border-holo-cyan/20 text-holo-cyan text-sm text-center flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Activating your subscription... / 正在激活订阅...
          </div>
        )}

        {/* PayPal Button Area (shown when a tier is selected) */}
        {selectedTier && selectedTier.tier !== 'free' ? (
          <div className="space-y-6">
            {/* Selected plan summary */}
            <div className="rounded-2xl p-6 bg-gradient-to-b from-holo-purple/10 to-holo-cyan/5 border border-holo-purple/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-display font-bold text-white">{selectedTier.name} Plan</h4>
                  <p className="text-sm text-gray-400">
                    {selectedTier.price}/month{' · '}
                    {selectedTier.limit === -1 ? 'Unlimited' : `${selectedTier.limit} generations`}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedTier(null); setError(''); }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Change plan / 更换方案
                </button>
              </div>
              <ul className="space-y-2">
                {selectedTier.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-holo-mint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* PayPal Button */}
            <div className="flex justify-center">
              <div
                id="paypal-button-container"
                className="w-full max-w-sm min-h-[50px]"
              >
                {!paypalReady && (
                  <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
                    <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Loading PayPal... / 加载 PayPal 中...
                  </div>
                )}
              </div>
            </div>

            {/* Security note */}
            <p className="text-center text-xs text-gray-600">
              Secure payment via PayPal. Cancel anytime. / 通过 PayPal 安全支付，随时可取消
            </p>
          </div>
        ) : (
          /* Pricing Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.tier}
                className={`relative rounded-2xl p-6 border transition-all duration-300 ${
                  tier.popular
                    ? 'bg-gradient-to-b from-holo-purple/10 to-holo-cyan/5 border-holo-purple/50 shadow-lg shadow-holo-purple/10'
                    : 'bg-midnight-800/30 border-white/10 hover:border-white/20'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-holo-purple to-holo-cyan text-white text-xs font-bold">
                    POPULAR
                  </div>
                )}

                <div className="text-center mb-6">
                  <h4 className="text-lg font-display font-bold text-white mb-1">{tier.name}</h4>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-display font-bold text-white">{tier.price}</span>
                    {tier.tier !== 'free' && <span className="text-sm text-gray-500">/month</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {tier.limit === -1 ? 'Unlimited' : `${tier.limit} generations/month`}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 mt-0.5 text-holo-mint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {tier.tier === 'free' ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-medium bg-midnight-800/50 text-gray-500 border border-white/5 cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!user) {
                        setError('Please sign in first / 请先登录');
                        return;
                      }
                      setSelectedTier(tier);
                      setError('');
                    }}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      tier.popular
                        ? 'btn-alchemy py-3'
                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {`Upgrade to ${tier.name}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cancel subscription link */}
        {user && !selectedTier && (
          <div className="text-center mt-6">
            <button
              onClick={handleCancelSubscription}
              disabled={loading === 'cancel'}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              {loading === 'cancel' ? 'Canceling...' : 'Cancel existing subscription / 取消订阅'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
