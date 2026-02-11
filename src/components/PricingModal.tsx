import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits?: number;
  currentTier?: string;
  onSubscribed?: (credits: number) => void;
}

export default function PricingModal({ isOpen, onClose, currentCredits, currentTier, onSubscribed: _onSubscribed }: PricingModalProps) {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isPro = currentTier === 'pro';

  // Server-side redirect flow: create subscription on backend → redirect to PayPal
  const handleSubscribe = async () => {
    if (!user || !session?.access_token) {
      setError('Please sign in first / 请先登录');
      return;
    }

    setLoading('creating');
    setError('');

    try {
      const planId = import.meta.env.VITE_PAYPAL_PRO_PLAN_ID || '';
      if (!planId) {
        setError('Subscription plan not configured / 订阅计划未配置');
        setLoading(null);
        return;
      }

      const response = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planId, tier: 'pro' }),
      });

      const data = await response.json();

      if (data.success && data.approvalUrl) {
        // Save subscription ID for later activation on return
        try {
          sessionStorage.setItem('summagraph_pending_subscription', JSON.stringify({
            subscriptionId: data.subscriptionId,
            tier: 'pro',
          }));
        } catch { /* ignore */ }

        // Redirect to PayPal for approval (no popup!)
        window.location.href = data.approvalUrl;
      } else {
        setError(data.error || 'Failed to create subscription / 创建订阅失败');
      }
    } catch {
      setError('Network error. Please try again. / 网络错误，请重试');
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!session?.access_token) return;
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
        className="relative w-full max-w-3xl glass-alchemy p-8 animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-alchemy"
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
            Choose Your Plan
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            Unlock more credits and premium features / 解锁更多积分和高级功能
          </p>
          {currentCredits !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              Current credits / 当前积分: <span className="text-holo-cyan font-semibold">{currentCredits}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {loading === 'creating' && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-holo-cyan/10 border border-holo-cyan/20 text-holo-cyan text-sm text-center flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Redirecting to PayPal... / 正在跳转到 PayPal...
          </div>
        )}

        {/* Pricing Grid — 2 tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free Tier */}
          <div className={`relative rounded-2xl p-6 border transition-all duration-300 ${
            !isPro
              ? 'bg-gradient-to-b from-white/5 to-transparent border-holo-cyan/30'
              : 'bg-midnight-800/30 border-white/10 hover:border-white/20'
          }`}>
            {!isPro && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-midnight-800 border border-holo-cyan/40 text-holo-cyan text-xs font-bold">
                CURRENT
              </div>
            )}
            <div className="text-center mb-6 pt-2">
              <h4 className="text-lg font-display font-bold text-white mb-1">Free</h4>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-display font-bold text-white">$0</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">10 credits on signup</p>
              <p className="text-xs text-gray-500">注册赠送 10 积分</p>
            </div>

            <ul className="space-y-3 mb-6">
              {[
                '10 credits (2 generations)',
                'All styles & layouts / 所有风格和布局',
                'Watermark on downloads / 下载有水印',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 mt-0.5 text-holo-mint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-3 rounded-xl text-sm font-medium bg-midnight-800/50 text-gray-500 border border-white/5 cursor-default"
            >
              {!isPro ? 'Current Plan / 当前方案' : 'Free Plan'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="relative rounded-2xl p-6 border transition-all duration-300 bg-gradient-to-b from-holo-purple/10 to-holo-cyan/5 border-holo-purple/50 shadow-lg shadow-holo-purple/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-holo-purple to-holo-cyan text-white text-xs font-bold">
              {isPro ? 'CURRENT' : 'RECOMMENDED'}
            </div>

            <div className="text-center mb-6 pt-2">
              <h4 className="text-lg font-display font-bold text-white mb-1">Pro</h4>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-display font-bold text-white">$9.9</span>
                <span className="text-sm text-gray-500">/month</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">150 credits/month (30 generations)</p>
              <p className="text-xs text-gray-500">每月 150 积分（30 次生成）</p>
            </div>

            <ul className="space-y-3 mb-6">
              {[
                '150 credits/month / 每月 150 积分',
                'No watermark / 无水印下载',
                'High resolution / 高分辨率',
                'Priority support / 优先支持',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 mt-0.5 text-holo-mint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <button
                disabled
                className="w-full py-3 rounded-xl text-sm font-medium bg-holo-purple/20 text-holo-purple border border-holo-purple/30 cursor-default"
              >
                Current Plan / 当前方案
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={loading === 'creating'}
                className="w-full py-3 rounded-xl text-sm font-semibold btn-alchemy disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
              >
                {loading === 'creating' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Processing... / 处理中...</span>
                  </>
                ) : (
                  <>
                    {/* PayPal icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.964L7.076 21.337z"/>
                    </svg>
                    <span>Subscribe with PayPal / 通过 PayPal 订阅</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Cancel subscription link (only for Pro users) */}
        {isPro && (
          <div className="text-center mt-6">
            <button
              onClick={handleCancelSubscription}
              disabled={loading === 'cancel'}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              {loading === 'cancel' ? 'Canceling... / 取消中...' : 'Cancel subscription / 取消订阅'}
            </button>
          </div>
        )}

        {/* Security note */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Secure payment via PayPal. Cancel anytime. / 通过 PayPal 安全支付，随时可取消
        </p>
      </div>
    </div>
  );
}
