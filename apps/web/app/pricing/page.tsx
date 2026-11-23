import { DEFAULT_PRICING_PLANS } from '@skillsbhandar/shared';
import { getSettings } from '../../lib/data';
import PricingCards from '../../components/PricingCards';
import BuyForm from './BuyForm';

export const revalidate = 60;

/**
 * Pricing page: the plans the owner saved in Admin → Pricing (or the
 * starter placeholders until then), plus the buy-premium request form.
 * No payment gateway is connected — the form only sends a request.
 */
export default async function Pricing({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const settings = await getSettings();
  const plans = settings.pricing_plans && settings.pricing_plans.length > 0
    ? settings.pricing_plans
    : DEFAULT_PRICING_PLANS;
  const params = await searchParams;
  return (
    <div>
      <div className="page-head">
        <h1>প্রাইসিং</h1>
        <p className="muted">আপনার জন্য সঠিক প্ল্যানটি বেছে নিন — প্রিমিয়াম নিলে সব স্কিল ও টিউটোরিয়াল খুলে যাবে।</p>
      </div>
      <div style={{ marginTop: 24 }}>
        <PricingCards plans={plans} />
      </div>
      <div className="section">
        <BuyForm plans={plans} initialPlan={params.plan || ''} />
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
        পেমেন্ট এখনো অনলাইনে নেওয়া হয় না — অনুরোধ পাঠালে মালিক আপনার সাথে যোগাযোগ করে পেমেন্ট সম্পন্ন করবেন।
      </p>
    </div>
  );
}
