import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (step === 2) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = userId.trim();
    if (!id || !/^\d+$/.test(id)) {
      showMessage('لطفاً آیدی عددی تلگرام را به درستی وارد کنید.', 'error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType(null);

    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: id }),
      });
      const data = await res.json();

      if (data.success) {
        setStep(2);
        showMessage('کد تایید به پی‌وی تلگرام شما ارسال شد.', 'success');
      } else {
        showMessage(data.message || 'دسترسی مجاز نیست.', 'error');
      }
    } catch {
      showMessage('خطا در ارتباط با سرور.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillOtp = (digits: string[]) => {
    const next = ['', '', '', '', ''];
    digits.slice(0, 5).forEach((d, i) => {
      next[i] = d;
    });
    setOtp(next);
    const focusIndex = Math.min(digits.length, 4);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;

    if (value.length > 1) {
      fillOtp(value.split(''));
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasted) fillOtp(pasted.split(''));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length < 5) {
      showMessage('لطفاً کد ۵ رقمی را کامل وارد کنید.', 'error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType(null);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userId.trim(), code }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminTelegramId', userId.trim());
        onLogin();
      } else {
        showMessage(data.message || 'کد نامعتبر است.', 'error');
      }
    } catch {
      showMessage('خطا در ارتباط با سرور.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetToStep1 = () => {
    setStep(1);
    setMessage('');
    setMessageType(null);
    setOtp(['', '', '', '', '']);
  };

  return (
    <div className="relative isolate flex min-h-screen w-full items-center justify-center overflow-y-auto bg-background px-4 py-8 font-sans text-on-background rtl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-secondary/10 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] rounded-3xl border border-outline-variant/30 bg-surface-container/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_24px_rgba(78,222,163,0.15)]">
            <span
              className="material-symbols-outlined text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
          </div>
          <h1
            className="mb-1 text-[28px] font-bold leading-tight text-primary"
            style={{ textShadow: '0 0 12px rgba(78, 222, 163, 0.35)' }}
          >
            زمرد
          </h1>
          <p className="text-sm text-on-surface-variant">ورود به پنل مدیریت</p>

          <div className="mt-5 flex items-center justify-center gap-2">
            <span
              className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-8 bg-primary' : 'w-3 bg-outline-variant/60'}`}
            />
            <span
              className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-8 bg-primary' : 'w-3 bg-outline-variant/60'}`}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {message && messageType && (
            <motion.div
              key={message}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-5 rounded-xl border px-4 py-3 text-center text-sm leading-relaxed ${
                messageType === 'success'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-error/30 bg-error/10 text-error'
              }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSendCode}
              className="space-y-5"
            >
              <div className="flex flex-col gap-2">
                <label htmlFor="telegram-id" className="pr-1 text-sm font-semibold text-on-surface-variant">
                  آیدی عددی تلگرام
                </label>
                <input
                  id="telegram-id"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  dir="ltr"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456789"
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface-variant px-4 py-3 font-mono text-left text-base text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                  disabled={loading}
                />
                <p className="pr-1 text-xs text-on-surface-variant/80">
                  فقط ادمین‌های ثبت‌شده در ربات می‌توانند وارد شوند.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !userId.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-on-primary shadow-[0_0_20px_rgba(78,222,163,0.25)] transition-all hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    در حال بررسی...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    ارسال کد به تلگرام
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleLogin}
              className="space-y-5"
            >
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-high/50 px-4 py-3 text-center">
                <p className="text-xs text-on-surface-variant">کد به آیدی زیر در تلگرام ارسال شد</p>
                <p className="mt-1 font-mono text-sm text-on-surface" dir="ltr">
                  {userId}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-center text-sm font-semibold text-on-surface-variant">
                  کد ۵ رقمی تایید
                </label>
                <div
                  className="mx-auto grid w-full max-w-[280px] grid-cols-5 gap-2 sm:gap-3"
                  dir="ltr"
                  onPaste={handleOtpPaste}
                >
                  {[0, 1, 2, 3, 4].map((index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={otp[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={loading}
                      className="aspect-square w-full min-w-0 rounded-xl border border-outline-variant/50 bg-surface-variant text-center text-lg font-bold text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-xl"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length < 5}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-on-primary shadow-[0_0_20px_rgba(78,222,163,0.25)] transition-all hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'در حال ورود...' : 'ورود به پنل'}
              </button>

              <button
                type="button"
                onClick={resetToStep1}
                disabled={loading}
                className="flex w-full items-center justify-center gap-1.5 text-sm text-on-surface-variant transition-colors hover:text-primary disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                تغییر آیدی تلگرام
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
