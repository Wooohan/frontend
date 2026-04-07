import React from 'react';
import { Check, Zap, Shield, Star } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'Perfect for small agencies getting started.',
    features: ['1,000 Records / Day', 'Manual Downloads', 'Basic Carrier Info', 'Email Support', 'CSV Export'],
    cta: 'Get Started',
    popular: false,
    icon: Shield,
  },
  {
    name: 'Pro',
    price: '$149',
    period: '/mo',
    description: 'For growing teams that need serious data.',
    features: ['50,000 Records / Day', 'Auto-Sync to CRM', 'Advanced Filtering', 'Priority Support', 'API Access', 'Insurance Enrichment'],
    cta: 'Upgrade to Pro',
    popular: true,
    icon: Zap,
  },
  {
    name: 'Enterprise',
    price: '$499',
    period: '/mo',
    description: 'Unlimited scale for large logistics firms.',
    features: ['Unlimited Records', 'Dedicated Account Manager', 'Custom Integration', 'SLA Guarantee', 'White-label Reports', 'SFTP Delivery'],
    cta: 'Contact Sales',
    popular: false,
    icon: Star,
  },
];

export const Subscription: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 pb-20 overflow-y-auto h-screen animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-16">
        <p className="section-label mb-3">Pricing Plans</p>
        <h1 className="heading-display text-4xl text-white mb-5">Choose your data power</h1>
        <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Unlock the full FMCSA database with our intelligence engine. Stop manual copy-pasting and start closing deals.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className="relative flex flex-col transition-all duration-300"
            style={{
              background: plan.popular ? 'var(--bg-card-alt, #181A27)' : 'var(--bg-card)',
              border: `1px solid ${plan.popular ? 'var(--border-accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: 32,
              boxShadow: plan.popular ? '0 0 40px var(--accent-dim), var(--shadow-card)' : 'none',
              transform: plan.popular ? 'scale(1.03)' : 'none',
              zIndex: plan.popular ? 1 : 0,
            }}
            onMouseEnter={e => { if (!plan.popular) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLDivElement).style.transform = plan.popular ? 'scale(1.03) translateY(-2px)' : 'translateY(-2px)'; }}
            onMouseLeave={e => { if (!plan.popular) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = plan.popular ? 'scale(1.03)' : 'none'; }}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg"
                style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--shadow-accent)' }}>
                Most Popular
              </div>
            )}

            {/* Plan icon */}
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: plan.popular ? 'var(--accent-dim)' : 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <plan.icon size={18} style={{ color: plan.popular ? 'var(--accent-light)' : 'var(--text-secondary)' }} />
            </div>

            <h3 className="heading-display text-lg text-white mb-1">{plan.name}</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)', minHeight: 36 }}>{plan.description}</p>

            <div className="mb-8">
              <span className="heading-display text-5xl text-white">{plan.price}</span>
              <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
            </div>

            <button className={`w-full py-3.5 rounded-2xl font-semibold text-sm mb-8 transition-all ${plan.popular ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontFamily: 'var(--font-body)' }}>
              {plan.cta}
            </button>

            <div className="space-y-3.5 flex-1">
              {plan.features.map((feature, fIdx) => (
                <div key={fIdx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: plan.popular ? 'var(--accent-dim)' : 'var(--bg-hover)', border: `1px solid ${plan.popular ? 'var(--border-accent)' : 'var(--border)'}` }}>
                    <Check size={11} style={{ color: plan.popular ? 'var(--accent-light)' : 'var(--text-muted)' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-20 text-center border-t pt-10" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Secure payment processing via Stripe. Cancel anytime.{' '}
          <br className="hidden sm:block" />
          Need a custom data solution?{' '}
          <a href="#" style={{ color: 'var(--accent-light)' }} className="hover:underline">Chat with us.</a>
        </p>
      </div>
    </div>
  );
};
