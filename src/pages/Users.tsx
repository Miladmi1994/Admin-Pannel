import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';

const initialUsers = [
  { 
    id: '439281', username: 'alireza', status: 'عادی', isActive: true,
    configs: [
      { id: '1', name: 'سایفر ۱ 🇩🇪', planName: 'بسته ۵۰ گیگ ۳۰ روزه', email: 'User_439281_Ord123_170000', server: 'آلمان ۱ - Hetzner', volumeTotal: 50, volumeUsed: 10, timeRemain: 20 }
    ]
  },
  { 
    id: '278963307', username: '278963307', status: 'مسدود', isActive: false,
    configs: [
      { id: '2', name: 'سایفر ۱ 🇳🇱', planName: 'بسته ۳۰ گیگ ۳۰ روزه', email: 'User_192834_Ord124_170000', server: 'هلند - VIP', volumeTotal: 30, volumeUsed: 30, timeRemain: 0 }
    ]
  },
  { 
    id: '984321', username: 'mhd_dev', status: 'VIP', isActive: true,
    configs: [
      { id: '3', name: 'سایفر ۱ 🇩🇪', planName: 'نامحدود یک ماهه', email: 'User_984321_Ord125_170000', server: 'آلمان ۱ - Hetzner', volumeTotal: 0, volumeUsed: 120, timeRemain: 12 },
      { id: '4', name: 'سایفر ۲ (VIP) 🇳🇱', planName: 'نامحدود دو ماهه', email: 'User_984321_Ord126_170000', server: 'هلند - VIP', volumeTotal: 0, volumeUsed: 10, timeRemain: 22 }
    ]
  },
  { 
    id: '534211', username: 'nima2x', status: 'عادی', isActive: true,
    configs: []
  },
];

export default function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [activeTab, setActiveTab] = useState('همه کاربران');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [vipTab, setVipTab] = useState<'new' | 'old'>('new');
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const [isPurchaseSlideOpen, setIsPurchaseSlideOpen] = useState(false);
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [purchaseDropdownOpen, setPurchaseDropdownOpen] = useState(false);
  const [selectedPurchasePlan, setSelectedPurchasePlan] = useState('پکیج ۳۰ گیگ - ۱۵۰,۰۰۰ تومان');
  
  const [actionTargetId, setActionTargetId] = useState<string>('');
  const [actionConfigId, setActionConfigId] = useState<string>('');

  const handleOpenPurchase = () => {
    // Generate random order ID
    const ord = 'ORD-' + Math.floor(Math.random() * 1000000);
    setPurchaseOrderId(ord);
    setIsPurchaseSlideOpen(true);
  };

  const TABS = ['همه کاربران', 'کاربران VIP', 'کاربران عادی', 'مسدود شده‌ها'];

  const handleAction = (type: string, targetId?: string, configId?: string) => {
    setModalType(type);
    if (targetId) setActionTargetId(targetId);
    if (configId) setActionConfigId(configId);
    setIsModalOpen(true);
  };

  const handleToggleBlockStatus = (userId: string, currentStatus: string) => {
    handleAction(currentStatus === 'مسدود' ? 'رفع مسدودی' : 'مسدود کردن', userId);
  };

  const handleToggleVipStatus = (userId: string, currentStatus: string) => {
    handleAction(currentStatus === 'VIP' ? 'حذف از VIP' : 'ارتقا به VIP', userId);
  };

  const handleSendConfig = (userId: string, configId: string, type: '1' | '2') => {
    handleAction(`ارسال کانفیگ ${type}`, userId, configId);
  };

  const handleRenewConfig = (userId: string, configId: string) => {
    handleAction('تمدید کانفیگ', userId, configId);
  };

  const executeAction = () => {
    if (modalType === 'مسدود کردن' || modalType === 'رفع مسدودی') {
       setUsers(prev => prev.map(u => u.id === actionTargetId ? { ...u, status: modalType === 'مسدود کردن' ? 'مسدود' : 'عادی' } : u));
    } else if (modalType === 'ارتقا به VIP' || modalType === 'حذف از VIP') {
       setUsers(prev => prev.map(u => u.id === actionTargetId ? { ...u, status: modalType === 'ارتقا به VIP' ? 'VIP' : 'عادی' } : u));
    } else if (modalType === 'تمدید کانفیگ') {
       // Mock action - the actual renewal rules are applied via the bot's server code
       console.log(`Renewing config ${actionConfigId} for user ${actionTargetId} according to bot rules`);
    } else if (modalType === 'ریست کامل حساب') {
       setUsers(prev => prev.map(u => u.id === actionTargetId ? {
         ...u,
         configs: u.configs?.map(c => ({ ...c, volumeUsed: 0, timeRemain: 30 }))
       } : u));
    } else if (modalType === 'پاک کردن سابقه تست') {
        // Mock action
        console.log(`Clearing test history for ${actionTargetId}`);
    }
    setIsModalOpen(false);
  };

  const toggleExpand = (userId: string) => {
    setExpandedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'فعال': return 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(78,222,163,0.2)]';
      case 'VIP': return 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'مسدود': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface-variant text-on-surface-variant border-outline-variant/30';
    }
  };

  const filteredUsers = users.filter(user => {
    if (activeTab === 'کاربران VIP') return user.status === 'VIP';
    if (activeTab === 'کاربران عادی') return user.status === 'عادی';
    if (activeTab === 'مسدود شده‌ها') return user.status === 'مسدود';
    return true; // همه کاربران
  }).filter(user => 
    user.id.includes(searchTerm)
  );

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">مدیریت کاربران</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">لیست اعضا و مدیریت دسترسی‌ها</p>
        </div>
        
        <div className="flex items-center w-full md:w-auto mt-4 md:mt-0 gap-3">
          <button 
            onClick={handleOpenPurchase}
            className="w-full md:w-auto bg-surface-container-highest text-on-surface hover:bg-surface-variant transition-all duration-300 font-label-lg text-label-lg py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 border border-outline-variant/30 hover:border-primary/50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
            <span>ثبت دستی خرید</span>
          </button>
          <button 
            onClick={() => setIsSlideOverOpen(true)}
            className="w-full md:w-auto bg-primary text-on-primary hover:bg-primary-fixed transition-all duration-300 font-label-lg text-label-lg py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>افزودن VIP جدید</span>
          </button>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="glass-panel p-4 rounded-2xl border border-outline-variant/30 flex flex-col lg:flex-row justify-between gap-4 mb-8">
        <div className="flex bg-surface-container-highest p-1 rounded-xl w-full lg:w-auto overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer whitespace-nowrap",
                activeTab === tab ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="relative w-full lg:w-80 group">
          <input 
            type="text" 
            placeholder="جستجوی آیدی یا نام..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-highest border border-outline-variant/50 rounded-xl py-2.5 pl-4 pr-11 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
          />
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors pointer-events-none text-[20px]">search</span>
        </div>
      </div>

      {/* Users List */}
      <div className="flex flex-col gap-4">
        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center bg-surface-container rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/30 text-[64px] mb-4">group_off</span>
            <p className="text-on-surface-variant text-lg">کاربری با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          filteredUsers.map((user, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              key={user.id} 
              className={`glass-panel rounded-2xl p-4 md:p-6 flex flex-col relative overflow-hidden group border border-outline-variant/30 hover:border-primary/30 hover:shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-all ${user.status === 'VIP' ? 'border-amber-500/30' : user.status === 'مسدود' ? 'border-error/30' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleExpand(user.id)}
                    className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-surface-container-highest hover:bg-surface-variant transition-colors border border-outline-variant/50 cursor-pointer text-on-surface-variant hover:text-primary"
                  >
                    <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: expandedUsers.includes(user.id) ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      {expandedUsers.includes(user.id) ? 'remove' : 'add'}
                    </span>
                  </button>
                  <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border shadow-sm ${user.status === 'VIP' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : user.status === 'مسدود' ? 'bg-error/10 border-error/30 text-error' : 'bg-primary/10 border-primary/30 text-primary'}`}>
                    <span className="material-symbols-outlined text-[24px]">
                      {user.status === 'VIP' ? 'workspace_premium' : user.status === 'مسدود' ? 'person_off' : 'person'}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-3">
                      <span className="font-mono">{user.id}</span>
                    </h3>
                    {user.username && (
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-0.5">
                        <a href={`https://t.me/${user.username.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline hover:text-primary-fixed transition-colors dir-ltr">
                          @{user.username.replace('@', '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 justify-start md:justify-end pr-14 md:pr-0">
                  <button onClick={() => handleToggleVipStatus(user.id, user.status)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border border-transparent bg-surface-container-highest md:bg-transparent ${user.status === 'VIP' ? 'text-amber-500 bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-on-surface-variant hover:text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30'}`} title={user.status === 'VIP' ? 'حذف از VIP' : 'ارتقا به VIP'}>
                    <span className="material-symbols-outlined text-[20px]">{user.status === 'VIP' ? 'workspace_premium' : 'star_outline'}</span>
                  </button>
                  <button onClick={() => handleToggleBlockStatus(user.id, user.status)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 cursor-pointer border border-transparent bg-surface-container-highest md:bg-transparent ${user.status === 'مسدود' ? 'text-error bg-error/10 border-error/30' : 'text-primary bg-primary/10 border-primary/30'}`} title={user.status === 'مسدود' ? 'رفع مسدودی' : 'مسدود کردن'}>
                    <span className="material-symbols-outlined text-[20px]">{user.status === 'مسدود' ? 'person_off' : 'person_check'}</span>
                  </button>
                  <button onClick={() => handleAction('پاک کردن سابقه تست', user.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer border border-transparent hover:border-amber-500/30 bg-surface-container-highest md:bg-transparent" title="پاک کردن سابقه تست">
                    <span className="material-symbols-outlined text-[20px]">cleaning_services</span>
                  </button>
                  <button onClick={() => handleAction('ریست کامل حساب', user.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer border border-transparent hover:border-error/30 bg-surface-container-highest md:bg-transparent" title="ریست کامل حساب">
                    <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedUsers.includes(user.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-outline-variant/30">
                      <h4 className="font-label-lg text-label-lg text-on-surface mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-primary">router</span>
                        کانفیگ‌های کاربر
                      </h4>
                      {user.configs && user.configs.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {user.configs.map(conf => (
                            <div key={conf.id} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl border border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-3 w-full md:w-1/3">
                                <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface shrink-0">
                                  <span className="material-symbols-outlined text-[20px]">dns</span>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-on-surface text-sm truncate">{conf.name}</span>
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold whitespace-nowrap">{conf.planName}</span>
                                  </div>
                                  <span className="text-[11px] text-on-surface-variant truncate font-mono" dir="ltr">{conf.email}</span>
                                  <span className="text-[11px] text-primary truncate mt-0.5">{conf.server}</span>
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-[200px]">
                                 <div className="flex justify-between text-xs mb-1.5">
                                   <span className="text-on-surface-variant flex gap-1">
                                     مصرف:
                                     {conf.volumeTotal === 0 ? (
                                       <span className="font-mono text-on-surface" dir="ltr">{conf.volumeUsed}GB</span>
                                     ) : (
                                       <span className="font-mono text-on-surface" dir="ltr">{conf.volumeUsed}GB / {conf.volumeTotal}GB</span>
                                     )}
                                   </span>
                                   <span className="text-on-surface-variant font-mono">{conf.timeRemain} روز</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden flex" dir="ltr">
                                   {conf.volumeTotal === 0 ? (
                                     <div className="h-full bg-primary rounded-full w-full opacity-50"></div>
                                   ) : (
                                     <div className={`h-full rounded-full transition-all ${conf.volumeUsed / conf.volumeTotal > 0.8 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${Math.min(100, (conf.volumeUsed / conf.volumeTotal) * 100)}%` }}></div>
                                   )}
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0 justify-end md:mr-4">
                                <button onClick={() => handleSendConfig(user.id, conf.id, '1')} className="w-10 h-10 bg-surface-variant text-on-surface hover:bg-primary/20 hover:text-primary transition-colors rounded-lg flex items-center justify-center border border-transparent hover:border-primary/20" title="ارسال کانفیگ ۱">
                                  <span className="font-mono text-sm font-bold">1</span>
                                </button>
                                <button onClick={() => handleSendConfig(user.id, conf.id, '2')} className="w-10 h-10 bg-surface-variant text-on-surface hover:bg-primary/20 hover:text-primary transition-colors rounded-lg flex items-center justify-center border border-transparent hover:border-primary/20" title="ارسال کانفیگ ۲">
                                  <span className="font-mono text-sm font-bold">2</span>
                                </button>
                                <button onClick={() => handleRenewConfig(user.id, conf.id)} className="w-10 h-10 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors rounded-lg border border-blue-500/20 flex items-center justify-center" title="تمدید کانفیگ">
                                  <span className="material-symbols-outlined text-[18px]">autorenew</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-surface-container rounded-xl border border-outline-variant/30 text-on-surface-variant text-sm">
                          کاربر هیچ کانفیگی ندارد.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        title={<><span className="material-symbols-outlined text-primary">add_circle</span> افزودن کاربر VIP</>}
      >
        <div className="space-y-6">
          <div className="flex bg-surface-container-highest p-1 rounded-xl border border-outline-variant/50">
            <button 
              type="button"
              onClick={() => setVipTab('new')}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                vipTab === 'new' ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              👤 کاربر جدید
            </button>
            <button 
              type="button"
              onClick={() => setVipTab('old')}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                vipTab === 'old' ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              🔄 کاربر قدیمی
            </button>
          </div>
          
          <form className="space-y-4 w-full" onSubmit={(e) => { e.preventDefault(); setIsSlideOverOpen(false); }}>
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">آیدی عددی کاربر (تلگرام)</label>
              <input type="text" dir="ltr" className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50 text-left" placeholder="مثال: 123456789" />
            </div>
            
            <AnimatePresence>
              {vipTab === 'old' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="flex flex-col gap-2">
                    <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">UUID کانفیگ مربوطه</label>
                    <input type="text" dir="ltr" className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50 text-left" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">ایمیل (Email) ثبت شده در پنل</label>
                    <input type="text" dir="ltr" className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50 text-left" placeholder="User_123456789_Ord..." />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="pt-4 border-t border-outline-variant/30 mt-6 w-full">
              <button type="submit" className="w-full rounded-lg bg-primary py-2.5 font-label-lg text-label-lg font-bold text-on-primary hover:bg-primary-fixed transition-colors shadow-[0_0_20px_rgba(78,222,163,0.3)] cursor-pointer hover:-translate-y-0.5 transform">
                {vipTab === 'new' ? 'ثبت کاربر جدید VIP' : 'اتصال کانفیگ و ثبت VIP'}
              </button>
            </div>
          </form>
        </div>
      </SlideOver>

      <SlideOver 
        isOpen={isPurchaseSlideOpen} 
        onClose={() => setIsPurchaseSlideOpen(false)} 
        title={<><span className="material-symbols-outlined text-primary">add_circle</span> ثبت دستی خرید</>}
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsPurchaseSlideOpen(false); }}>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">آیدی عددی کاربر هدف</label>
            <input type="text" dir="ltr" className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left placeholder:text-on-surface-variant/50" placeholder="123456789" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">انتخاب پکیج</label>
            <div className="relative">
              <div 
                onClick={() => setPurchaseDropdownOpen(!purchaseDropdownOpen)}
                className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer flex justify-between items-center"
              >
                <span>{selectedPurchasePlan}</span>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${purchaseDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </div>
              <AnimatePresence>
                {purchaseDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant/50 rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    {['پکیج ۳۰ گیگ - ۱۵۰,۰۰۰ تومان', 'پکیج ۵۰ گیگ - ۲۰۰,۰۰۰ تومان', 'پکیج ۱۰۰ گیگ - ۳۵۰,۰۰۰ تومان'].map((plan) => (
                      <div 
                        key={plan}
                        onClick={() => {
                          setSelectedPurchasePlan(plan);
                          setPurchaseDropdownOpen(false);
                        }}
                        className={`px-4 py-2.5 cursor-pointer transition-colors hover:bg-surface-variant ${selectedPurchasePlan === plan ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface'}`}
                      >
                        {plan}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">شماره سفارش (خودکار / دلخواه)</label>
            <input type="text" dir="ltr" value={purchaseOrderId} onChange={(e) => setPurchaseOrderId(e.target.value)} className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left placeholder:text-on-surface-variant/50" placeholder="#ORD-12345" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-2">نام کانفیگ (دلخواه)</label>
            <input type="text" className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50" placeholder="مثال: آیفون من" />
          </div>

          <div className="pt-4 border-t border-outline-variant/30 mt-6 w-full">
            <button type="submit" className="w-full rounded-lg bg-primary py-2.5 font-label-lg text-label-lg font-bold text-on-primary hover:bg-primary-fixed transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:-translate-y-0.5 transform">
              ثبت خرید
            </button>
          </div>
        </form>
      </SlideOver>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={<><span className="material-symbols-outlined text-error text-2xl">warning</span> تایید عملیات</>}>
        <div className="text-center w-full">
          <p className="text-on-surface-variant mb-6 text-right sm:text-center leading-relaxed">
            آیا از انجام عملیات <span className="font-bold text-primary">"{modalType}"</span> برای این کاربر اطمینان دارید؟
          </p>
          <div className="flex justify-end sm:justify-center gap-3 mt-4 w-full">
            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-variant rounded-lg font-label-lg text-label-lg transition-colors cursor-pointer">
              انصراف
            </button>
            <button onClick={executeAction} className="px-5 py-2.5 bg-error text-on-error hover:bg-error-container hover:text-on-error-container rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">check</span>
              بله، انجام بده
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
