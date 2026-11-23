import { DEFAULT_PRICING_PLANS, getPremiumPlan } from '@skillsbhandar/shared';
import { getSettings } from '../../lib/data';
import PricingCards from '../../components/PricingCards';
import BuyForm from './BuyForm';
import { Icon } from '../../components/icons';

export const revalidate = 60;

/**
 * Pricing page: ONE premium plan only — "Move to Premium".
 * The plan (price, features) comes from Admin → Pricing, or the
 * starter placeholder until the owner saves a real one. The bKash
 * number also comes from Admin → Pricing (site_settings.bkash_number);
 * it is never hardcoded. Buying is bKash Send Money + TrxID, then
 * email OTP verification — no payment gateway is connected, and the
 * owner checks the TrxID in their bKash app.
 *
 * Design: gradient hero, trust chips, a 3-step "how to buy" guide,
 * one strong centred premium card, then the checkout form.
 * The buy flow and its logic are untouched.
 */
export default async function Pricing() {
  const settings = await getSettings();
  const plans = settings.pricing_plans && settings.pricing_plans.length > 0
    ? settings.pricing_plans
    : DEFAULT_PRICING_PLANS;
  const plan = getPremiumPlan(plans);
  return (
    <div>
      <section className="pricing-hero">
        <span className="pricing-eyebrow"><Icon name="sparkles" size={15} /> প্রিমিয়াম</span>
        <h1>প্রিমিয়ামে যান</h1>
        <p>একটি প্ল্যান — সব স্কিল, সব টিউটোরিয়াল, আর প্রিমিয়াম সাপোর্ট। আজই শুরু করুন।</p>
        <div className="pricing-chips">
          <span className="pricing-chip">✓ সব স্কিল</span>
          <span className="pricing-chip">✓ সব টিউটোরিয়াল</span>
          <span className="pricing-chip">✓ একবারের পেমেন্ট</span>
        </div>
      </section>

      <div className="howto-grid">
        <div className="howto-card">
          <div className="howto-num">১</div>
          <b>bKash-এ পাঠান</b>
          <span>নিচের bKash নম্বরে Send Money দিয়ে প্ল্যানের দাম পাঠান।</span>
        </div>
        <div className="howto-card">
          <div className="howto-num">২</div>
          <b>TrxID দিন</b>
          <span>bKash থেকে পাওয়া ট্রানজাকশন আইডিটি (TrxID) নিচের বক্সে লিখুন।</span>
        </div>
        <div className="howto-card">
          <div className="howto-num">৩</div>
          <b>ইমেইল যাচাই করুন</b>
          <span>ইমেইলে পাওয়া ৬ সংখ্যার OTP কোডটি লিখে আপনার ইমেইল যাচাই করুন।</span>
        </div>
      </div>

      {plan ? (
        <PricingCards plans={[plan]} buy={false} />
      ) : (
        <div className="empty" style={{ marginTop: 28 }}>প্রাইসিং শীঘ্রই আসছে।</div>
      )}
      {plan && <BuyForm plan={plan} bkashNumber={settings.bkash_number ?? null} />}
      <p className="trust-line"><Icon name="shield" size={15} /> নিরাপদ পেমেন্ট · bKash · ইমেইল যাচাই</p>
    </div>
  );
}
