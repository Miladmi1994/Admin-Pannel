import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';

export default function Admins() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', telegramId: '' });
  const [error, setError] = useState('');

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admins');
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'خطا در ثبت ادمین');
        return;
      }
      setFormData({ name: '', telegramId: '' });
      setIsSlideOverOpen(false);
      fetchAdmins();
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    }
  };

  const handleDelete = async () => {
    if (!selectedAdminId) return;
    try {
      const res = await fetch(`/api/admins/${selectedAdminId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'خطا در حذف ادمین');
        return;
      }
      fetchAdmins();
    } catch (err) {
      alert('خطا در ارتباط با سرور');
    }
    setIsDeleteModalOpen(false);
    setSelectedAdminId(null);
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-xl gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">مدیریت مدیران</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">دسترسی‌ها و نقش‌های مدیریتی</p>
        </div>
        <button 
          onClick={() => { setError(''); setIsSlideOverOpen(true); }}
          className="bg-primary text-on-primary hover:bg-primary-fixed transition-all duration-300 font-label-lg text-label-lg py-3 px-6 rounded-full flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5 cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          <span>افزودن ادمین جدید</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center bg-surface-container rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary text-[40px] mb-4">progress_activity</span>
          <p className="text-on-surface-variant text-lg">در حال دریافت لیست ادمین‌ها...</p>
        </div>
      ) : admins.length === 0 ? (
        <div className="py-16 text-center bg-surface-container rounded-2xl border border-outline-variant/30">
          <p className="text-on-surface-variant text-lg">ادمینی در دیتابیس ثبت نشده است.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map((admin, i) => (
            <motion.div
              key={admin.id}
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
                  onClick={() => { setSelectedAdminId(admin.id); setIsDeleteModalOpen(true); }}
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
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        title={<><span className="material-symbols-outlined text-primary">add_circle</span> افزودن ادمین جدید</>}
      >
        <form className="space-y-4" onSubmit={handleAdd}>
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-[40px]">person_add</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">نام ادمین</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-surface-variant border border-outline-variant/50 rounded-full px-5 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50"
              placeholder="مثال: پشتیبان دوم"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">آیدی عددی تلگرام</label>
            <input
              required
              type="text"
              dir="ltr"
              value={formData.telegramId}
              onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
              className="w-full bg-surface-variant border border-outline-variant/50 rounded-full px-5 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left placeholder:text-on-surface-variant/50"
              placeholder="987654321"
            />
          </div>
          {error && <p className="text-error text-sm text-center">{error}</p>}
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
            <button onClick={handleDelete} className="px-5 py-2.5 bg-error text-on-error hover:bg-error-container hover:text-on-error-container rounded-full font-label-lg text-label-lg transition-colors flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">delete_forever</span>
              بله، حذف کن
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
