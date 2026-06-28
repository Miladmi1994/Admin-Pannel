import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';

const initialPlans = [
  { id: 1, name: 'پکیج پایه', volume: 30, days: 30, price: '۱۵۰,۰۰۰', popular: false, order: 1, discount: 0 },
  { id: 2, name: 'پکیج استاندارد', volume: 50, days: 30, price: '۲۰۰,۰۰۰', popular: true, order: 2, discount: 0 },
  { id: 3, name: 'پکیج حرفه‌ای', volume: 100, days: 60, price: '۳۵۰,۰۰۰', popular: false, order: 3, discount: 0 },
  { id: 4, name: 'پکیج ویژه VIP', volume: 200, days: 90, price: '۶۰۰,۰۰۰', popular: false, order: 4, discount: 0 },
];

const calculateDiscountedPrice = (priceStr: string, discount: number = 0) => {
  if (!discount || discount <= 0 || discount >= 100) return priceStr;
  const englishDigits = priceStr.replace(/[۰-۹]/g, w => String.fromCharCode(w.charCodeAt(0) - 1728)).replace(/,/g, '');
  const num = Number(englishDigits);
  if (isNaN(num)) return priceStr;
  const discounted = Math.round(num * (1 - discount / 100));
  return new Intl.NumberFormat('fa-IR').format(discounted);
};

export default function Plans() {
  const [plans, setPlans] = useState(initialPlans);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const [formData, setFormData] = useState<any>({});
  
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === index) return;
    
    const sorted = [...plans].sort((a, b) => a.order - b.order);
    const item = sorted[sourceIndex];
    sorted.splice(sourceIndex, 1);
    sorted.splice(index, 0, item);
    
    // Server/Bot sync placeholder: logic would trigger API update here
    setPlans(sorted.map((p, i) => ({ ...p, order: i + 1 })));
  };

  const handleOpenEdit = (plan: any) => {
    setFormData(plan);
    setIsSlideOverOpen(true);
  };

  const handleOpenAdd = () => {
    setFormData({});
    setIsSlideOverOpen(true);
  };

  const handleDeleteClick = (plan: any) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlan) {
      setPlans(prev => prev.filter(p => p.id !== selectedPlan.id));
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      // Edit
      setPlans(prev => prev.map(p => p.id === formData.id ? { ...p, ...formData } : p));
    } else {
      // Add
      const newPlan = {
        ...formData,
        id: Date.now(),
        order: plans.length + 1,
        volume: Number(formData.volume || 0),
        days: Number(formData.days || 0),
        discount: Number(formData.discount || 0),
        price: formData.price || '0',
      };
      setPlans(prev => [...prev, newPlan]);
    }
    setIsSlideOverOpen(false);
  };

  const moveOrder = (id: number, direction: 'up' | 'down') => {
    const currentIndex = plans.findIndex(p => p.id === id);
    if (direction === 'up' && currentIndex > 0) {
      const newPlans = [...plans];
      const temp = newPlans[currentIndex].order;
      newPlans[currentIndex].order = newPlans[currentIndex - 1].order;
      newPlans[currentIndex - 1].order = temp;
      setPlans(newPlans.sort((a, b) => a.order - b.order));
    } else if (direction === 'down' && currentIndex < plans.length - 1) {
      const newPlans = [...plans];
      const temp = newPlans[currentIndex].order;
      newPlans[currentIndex].order = newPlans[currentIndex + 1].order;
      newPlans[currentIndex + 1].order = temp;
      setPlans(newPlans.sort((a, b) => a.order - b.order));
    }
  };

  const sortedPlans = [...plans].sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">مدیریت پکیج‌ها</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">تعریف و اولویت‌بندی پلن‌های اشتراک</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-highest p-1 rounded-xl border border-outline-variant/50 shrink-0">
            <button 
              onClick={() => setLayout('grid')}
              className={cn(
                "p-2 rounded-lg transition-colors cursor-pointer text-on-surface-variant flex items-center justify-center",
                layout === 'grid' && "bg-surface text-primary shadow-sm"
              )}
              title="نمایش کارتی"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button 
              onClick={() => setLayout('list')}
              className={cn(
                "p-2 rounded-lg transition-colors cursor-pointer text-on-surface-variant flex items-center justify-center",
                layout === 'list' && "bg-surface text-primary shadow-sm"
              )}
              title="نمایش خطی"
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
          </div>
          
          <button 
            onClick={handleOpenAdd}
            className="bg-primary text-on-primary hover:bg-primary-fixed transition-all duration-300 font-label-lg text-label-lg py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined">add</span>
            <span>افزودن پکیج جدید</span>
          </button>
        </div>
      </div>

      <div className={cn(
        "gap-6",
        layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "flex flex-col"
      )}>
        <AnimatePresence>
          {sortedPlans.map((plan, i) => (
            <motion.div
              layout
              draggable
              onDragStart={(e: any) => handleDragStart(e, i)}
              onDragOver={(e: any) => handleDragOver(e, i)}
              onDragLeave={(e: any) => handleDragLeave(e, i)}
              onDrop={(e: any) => handleDrop(e, i)}
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "glass-panel relative overflow-hidden group border transition-all cursor-move",
                layout === 'grid' ? "rounded-3xl p-6 flex flex-col gap-4" : "rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                plan.popular ? 'border-primary/50 shadow-[0_0_20px_rgba(78,222,163,0.1)]' : 'border-outline-variant/30',
                dragOverIndex === i ? 'border-primary bg-primary/5 shadow-md -translate-y-1' : ''
              )}
            >
              {plan.popular && layout === 'grid' && (
                <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-bl-xl z-20 shadow-md">
                  پیشنهاد ویژه
                </div>
              )}
              
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full blur-2xl z-0 transition-all ${plan.popular ? 'bg-primary/20 group-hover:bg-primary/30' : 'bg-surface-variant/30 group-hover:bg-primary/10'}`}></div>
              
              {layout === 'grid' ? (
                <>
                  <div className="flex justify-between items-start z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${plan.popular ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant/50'}`}>
                      <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-surface-container-highest w-7 h-7 rounded-full flex items-center justify-center font-bold text-on-surface-variant text-xs border border-outline-variant/30 shadow-sm font-sans">
                        {i + 1}
                      </div>
                      <div className="flex items-center bg-surface-container-highest rounded-full border border-outline-variant/30 p-1 text-on-surface-variant/50">
                        <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mt-2 z-10">{plan.name}</h3>
                  
                  <div className="font-body-sm text-body-sm text-on-surface-variant space-y-3 mb-4 flex-1 z-10">
                    <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">data_usage</span> حجم:</span>
                      <span className="font-bold text-on-surface font-sans">{plan.volume} GB</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> مدت:</span>
                      <span className="font-bold text-on-surface font-sans">{plan.days} Days</span>
                    </div>
                  </div>

                  <div className="mt-auto bg-surface-container-highest/50 rounded-2xl p-4 text-center z-10 border border-outline-variant/30 group-hover:border-primary/30 transition-colors">
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 flex justify-center items-center gap-2">
                      قیمت (تومان)
                      {plan.discount > 0 && <span className="bg-error/10 text-error text-[10px] px-1.5 py-0.5 rounded font-bold border border-error/20">-{plan.discount}%</span>}
                    </p>
                    {plan.discount > 0 ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-on-surface-variant line-through">{plan.price}</span>
                        <span className="font-headline-md text-headline-md font-bold text-primary">{calculateDiscountedPrice(plan.price, plan.discount)}</span>
                      </div>
                    ) : (
                      <p className="font-headline-md text-headline-md font-bold text-primary">{plan.price}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/30 z-10">
                    <button onClick={() => handleOpenEdit(plan)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => handleDeleteClick(plan)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* List Layout */}
                  <div className="flex items-center gap-4 z-10">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bg-surface-container-highest w-6 h-6 rounded-full flex items-center justify-center font-bold text-on-surface-variant text-[10px] border border-outline-variant/30 shadow-sm font-sans">
                        {i + 1}
                      </div>
                      <div className="text-on-surface-variant/50 cursor-move hover:text-on-surface-variant transition-colors">
                        <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${plan.popular ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant/50'}`}>
                      <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-on-surface">{plan.name}</h3>
                        {plan.popular && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-bold border border-primary/20">پیشنهاد ویژه</span>}
                        {plan.discount > 0 && <span className="bg-error/10 text-error text-[10px] px-1.5 py-0.5 rounded font-bold border border-error/20">-{plan.discount}%</span>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                         <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">data_usage</span> <span className="font-sans font-bold">{plan.volume}GB</span></span>
                         <span className="w-1 h-1 rounded-full bg-outline-variant/50"></span>
                         <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> <span className="font-sans font-bold">{plan.days} Days</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-4 w-full sm:w-auto z-10 pl-2 sm:pl-0 mt-4 sm:mt-0">
                    <div className="text-left sm:text-right">
                      <p className="font-label-sm text-[10px] text-on-surface-variant">قیمت (تومان)</p>
                      {plan.discount > 0 ? (
                        <div className="flex flex-col items-start sm:items-end">
                          <span className="text-[10px] text-on-surface-variant line-through">{plan.price}</span>
                          <span className="font-bold text-primary font-sans text-lg leading-tight">{calculateDiscountedPrice(plan.price, plan.discount)}</span>
                        </div>
                      ) : (
                        <p className="font-bold text-primary font-sans text-lg">{plan.price}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenEdit(plan)} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer border border-transparent hover:border-primary/20 bg-surface-container-highest md:bg-transparent" title="ویرایش">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button onClick={() => handleDeleteClick(plan)} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer border border-transparent hover:border-error/20 bg-surface-container-highest md:bg-transparent" title="حذف">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        title={<><span className="material-symbols-outlined text-primary">{formData.id ? 'edit' : 'add_circle'}</span> {formData.id ? 'ویرایش پکیج' : 'افزودن پکیج'}</>}
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">نام پکیج</label>
            <input 
              type="text" 
              required
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-surface-variant border border-outline-variant/50 rounded-full px-5 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50" 
              placeholder="مثال: پکیج طلایی" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">حجم (GB)</label>
              <input 
                type="number" 
                required
                dir="ltr" 
                value={formData.volume || ''}
                onChange={e => setFormData({...formData, volume: e.target.value})}
                className="w-full bg-surface-variant border border-outline-variant/50 rounded-full px-5 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left placeholder:text-on-surface-variant/50" 
                placeholder="50" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">مدت (روز)</label>
              <input 
                type="number" 
                required
                dir="ltr" 
                value={formData.days || ''}
                onChange={e => setFormData({...formData, days: e.target.value})}
                className="w-full bg-surface-variant border border-outline-variant/50 rounded-full px-5 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left placeholder:text-on-surface-variant/50" 
                placeholder="30" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">قیمت پایه (تومان)</label>
              <input 
                type="text" 
                required
                dir="ltr" 
                value={formData.price || ''}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full bg-surface-variant border border-outline-variant/50 rounded-full px-5 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left placeholder:text-on-surface-variant/50" 
                placeholder="200,000" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">درصد تخفیف</label>
              <input 
                type="number" 
                dir="ltr" 
                min="0"
                max="100"
                value={formData.discount || ''}
                onChange={e => setFormData({...formData, discount: e.target.value})}
                className="w-full bg-surface-variant border border-outline-variant/50 rounded-full px-5 py-3 text-on-surface font-body-md focus:outline-none focus:border-error focus:ring-1 focus:ring-error/50 transition-all text-left placeholder:text-on-surface-variant/50" 
                placeholder="مثلا: 20" 
              />
            </div>
          </div>
          
          <div className="pt-4 space-y-3 bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="peer sr-only" 
                  checked={formData.popular || false} 
                  onChange={e => setFormData({...formData, popular: e.target.checked})}
                />
                <div className="w-6 h-6 rounded border border-outline-variant peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100">check</span>
                </div>
              </div>
              <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">پیشنهاد ویژه (نمایش برجسته)</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="w-6 h-6 rounded border border-outline-variant peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100">check</span>
                </div>
              </div>
              <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">نمایش در خرید جدید</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="w-6 h-6 rounded border border-outline-variant peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100">check</span>
                </div>
              </div>
              <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">نمایش در تمدید</span>
            </label>
          </div>

          <button type="submit" className="w-full rounded-full bg-primary py-3 mt-6 font-semibold text-on-primary hover:bg-primary-fixed transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:-translate-y-0.5 transform">
            {formData.id ? 'بروزرسانی پکیج' : 'ذخیره پکیج'}
          </button>
        </form>
      </SlideOver>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={<><span className="material-symbols-outlined text-error text-[24px]">warning</span> حذف پکیج</>}
      >
        <div className="space-y-6">
          <p className="text-on-surface-variant leading-relaxed">
            آیا از حذف پکیج <span className="font-bold text-on-surface">{selectedPlan?.name}</span> اطمینان دارید؟ 
            این عمل غیر قابل بازگشت است و در دیتابیس ربات نیز اعمال خواهد شد.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-variant rounded-lg font-label-lg text-label-lg transition-colors cursor-pointer">
              انصراف
            </button>
            <button onClick={confirmDelete} className="px-5 py-2.5 bg-error text-on-error hover:bg-error-container hover:text-on-error-container rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">delete</span>
              بله، حذف شود
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

