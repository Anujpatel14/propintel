'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Lock, 
  CreditCard, 
  CheckCircle, 
  Loader2, 
  ArrowLeft,
  Calendar,
  Sparkles
} from 'lucide-react';
import { processCheckoutAction } from './actions';

function SimulateCheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get('plan') || 'PRO';

  // Input states
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• ••••');
  const [cardName, setCardName] = useState('YOUR NAME');
  const [cardExpiry, setCardExpiry] = useState('MM/YY');
  const [cardCVC, setCardCVC] = useState('•••');
  
  const [inputNumber, setInputNumber] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputExpiry, setInputExpiry] = useState('');
  const [inputCVC, setInputCVC] = useState('');

  // App state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Synchronize inputs with visual card display
  useEffect(() => {
    setCardNumber(inputNumber || '•••• •••• •••• ••••');
  }, [inputNumber]);

  useEffect(() => {
    setCardName(inputName.toUpperCase() || 'YOUR NAME');
  }, [inputName]);

  useEffect(() => {
    setCardExpiry(inputExpiry || 'MM/YY');
  }, [inputExpiry]);

  useEffect(() => {
    setCardCVC(inputCVC || '•••');
  }, [inputCVC]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Trigger our server action to upgrade DB status
      const res = await processCheckoutAction(plan);
      if (res.success) {
        setTimeout(() => {
          setLoading(false);
          setSuccess(true);
        }, 1800); // simulated bank authorization delay
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getPrice = () => {
    if (plan === 'ENTERPRISE') return '$99.00';
    if (plan === 'FREE') return '$0.00';
    return '$49.00';
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative Blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-700/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Back */}
      <div className="absolute top-6 left-6 z-10">
        <Link 
          href="/dashboard/billing" 
          className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-teal-800 transition-all font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Billing
        </Link>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch relative z-10 mt-8">
        
        {/* LEFT COLUMN: Order Summary */}
        <div className="md:col-span-5 glass-panel border border-[var(--border)] rounded-2xl p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-700" />
              <span className="font-extrabold text-sm tracking-tight text-foreground">PropIntel Checkout</span>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Subscribing to</span>
              <h2 className="text-xl font-extrabold text-foreground">{plan} Plan Subscription</h2>
              <p className="text-xs text-[var(--muted)]">Recurring invoice billed monthly.</p>
            </div>

            <div className="border-t border-[var(--border)] pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs text-[var(--muted)]">
                <span>Core Platform License</span>
                <span className="text-foreground font-medium">{getPrice()}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-[var(--muted)]">
                <span>Taxes & Processing</span>
                <span className="text-foreground font-medium">$0.00</span>
              </div>
              <div className="flex justify-between items-center text-xs text-teal-800 bg-teal-700/10 border border-teal-700/20 p-2.5 rounded-lg">
                <span>7-Day Trial Waiver</span>
                <span className="font-bold">-$0.00</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6 text-right">
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-wider block">Due Today</span>
            <div className="text-3xl font-extrabold text-foreground mt-1">{getPrice()}</div>
          </div>
        </div>

        {/* RIGHT COLUMN: Payment Portal Forms */}
        <div className="md:col-span-7 glass-panel border border-[var(--border)] rounded-2xl p-8 flex flex-col justify-center relative">
          
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="checkout-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Visual Credit Card */}
                <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-slate-950 p-6 border border-[var(--border)] flex flex-col justify-between shadow-2xl overflow-hidden">
                  <div className="absolute right-0 bottom-0 w-32 h-32 bg-teal-700/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-sm tracking-wide text-[var(--muted)]">PropIntel Card</span>
                    <CreditCard className="w-6 h-6 text-teal-700" />
                  </div>
                  
                  <div className="text-base sm:text-lg font-mono tracking-[0.2em] text-foreground">
                    {cardNumber}
                  </div>

                  <div className="flex justify-between items-end text-xs">
                    <div>
                      <span className="text-[8px] text-[var(--muted-foreground)] uppercase font-semibold block">Cardholder</span>
                      <span className="font-bold text-[var(--muted)] tracking-wide">{cardName}</span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-[8px] text-[var(--muted-foreground)] uppercase font-semibold block">Expires</span>
                        <span className="font-bold text-[var(--muted)]">{cardExpiry}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-[var(--muted-foreground)] uppercase font-semibold block">CVC</span>
                        <span className="font-bold text-[var(--muted)]">{cardCVC}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--muted)] font-semibold uppercase">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="w-full glass-input px-3.5 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[var(--muted)] font-semibold uppercase">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      maxLength={19}
                      value={inputNumber}
                      onChange={(e) => setInputNumber(e.target.value)}
                      className="w-full glass-input px-3.5 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-[var(--muted)] font-semibold uppercase">Expiration</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        maxLength={5}
                        value={inputExpiry}
                        onChange={(e) => setInputExpiry(e.target.value)}
                        className="w-full glass-input px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[var(--muted)] font-semibold uppercase">CVC Code</label>
                      <input
                        type="text"
                        required
                        placeholder="123"
                        maxLength={4}
                        value={inputCVC}
                        onChange={(e) => setInputCVC(e.target.value)}
                        className="w-full glass-input px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal-700 hover:bg-teal-600 disabled:bg-teal-700/50 text-white font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg "
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {loading ? 'Authorizing Payment...' : `Authorize & Activate ${plan}`}
                  </button>
                </form>
              </motion.div>
            ) : (
              // Payment Success screen
              <motion.div
                key="success-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6 flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-teal-700/10 flex items-center justify-center border border-emerald-500/25">
                  <CheckCircle className="w-8 h-8 text-teal-800 animate-bounce" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-foreground">Payment Successful!</h3>
                  <p className="text-sm text-[var(--muted)] max-w-sm leading-relaxed">
                    Thank you! Your credit card was authorized, and your subscription has been successfully upgraded to **{plan}**.
                  </p>
                </div>

                <div className="pt-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-600 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs shadow-lg shadow-emerald-500/20"
                  >
                    Go to Workspace <Sparkles className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}

export default function SimulateCheckoutPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] text-slate-100 flex flex-col justify-center items-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      </div>
    }>
      <SimulateCheckoutPageContent />
    </React.Suspense>
  );
}
