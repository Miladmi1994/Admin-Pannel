import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) setStep(2);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim()) onLogin();
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
                />
              </div>
              <button 
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-on-primary hover:bg-primary-fixed transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:-translate-y-0.5 transform"
              >
                <span>ارسال کد تایید</span>
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
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
                  {[1, 2, 3, 4, 5].map((i) => (
                    <input 
                      key={i}
                      type="text" 
                      maxLength={1}
                      className="h-14 w-12 rounded-2xl bg-surface-variant border border-outline-variant/50 text-center text-xl font-bold text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                      onChange={(e) => {
                        if (e.target.value && i === 5) setOtp('12345');
                      }}
                    />
                  ))}
                </div>
              </div>
              <button 
                type="submit"
                className="w-full rounded-full bg-primary py-3 font-semibold text-on-primary hover:bg-primary-fixed transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:-translate-y-0.5 transform"
              >
                ورود به پنل
              </button>
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="mt-4 flex w-full items-center justify-center gap-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary cursor-pointer"
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
