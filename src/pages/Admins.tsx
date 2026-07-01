import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';

const ADMINS = [
  { id: '112233', name: 'مدیر اصلی', role: 'Super Admin', addedAt: '۱۴۰۲/۰۵/۱۲' },
  { id: '445566', name: 'پشتیبان اول', role: 'Dynamic Admin', addedAt: '۱۴۰۲/۰۶/۰۱' },
];

export default function Admins() {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-xl gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">مدیریت مدیران</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">دسترسی‌ها و نقش‌های مدیریتی</p>
        </div>
        <button 
          onClick={() => setIsSlideOverOpen(true)}
          className="bg-primary text-on-primary hover:bg-primary-fixed transition-all duration-300 font-label-lg text-label-lg py-3 px-6 rounded-full flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5 cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          <span>افزودن ادمین جدید</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {ADMINS.map((admin, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full blur-2xl z-0 transition-all ${admin.role === 'Super Admin' ? 'bg-secondary/10 group-hover:bg-secondary/20' : 'bg-primary/10 group-hover:bg-primary/20'}`}></div>
            
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-sm ${admin.role === 'Super Admin' ? 'bg-secondary/20 text-secondary border-secondary/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                  <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{admin.name}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant font-mono mt-1" dir="ltr">{admin.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 text-on-surface-variant hover:text-error hover:bg-surface-variant rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center justify-between text-sm z-10">
              <span className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold border flex items-center gap-1 ${admin.role === 'Super Admin' ? 'border-secondary/20 bg-secondary/10 text-secondary' : 'border-primary/20 bg-primary/10 text-primary'}`}>
                {admin.role === 'Super Admin' && <span className="material-symbols-outlined text-[14px]">star</span>}
                {admin.role}
              </span>
              <span className="text-on-surface-variant font-body-sm text-body-sm">افزودن: {admin.addedAt}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        title={<><span className="material-symbols-outlined text-primary">add_circle</span> افزودن ادمین جدید</>}
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsSlideOverOpen(false); }}>
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-[40px]">person_add</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">نام ادمین</label>
            <input type="text" className="w-full bg-surface-variant border border-outline-variant/50 rounded-full px-5 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50" placeholder="مثال: پشتیبان دوم" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">آیدی عددی تلگرام</label>
            <input type="text" dir="ltr" className="w-full bg-surface-variant border border-outline-variant/50 rounded-full px-5 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left placeholder:text-on-surface-variant/50" placeholder="987654321" />
          </div>

          <button type="submit" className="w-full rounded-full bg-primary py-3 mt-8 font-semibold text-on-primary hover:bg-primary-fixed transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:-translate-y-0.5 transform">
            ثبت ادمین
          </button>
        </form>
      </SlideOver>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={<><span className="material-symbols-outlined text-error text-2xl">warning</span> حذف ادمین</>}>
        <div className="text-center">
          <p className="text-on-surface-variant mb-6">آیا از حذف این ادمین اطمینان دارید؟ دسترسی ایشان به پنل بلافاصله قطع خواهد شد.</p>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-variant rounded-full font-label-lg text-label-lg transition-colors cursor-pointer">
              انصراف
            </button>
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 bg-error text-on-error hover:bg-error-container hover:text-on-error-container rounded-full font-label-lg text-label-lg transition-colors flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">delete_forever</span>
              بله، حذف کن
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
