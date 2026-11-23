'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseClient, type PricingPlan } from '@skillsbhandar/shared';

/**
 * Premium buy flow — 3 steps, exactly as the owner described:
 *
 * STEP 1 — bKash পেমেন্ট: the owner's bKash number (from Admin →
 * Pricing, never hardcoded) with a Copy button, Send Money
 * instructions for the plan price, and a TrxID field.
 *
 * STEP 2 — ইমেইল যাচাই (OTP): the buyer enters their email, we send
 * a 6-digit code with Supabase Auth email OTP (signInWithOtp), and
 * they type the code back (verifyOtp). Wrong/expired code shows a
 * clear Bengali error, with a Resend option.
 *
 * STEP 3 — সম্পন্ন: the purchase request (TrxID + verified email) is
 * saved to purchase_requests, and the buyer sees that they will get
 * an email after payment verification with their login email and
 * password, plus a Back to Home button.
 *
 * Nothing here verifies the payment against bKash — the owner checks
 * the TrxID in their bKash app. No payment is taken online.
 */
export default function BuyForm({ plan, bkashNumber }: { plan: PricingPlan; bkashNumber: string | null }) {
  const [step, setStep] = useState(1);
  const [trxId, setTrxId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const priceText = `৳${plan.price_taka.toLocaleString('bn-BD')}`;
  const hasBkash = !!bkashNumber && bkashNumber.trim() !== '';

  const copyNumber = async () => {
    if (!hasBkash) return;
    try {
      await navigator.clipboard.writeText(bkashNumber!.trim());
    } catch {
      // Clipboard API unavailable (old browser): select via a temp input.
      const el = document.createElement('input');
      el.value = bkashNumber!.trim();
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goStep2 = () => {
    const id = trxId.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,24}$/.test(id)) {
      setMsg('সঠিক TrxID লিখুন — bKash থেকে পাওয়া ট্রানজাকশন আইডিটি (অক্ষর ও সংখ্যা, কমপক্ষে ৬টি)।');
      return;
    }
    setTrxId(id);
    setMsg('');
    setStep(2);
  };

  const startCooldown = () => {
    setResendIn(60);
    const t = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMsg('সঠিক ইমেইল ঠিকানা লিখুন।'); return; }
    const sb = createSupabaseClient();
    if (!sb) { setMsg('সার্ভার এখনো যুক্ত হয়নি — পরে আবার চেষ্টা করুন।'); return; }
    setBusy(true); setMsg(''); setOkMsg('');
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes('rate limit') || m.includes('too many')) {
        setMsg('অনেকবার চেষ্টা করা হয়েছে — কিছুক্ষণ পরে আবার চেষ্টা করুন।');
      } else {
        setMsg(`OTP পাঠানো যায়নি: ${error.message}`);
      }
      return;
    }
    setOtpSent(true);
    setOkMsg('ইমেইলে ৬ সংখ্যার কোড পাঠানো হয়েছে — ইনবক্স (আর স্প্যাম ফোল্ডারটাও) দেখুন।');
    startCooldown();
  };

  const verifyAndSave = async () => {
    if (!/^\d{6}$/.test(otp.trim())) { setMsg('৬ সংখ্যার OTP কোডটি লিখুন।'); return; }
    const sb = createSupabaseClient();
    if (!sb) { setMsg('সার্ভার এখনো যুক্ত হয়নি — পরে আবার চেষ্টা করুন।'); return; }
    setBusy(true); setMsg('');
    const { error } = await sb.auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: 'email' });
    if (error) {
      setBusy(false);
      const m = error.message.toLowerCase();
      if (m.includes('expired')) {
        setMsg('কোডটির মেয়াদ শেষ হয়ে গেছে — "আবার পাঠান" চাপুন।');
      } else {
        setMsg('ভুল কোড — আবার দেখে লিখুন, অথবা "আবার পাঠান" চাপুন।');
      }
      return;
    }
    // Email verified. Save the purchase request (TrxID + verified email).
    const { error: saveError } = await sb.from('purchase_requests').insert({
      full_name: name.trim(),
      email: email.trim(),
      mobile: '',
      trx_id: trxId.trim(),
      email_verified: true,
      plan_slug: plan.slug,
      plan_name: plan.name,
      price_taka: plan.price_taka,
      status: 'pending',
    });
    setBusy(false);
    if (saveError) {
      const m = saveError.message.toLowerCase();
      if (m.includes('trx_id') || m.includes('email_verified') || m.includes('could not find the') || m.includes('column')) {
        setMsg('অনুরোধ সেভ হয়নি: Supabase-এ 007_pricing_flow.sql ফাইলটি এখনো চালানো হয়নি। মালিককে জানান — ফাইলটি চালালেই এই ফর্ম কাজ করবে।');
      } else if (m.includes('purchase_requests') || m.includes('relation') || m.includes('does not exist')) {
        setMsg('অনুরোধ সেভ হয়নি: Supabase-এ 006_pricing.sql ফাইলটি এখনো চালানো হয়নি। মালিককে জানান।');
      } else {
        setMsg(`অনুরোধ সেভ হয়নি: ${saveError.message}`);
      }
      return;
    }
    setStep(3);
  };

  const stepsBar = (
    <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
      {['১. পেমেন্ট', '২. ইমেইল যাচাই', '৩. সম্পন্ন'].map((label, i) => (
        <span
          key={label}
          className="pill"
          style={{
            padding: '6px 12px', fontSize: 13,
            background: step === i + 1 ? 'linear-gradient(135deg,#7c5cff,#5b8cff)' : undefined,
            color: step === i + 1 ? '#fff' : undefined,
            opacity: step < i + 1 ? 0.55 : 1,
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );

  // STEP 3 — done.
  if (step === 3) {
    return (
      <div className="card" style={{ padding: 28, maxWidth: 560, marginTop: 20, borderColor: 'rgba(52,211,153,.5)', textAlign: 'center' }}>
        <p style={{ fontSize: 40, margin: '0 0 8px' }}>✓</p>
        <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>ধন্যবাদ! আপনার অনুরোধ পেয়েছি।</h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: '0 0 6px' }}>
          পেমেন্ট যাচাইয়ের পর শীঘ্রই আপনি একটি ইমেইল পাবেন, যেখানে আপনার প্রিমিয়াম অ্যাকাউন্টে লগ ইন করার ইমেইল ও পাসওয়ার্ড থাকবে।
        </p>
        <p className="muted" style={{ fontSize: 14, margin: '0 0 20px' }}>
          TrxID: {trxId} · ইমেইল: {email.trim()} (যাচাই হয়েছে ✓)
        </p>
        <Link href="/" className="btn" style={{ justifyContent: 'center' }}>হোমে ফিরুন</Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 24, maxWidth: 560, marginTop: 20 }}>
      {stepsBar}

      {step === 1 && (
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>ধাপ ১ — bKash দিয়ে পেমেন্ট করুন</h2>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: 14 }}>
            {plan.name} — {priceText} {plan.period === 'monthly' ? '/ মাসিক' : plan.period === 'yearly' ? '/ বার্ষিক' : '/ আজীবন'}
          </p>
          {hasBkash ? (
            <div style={{ background: 'var(--accent-soft)', border: '1px solid rgba(124,92,255,.35)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <p className="muted" style={{ margin: '0 0 6px', fontSize: 13 }}>bKash (Send Money) — এই নম্বরে পাঠান:</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 22, letterSpacing: 1 }}>{bkashNumber!.trim()}</strong>
                <button className="btn-ghost" type="button" onClick={() => void copyNumber()}>
                  {copied ? '✓ কপি হয়েছে' : 'কপি করুন'}
                </button>
              </div>
              <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.7 }}>
                ১. bKash অ্যাপ খুলে <strong>Send Money</strong> চাপুন।<br />
                ২. উপরের নম্বরে <strong>{priceText}</strong> পাঠান।<br />
                ৩. পেমেন্ট শেষে bKash থেকে পাওয়া <strong>TrxID</strong> নিচে লিখুন।
              </p>
            </div>
          ) : (
            <div className="empty" style={{ marginBottom: 16 }}>
              bKash নম্বর এখনো দেওয়া হয়নি — মালিক এখনো Admin থেকে নম্বরটি দেননি। পরে আবার চেষ্টা করুন।
            </div>
          )}
          <div className="field"><label>TrxID (ট্রানজাকশন আইডি) *</label>
            <input className="input" value={trxId} onChange={(e) => setTrxId(e.target.value.toUpperCase())} placeholder="যেমন: 9HX7K2M4PQ" disabled={!hasBkash} />
          </div>
          <button className="btn" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} disabled={!hasBkash || busy} onClick={goStep2}>
            পরের ধাপ
          </button>
          {msg && <p className="error" style={{ textAlign: 'center' }}>{msg}</p>}
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>ধাপ ২ — ইমেইল যাচাই করুন</h2>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: 14 }}>
            আপনার ইমেইলে ৬ সংখ্যার একটি কোড (OTP) পাঠানো হবে। TrxID: {trxId}
          </p>
          <div className="field"><label>আপনার নাম (ঐচ্ছিক)</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: রুবায়েদ গাজী" /></div>
          <div className="field"><label>ইমেইল *</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={otpSent} /></div>
          {!otpSent ? (
            <button className="btn" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} disabled={busy} onClick={() => void sendOtp()}>
              {busy ? 'পাঠানো হচ্ছে…' : 'OTP পাঠান'}
            </button>
          ) : (
            <div>
              <div className="field"><label>OTP কোড (৬ সংখ্যা) *</label>
                <input className="input" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="______" inputMode="numeric" style={{ letterSpacing: 6, fontSize: 20, textAlign: 'center' }} />
              </div>
              <button className="btn" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} disabled={busy} onClick={() => void verifyAndSave()}>
                {busy ? 'যাচাই হচ্ছে…' : 'যাচাই করুন'}
              </button>
              <button className="btn-ghost" type="button" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} disabled={busy || resendIn > 0} onClick={() => void sendOtp()}>
                {resendIn > 0 ? `আবার পাঠান (${resendIn} সেকেন্ড)` : 'আবার পাঠান'}
              </button>
            </div>
          )}
          <button className="btn-ghost" type="button" style={{ marginTop: 12 }} onClick={() => { setStep(1); setMsg(''); setOkMsg(''); }}>← আগের ধাপে ফিরুন</button>
          {okMsg && <p className="ok-msg" style={{ textAlign: 'center' }}>{okMsg}</p>}
          {msg && <p className="error" style={{ textAlign: 'center' }}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
