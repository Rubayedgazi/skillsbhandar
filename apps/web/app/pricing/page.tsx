import { DEFAULT_PRICING_PLANS, getPremiumPlan } from '@skillsbhandar/shared';
import { getSettings } from '../../lib/data';
import PricingCards from '../../components/PricingCards';
import BuyForm from './BuyForm';

export const revalidate = 60;

/**
 * Pricing page: ONE premium plan only — "Move to Premium".
 * The plan (price, features) comes from Admin → Pricing, or the
 * starter placeholder until the owner saves a real one. The bKash
 * number also comes from Admin → Pricing (site_settings.bkash_number);
 * it is never hardcoded. Buying is bKash Send Money + TrxID, then
 * email OTP verification — no payment gateway is connected, and the
 * owner checks the TrxID in their bKash app.
 */
export default async function Pricing() {
  const settings = await getSettings();
  const plans = settings.pricing_plans && settings.pricing_plans.length > 0
    ? settings.pricing_plans
    : DEFAULT_PRICING_PLANS;
  const plan = getPremiumPlan(plans);
  return (
    <div>
      <div className="page-head" style={{ textAlign: 'center' }}>
        <h1>প্রিমিয়ামে যান</h1>
        <p className="muted">একটি প্ল্যান — সব স্কিল, সব টিউটোরিয়াল, আজীবন প্রিমিয়াম সাপোর্ট।</p>
      </div>
      {plan ? (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 460 }}>
            <PricingCards plans={[plan]} buy={false} />
          </div>
        </div>
      ) : (
        <div className="empty" style={{ marginTop: 24 }}>প্রাইসিং শীঘ্রই আসছে।</div>
      )}
      {plan && (
        <div className="section" style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 560 }}>
            <BuyForm plan={plan} bkashNumber={settings.bkash_number ?? null} />
          </div>
        </div>
      )}
    </div>
  );
}
