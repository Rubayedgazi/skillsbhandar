import Link from 'next/link';
import { periodLabel, type PricingPlan } from '@skillsbhandar/shared';
import { Icon } from './icons';

/**
 * Pricing cards, in the same dark design as the rest of the site.
 * `buy` adds a "প্রিমিয়াম কিনুন" button that opens the buy form on
 * /pricing. The Free plan links to Explore instead — there is nothing
 * to buy for ৳0. Prices are the plans the owner saved in Admin →
 * Pricing (or the starter placeholders until then).
 */
export default function PricingCards({ plans, buy = true }: { plans: PricingPlan[]; buy?: boolean }) {
  const active = plans.filter((p) => p.is_active);
  if (active.length === 0) return <div className="empty">প্রাইসিং শীঘ্রই আসছে।</div>;
  // Single plan (the normal case now): one strong centred premium card.
  if (active.length === 1) {
    const p = active[0];
    return (
      <div className="premium-card">
        <div className="premium-card-head">
          <h3>{p.name}</h3>
          {p.featured && <span className="premium-badge">সবচেয়ে জনপ্রিয়</span>}
        </div>
        <p className="premium-price">
          {p.price_taka === 0 ? 'ফ্রি' : `৳${p.price_taka.toLocaleString('bn-BD')}`}
          {p.price_taka > 0 && <span className="muted"> / {periodLabel(p.period)}</span>}
        </p>
        <p className="premium-price-note">
          {p.period === 'lifetime' ? 'একবার পেমেন্ট — আর কোনো মাসিক চার্জ নেই' : p.period === 'yearly' ? 'বার্ষিক পেমেন্ট — পুরো বছর প্রিমিয়াম' : 'মাসিক পেমেন্ট — যেকোনো সময় বাতিল করুন'}
        </p>
        <ul className="premium-features">
          {p.features.map((f, i) => (
            <li key={i}><span className="check-dot"><Icon name="check" size={13} /></span>{f}</li>
          ))}
        </ul>
        {buy && p.price_taka > 0 && (
          <Link href="/pricing" className="btn premium-cta">প্রিমিয়ামে যান →</Link>
        )}
        {buy && p.price_taka === 0 && (
          <Link href="/explore" className="btn-ghost premium-cta">এখনই শুরু করুন</Link>
        )}
      </div>
    );
  }
  return (
    <div className="price-grid">
      {active.map((p) => (
        <div key={p.slug} className={`price-card${p.featured ? ' featured' : ''}`}>
          {p.featured && <span className="price-badge">সবচেয়ে জনপ্রিয়</span>}
          <h3>{p.name}</h3>
          <p className="price-amount">
            {p.price_taka === 0 ? 'ফ্রি' : `৳${p.price_taka.toLocaleString('bn-BD')}`}
            {p.price_taka > 0 && <span className="muted"> / {periodLabel(p.period)}</span>}
          </p>
          <ul className="price-features">
            {p.features.map((f, i) => (
              <li key={i}><Icon name="check" size={16} />{f}</li>
            ))}
          </ul>
          {buy && p.price_taka > 0 && (
            <Link href="/pricing" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              প্রিমিয়াম কিনুন
            </Link>
          )}
          {buy && p.price_taka === 0 && (
            <Link href="/explore" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              এখনই শুরু করুন
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
