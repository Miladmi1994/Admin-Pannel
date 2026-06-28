import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Modal } from '../components/ui/Modal';

export default function Finance() {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-xl gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">گزارشات مالی</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">نمایش درآمدها و ثبت دستی تراکنش‌ها</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button 
            onClick={() => setIsResetModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full border border-error/50 bg-error/10 px-6 py-3 font-semibold text-error transition-all hover:bg-error/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">restart_alt</span>
            <span>صفر کردن آمار مالی</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-3xl z-0 pointer-events-none"></div>
          <div className="p-4 bg-primary/10 text-primary rounded-full mb-4 z-10 border border-primary/20">
            <span className="material-symbols-outlined text-[40px]">account_balance_wallet</span>
          </div>
          <h3 className="text-on-surface-variant font-label-lg text-label-lg mb-2 z-10">درآمد کل سیستم</h3>
          <p className="font-headline-lg text-headline-lg font-bold text-primary z-10">۱۲۰,۵۰۰,۰۰۰ <span className="font-body-md text-body-md text-on-surface-variant">تومان</span></p>
        </motion.div>
        
        {/* Placeholder for more finance stats or recent transactions */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">تراکنش‌های اخیر</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/30 hover:bg-surface-container-high/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">A</div>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface">خرید پکیج ۳۰ گیگ</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant font-mono">User: 192834</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-label-lg text-label-lg font-bold text-primary">+۱۵۰,۰۰۰ تومان</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">دقایقی پیش</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title={<><span className="material-symbols-outlined text-error text-2xl">warning</span> صفر کردن آمار مالی</>}>
        <div className="text-center">
          <p className="text-on-surface-variant mb-6">آیا از صفر کردن تمامی آمار مالی سیستم اطمینان دارید؟ تمامی گزارشات درآمد پاک خواهد شد و این عملیات غیرقابل بازگشت است.</p>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setIsResetModalOpen(false)} className="px-5 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-variant rounded-full font-label-lg text-label-lg transition-colors cursor-pointer">
              انصراف
            </button>
            <button onClick={() => setIsResetModalOpen(false)} className="px-5 py-2.5 bg-error text-on-error hover:bg-error-container hover:text-on-error-container rounded-full font-label-lg text-label-lg transition-colors flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">restart_alt</span>
              بله، صفر کن
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
