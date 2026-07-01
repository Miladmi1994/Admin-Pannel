import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState('');
  
  // آرایه‌ای برای مدیریت ۵ کادر کد تایید
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // مرحله ۱: درخواست ارسال کد به تلگرام
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userId })
      });
      const data = await res.json();
      
      if (data.success) {
        setStep(2);
        setMessage('✅ کد تایید پیامک شد');
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (err) {
      setMessage('❌ خطای ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // مدیریت تایپ در کادرهای ۵ گانه
  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return; // فقط اجازه تایپ عدد
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // پرش خودکار به کادر بعدی
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // برگشت خودکار به کادر قبلی با دکمه پاک کردن (Backspace)
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // مرحله ۲: بررسی کد و لاگین نهایی
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    
    if (code.length < 5) {
      setMessage('❌ لطفاً کد ۵ رقمی را کامل وارد کنید.');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userId, code })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminTelegramId', userId);
        onLogin(); // فراخوانی تابع والد برای نمایش داشبورد
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (err) {
      setMessage('❌ خطای ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-on-background p-4 rtl">
      {/* Decorative Background Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-3xl glass-panel p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl relative z-10"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(78,222,163,0.15)]">
            <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <h1 className="mb-2 font-headline-lg text-headline-lg text-primary" style={{ textShadow: '0 0 10px rgba(78, 222, 163, 0.4)' }}>زمرد</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">ورود به پنل مدیریت ربات</p>
        </div>

        {/* نمایش پیام‌های خطا یا موفقیت */}
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-3 rounded-xl text-sm font-medium text-center ${message.includes('✅') ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
          >
            {message}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSendCode}
            >
              <div className="mb-6 flex flex-col gap-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">آیدی عددی تلگرام</label>
                <input 
                  type="text" 
                  dir="ltr" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="مثال: 123456789" 
                  className="w-full bg-surface-variant border border-outline-variant/50 rounded-full px-5 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left placeholder:text-on-surface-variant/50 font-mono" 
                  autoFocus
                  disabled={loading}
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-on-primary hover:bg-primary-fixed transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:-translate-y-0.5 transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'در حال بررسی...' : 'ارسال کد تایید'}</span>
                {!loading && <span className="material-symbols-outlined text-[20px]">arrow_back</span>}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleLogin}
            >
              <div className="mb-6 flex flex-col gap-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">کد تایید پیامک شده</label>
                <div className="flex gap-2 justify-center" dir="ltr">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <input 
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text" 
                      maxLength={1}
                      value={otp[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={loading}
                      className="h-14 w-12 rounded-2xl bg-surface-variant border border-outline-variant/50 text-center text-xl font-bold text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                    />
                  ))}
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary py-3 font-semibold text-on-primary hover:bg-primary-fixed transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:-translate-y-0.5 transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'در حال ورود...' : 'ورود به پنل'}
              </button>
              <button 
                type="button"
                onClick={() => { setStep(1); setMessage(''); setOtp(['','','','','']); }}
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                <span>بازگشت و اصلاح آیدی</span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}