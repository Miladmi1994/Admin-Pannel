import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('همه کاربران');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [vipTab, setVipTab] = useState<'new' | 'old'>('new');
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const [isPurchaseSlideOpen, setIsPurchaseSlideOpen] = useState(false);
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [renewDays, setRenewDays] = useState(30);
  const [renewGB, setRenewGB] = useState(50);
  
  const [actionTargetId, setActionTargetId] = useState<string>('');
  const [actionConfigId, setActionConfigId] = useState<string>('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      
      if (data.success) {
        const formattedUsers = data.users.map((u: any) => ({
          id: u.telegramId,
          username: u.telegramId, 
          status: u.isBanned ? 'مسدود' : u.isVip ? 'VIP' : 'عادی',
          isActive: !u.isBanned,
          configs: (u.configs || []).map((c: any) => {
           let remainDays = 0;
           
           // کانفیگ فقط زمانی در انتظار سینک است که هیچ دیتای مصرفی از پنل نداشته باشد
           let isUnsynced = !c.panelStats; 

           if (c.panelStats?.expiry > 0) {
             remainDays = Math.max(0, Math.ceil((c.panelStats.expiry - Date.now()) / (1000 * 60 * 60 * 24)));
           } else if (c.panelStats && c.panelStats.expiry === 0) {
             remainDays = 999; // کانفیگ‌هایی که زمانشان نامحدود است
           }

           return {
              id: c.uuid,
              name: c.name || 'بدون نام',
              planName: 'بسته کانفیگ', 
              email: c.email,
              server: c.serverId,
              volumeTotal: c.panelStats?.total ? parseFloat((c.panelStats.total / (1024**3)).toFixed(2)) : 0,
              volumeUsed: c.panelStats?.used ? parseFloat((c.panelStats.used / (1024**3)).toFixed(2)) : 0,
              timeRemain: remainDays,
              isUnsynced
           };
        })
        }));
        setUsers(formattedUsers);
      }
    } catch (err) {
      console.error("خطا در دریافت کاربران:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenPurchase = () => {
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

  const handleRenewConfig = (userId: string, configId: string, currentVolume: number) => {
    setRenewGB(currentVolume > 0 ? currentVolume : 50);
    setRenewDays(30); // می‌توانید برای ۲ ماه این را روی 60 بگذارید
    handleAction('تمدید کانفیگ', userId, configId);
  };

  const handleDeleteConfig = (userId: string, configId: string) => {
    handleAction('حذف کانفیگ', userId, configId);
  };

  // هندل کردن حذف کانفیگ با دو متد مختلف
  const executeDeleteConfig = async (mode: 'panel' | 'both') => {
    try {
      await fetch(`/api/configs/${actionConfigId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, userId: actionTargetId })
      });
      fetchUsers();
    } catch (err) {
      console.error("خطا در حذف کانفیگ:", err);
    }
    setIsModalOpen(false);
  };

  const executeAction = async () => {
    try {
      if (modalType === 'مسدود کردن' || modalType === 'رفع مسدودی') {
        const isBanned = modalType === 'مسدود کردن';
        await fetch(`/api/users/${actionTargetId}/block`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isBanned })
        });
      } else if (modalType === 'ارتقا به VIP' || modalType === 'حذف از VIP') {
        const isVip = modalType === 'ارتقا به VIP';
        await fetch(`/api/users/${actionTargetId}/vip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVip })
        });
      } else if (modalType.startsWith('ارسال کانفیگ')) {
        // فراخوانی API ارسال کانفیگ
        await fetch(`/api/users/${actionTargetId}/configs/${actionConfigId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (modalType === 'تمدید کانفیگ') {
        await fetch(`/api/users/${actionTargetId}/configs/${actionConfigId}/renew`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days: renewDays, gb: renewGB })
        });
      }
      
      fetchUsers();
    } catch (err) {
      console.error("خطا در اعمال تغییرات:", err);
    }
    setIsModalOpen(false);
  };

  const toggleExpand = (userId: string) => {
    setExpandedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user => {
    if (activeTab === 'کاربران VIP') return user.status === 'VIP';
    if (activeTab === 'کاربران عادی') return user.status === 'عادی';
    if (activeTab === 'مسدود شده‌ها') return user.status === 'مسدود';
    return true; 
  }).filter(user => 
    user.id.includes(searchTerm)
  );

  // کامپوننت رندر کردن لیست کانفیگ‌ها
  const renderConfigList = (configs: any[], userId: string) => (
    <div className="flex flex-col gap-3">
      {configs.map((conf: any) => (
        <div key={conf.id} className="bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl border border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-1/3">
            <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface shrink-0">
              <span className="material-symbols-outlined text-[20px]">dns</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-on-surface text-sm truncate">{conf.name}</span>
              </div>
              <span className="text-[11px] text-on-surface-variant truncate font-mono" dir="ltr">{conf.email}</span>
              <span className="text-[11px] text-primary truncate mt-0.5">{conf.server}</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-on-surface-variant flex gap-1 items-center">
                مصرف:
                {conf.isUnsynced ? (
                  <span className="font-mono text-on-surface text-[10px] bg-primary/10 px-2 py-0.5 rounded-full text-primary">در انتظار سینک ربات...</span>
                ) : conf.volumeTotal === 0 ? (
                  <span className="font-mono text-on-surface" dir="ltr">{conf.volumeUsed}GB</span>
                ) : (
                  <span className="font-mono text-on-surface" dir="ltr">{conf.volumeUsed}GB / {conf.volumeTotal}GB</span>
                )}
              </span>
              <span className="text-on-surface-variant font-mono">
                {conf.isUnsynced ? 'تازه ساخت' : conf.timeRemain === 999 ? 'نامحدود' : `${conf.timeRemain} روز`}
              </span>
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
            <button onClick={() => handleSendConfig(userId, conf.id, '1')} className="w-9 h-9 bg-transparent text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-md flex items-center justify-center opacity-70 hover:opacity-100" title="ارسال کانفیگ">
              <span className="material-symbols-outlined text-[18px] font-light">send</span>
            </button>
            <button onClick={() => handleRenewConfig(userId, conf.id, conf.volumeTotal)} className="w-10 h-10 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors rounded-lg border border-blue-500/20 flex items-center justify-center" title="تمدید کانفیگ">
              <span className="material-symbols-outlined text-[18px]">autorenew</span>
            </button>
            <button onClick={() => handleDeleteConfig(userId, conf.id)} className="w-10 h-10 bg-error/10 text-error hover:bg-error hover:text-white transition-colors rounded-lg border border-error/20 flex items-center justify-center" title="حذف کانفیگ">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      ))}
    </div>
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

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="py-16 text-center bg-surface-container rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center">
             <span className="material-symbols-outlined animate-spin text-primary text-[40px] mb-4">progress_activity</span>
             <p className="text-on-surface-variant text-lg">در حال دریافت اطلاعات...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center bg-surface-container rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/30 text-[64px] mb-4">group_off</span>
            <p className="text-on-surface-variant text-lg">کاربری با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          filteredUsers.map((user, i) => {
            // تفکیک کانفیگ‌های فعال و منقضی
            // جایگزین کردن بخش activeConfigs و expiredConfigs:
              const activeConfigs = (user.configs || []).filter((c: any) => {
                  // اگر دیتابیس هیچ استتی ندارد، یعنی در انتظار سینک است (باید در فعال‌ها باشد)
                  if (!c.panelStats) return true; 
                  
                  // در غیر این صورت، شرط فعال بودن واقعی:
                  const isExpired = c.panelStats.expiry > 0 && c.panelStats.expiry < Date.now();
                  const isVolumeFinished = c.panelStats.total > 0 && c.panelStats.used >= c.panelStats.total;
                  
                  return !isExpired && !isVolumeFinished;
              });

              const expiredConfigs = (user.configs || []).filter((c: any) => {
                  // کانفیگ در انتظار سینک، جزو منقضی‌ها نیست
                  if (!c.panelStats) return false;
                  
                  const isExpired = c.panelStats.expiry > 0 && c.panelStats.expiry < Date.now();
                  const isVolumeFinished = c.panelStats.total > 0 && c.panelStats.used >= c.panelStats.total;
                  
                  return isExpired || isVolumeFinished;
              });
            return (
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
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 justify-start md:justify-end pr-14 md:pr-0">
                    <button onClick={() => handleToggleVipStatus(user.id, user.status)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border border-transparent bg-surface-container-highest md:bg-transparent ${user.status === 'VIP' ? 'text-amber-500 bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-on-surface-variant hover:text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30'}`} title={user.status === 'VIP' ? 'حذف از VIP' : 'ارتقا به VIP'}>
                      <span className="material-symbols-outlined text-[20px]">{user.status === 'VIP' ? 'workspace_premium' : 'star_outline'}</span>
                    </button>
                    <button onClick={() => handleToggleBlockStatus(user.id, user.status)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 cursor-pointer border border-transparent bg-surface-container-highest md:bg-transparent ${user.status === 'مسدود' ? 'text-error bg-error/10 border-error/30' : 'text-primary bg-primary/10 border-primary/30'}`} title={user.status === 'مسدود' ? 'رفع مسدودی' : 'مسدود کردن'}>
                      <span className="material-symbols-outlined text-[20px]">{user.status === 'مسدود' ? 'person_off' : 'person_check'}</span>
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
                          <div className="flex flex-col gap-6">
                            {/* بخش کانفیگ‌های فعال */}
                            {activeConfigs.length > 0 && (
                              <div>
                                <h5 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                                  اکانت‌های فعال
                                </h5>
                                {renderConfigList(activeConfigs, user.id)}
                              </div>
                            )}

                            {/* بخش کانفیگ‌های منقضی شده */}
                            {expiredConfigs.length > 0 && (
                              <div>
                                <h5 className="text-sm font-bold text-error mb-3 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-error"></span>
                                  اکانت‌های منقضی شده
                                </h5>
                                <div className="opacity-80">
                                  {renderConfigList(expiredConfigs, user.id)}
                                </div>
                              </div>
                            )}
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
            );
          })
        )}
      </div>

      <SlideOver isOpen={isSlideOverOpen} onClose={() => setIsSlideOverOpen(false)} title={<><span className="material-symbols-outlined text-primary">add_circle</span> افزودن کاربر VIP</>}>
         <div className="p-4 text-on-surface-variant">بخش ثبت نام در حال اتصال به API است...</div>
      </SlideOver>

      <SlideOver isOpen={isPurchaseSlideOpen} onClose={() => setIsPurchaseSlideOpen(false)} title={<><span className="material-symbols-outlined text-primary">add_circle</span> ثبت دستی خرید</>}>
         <div className="p-4 text-on-surface-variant">بخش خرید دستی در حال اتصال به API است...</div>
      </SlideOver>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={<><span className="material-symbols-outlined text-error text-2xl">warning</span> تایید عملیات</>}>
        <div className="text-center w-full">
          <p className="text-on-surface-variant mb-4 text-right sm:text-center leading-relaxed">
            آیا از انجام عملیات <span className="font-bold text-primary">"{modalType}"</span> اطمینان دارید؟
          </p>
          
          {modalType === 'تمدید کانفیگ' ? (
            <div className="flex flex-col gap-4 mt-6 w-full text-right">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-on-surface">حجم جدید (گیگابایت):</label>
                <input type="number" value={renewGB} onChange={e => setRenewGB(Number(e.target.value))} className="w-full bg-surface-container-highest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/50 rounded-lg p-3 text-on-surface outline-none transition-all" dir="ltr" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-on-surface">زمان جدید (روز):</label>
                <input type="number" value={renewDays} onChange={e => setRenewDays(Number(e.target.value))} className="w-full bg-surface-container-highest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/50 rounded-lg p-3 text-on-surface outline-none transition-all" dir="ltr" />
              </div>
              <div className="flex justify-end sm:justify-center gap-3 mt-4 w-full">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-variant rounded-lg font-label-lg transition-colors cursor-pointer">انصراف</button>
                <button onClick={executeAction} className="px-5 py-2.5 bg-primary text-on-primary hover:bg-primary-fixed rounded-lg font-label-lg transition-colors flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">check</span>
                  تایید و تمدید
                </button>
              </div>
            </div>
          ) : modalType === 'حذف کانفیگ' ? (
            <div className="flex flex-col gap-3 mt-6 w-full">
              <button onClick={() => executeDeleteConfig('panel')} className="px-5 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg font-label-lg transition-colors flex items-center justify-center gap-2 cursor-pointer w-full">
                <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                پاک کردن فقط از پنل
              </button>
              <button onClick={() => executeDeleteConfig('both')} className="px-5 py-3 bg-error/10 border border-error/30 text-error hover:bg-error hover:text-white rounded-lg font-label-lg transition-colors flex items-center justify-center gap-2 cursor-pointer w-full">
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                پاک کردن از دیتابیس و پنل (هردو)
              </button>
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 mt-2 text-on-surface-variant hover:text-on-surface font-label-lg transition-colors cursor-pointer w-full">
                انصراف
              </button>
            </div>
          ) : (
            <div className="flex justify-end sm:justify-center gap-3 mt-4 w-full">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-variant rounded-lg font-label-lg text-label-lg transition-colors cursor-pointer">
                انصراف
              </button>
              <button onClick={executeAction} className="px-5 py-2.5 bg-error text-on-error hover:bg-error-container hover:text-on-error-container rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">check</span>
                بله، انجام بده
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}