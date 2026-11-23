'use client';
import { useState } from 'react';
import { createSupabaseClient, type PricingPlan } from '@skillsbhandar/shared';

/**
 * Buy-premium form: name, email, mobile. It saves a real purchase
 * REQUEST to Supabase (purchase_requests table) — it does NOT take any
 * payment. After submitting, the visitor is told the owner will contact
 * them to complete payment. Errors are shown in Bengali, never silently.
 */
export default function BuyForm({ plans, initialPlan }: { plans: PricingPlan[]; initialPlan: string }) {
  const active = plans.filter((p) => p.is_active && p.price_taka > 0);
  const [planSlug, setPlanSlug] = useState(initialPlan && active.some((p) => p.slug === initialPlan) ? initialPlan : (active[0]?.slug || ''));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!planSlug) { setMsg('প্রথমে একটি প্ল্যান বেছে নিন।'); return; }
    if (!name.trim() || !email.trim() || !mobile.trim()) { setMsg('নাম, ইমেইল ও মোবাইল নম্বর — তিনটিই লিখুন।'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMsg('সঠিক ইমেইল ঠিকানা লিখুন।'); return; }
    const sb = createSupabaseClient();
    if (!sb) { setMsg('সার্ভার এখনো যুক্ত হয়নি — পরে আবার চেষ্টা করুন।'); return; }
    const plan = active.find((p) => p.slug === planSlug);
    setBusy(true); setMsg('');
    const { error } = await sb.from('purchase_requests').insert({
      full_name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      plan_slug: planSlug,
      plan_name: plan?.name || planSlug,
      price_taka: plan?.price_taka || 0,
      status: 'pending',
    });
    setBusy(false);
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes('purchase_requests') || m.includes('relation') || m.includes('does not exist') || m.includes('could not find the table')) {
        setMsg('অনুরোধ পাঠানো যায়নি: Supabase-এ 006_pricing.sql ফাইলটি এখনো চালানো হয়নি। মালিককে জানান — ফাইলটি চালালেই এই ফর্ম কাজ করবে।');
      } else if (m.includes('row-level security') || m.includes('policy')) {
        setMsg('অনুরোধ পাঠানো যায়নি: অনুমতির সমস্যা। মালিককে জানান — Supabase-এ 006_pricing.sql ফাইলটি চালাতে হবে।');
      } else {
        setMsg(`অনুরোধ পাঠানো যায়নি: ${error.message}`);
      }
      return;
    }
    setOk(true);
    setMsg('আপনার অনুরোধ পেয়েছি! পেমেন্ট সম্পন্ন করতে মালিক শীঘ্রই আপনার সাথে যোগাযোগ করবেন (ইমেইল বা মোবাইলে)। এখনো কোনো টাকা নেওয়া হয়নি।');
  };

  if (ok) {
    return (
      <div className="card" style={{ padding: 24, maxWidth: 560, marginTop: 20, borderColor: 'rgba(52,211,153,.5)' }}>
        <p className="ok-msg" style={{ fontSize: 16, margin: 0 }}>{msg}</p>
        <p className="muted" style={{ marginTop: 10 }}>ধন্যবাদ, {name.trim()}! আপনার অনুরোধটি সংরক্ষিত হয়েছে।</p>
      </div>
    );
  }
  if (active.length === 0) return <div className="empty" style={{ marginTop: 20 }}>এখনো কোনো প্রিমিয়াম প্ল্যান নেই।</div>;
  return (
    <div className="card" style={{ padding: 24, maxWidth: 560, marginTop: 20 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>প্রিমিয়াম কিনুন</h2>
      <p className="muted" style={{ margin: '0 0 6px', fontSize: 14 }}>
        ফর্মটি পূরণ করুন — এটি শুধু একটি অনুরোধ। কোনো টাকা এখন নেওয়া হবে না; পেমেন্ট সম্পন্ন করতে মালিক আপনার সাথে যোগাযোগ করবেন।
      </p>
      <div className="field"><label>প্ল্যান বেছে নিন *</label>
        <select className="input" value={planSlug} onChange={(e) => setPlanSlug(e.target.value)}>
          {active.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name} — ৳{p.price_taka.toLocaleString('bn-BD')}</option>
          ))}
        </select>
      </div>
      <div className="field"><label>আপনার নাম *</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: রুবায়েদ গাজী" /></div>
      <div className="field"><label>ইমেইল *</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
      <div className="field"><label>মোবাইল নম্বর *</label><input className="input" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="01XXXXXXXXX" /></div>
      <button className="btn" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} disabled={busy} onClick={submit}>
        {busy ? 'পাঠানো হচ্ছে…' : 'অনুরোধ পাঠান'}
      </button>
      {msg && <p className="error" style={{ textAlign: 'center' }}>{msg}</p>}
    </div>
  );
}
