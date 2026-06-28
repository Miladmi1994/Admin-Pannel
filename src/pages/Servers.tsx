import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';

const INITIAL_SERVERS = [
  { id: 1, name: 'آلمان ۱ - Hetzner', address: '192.168.1.100', users: 1450, maxUsers: 2000, status: 'عادی', consumedData: '2.4 TB', load: 72 },
  { id: 2, name: 'هلند - VIP', address: '192.168.1.101', users: 300, maxUsers: 500, status: 'VIP', consumedData: '850 GB', load: 60 },
  { id: 3, name: 'فنلاند ۲ - در حال انتقال', address: '192.168.1.102', users: 45, maxUsers: 1000, status: 'در حال تخلیه', consumedData: '120 GB', load: 12 },
];

export default function Servers() {
  const [servers, setServers] = useState(INITIAL_SERVERS);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isStatusConfirmModalOpen, setIsStatusConfirmModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [testConnectionError, setTestConnectionError] = useState('');

  const handleTestConnection = () => {
    if (!serverUrl.trim()) {
      setTestResult('error');
      setTestConnectionError('ابتدا آدرس پنل را وارد کنید');
      setTimeout(() => {
        setTestResult(null);
        setTestConnectionError('');
      }, 3000);
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);
    setTestConnectionError('');
    setTimeout(() => {
      setIsTestingConnection(false);
      setTestResult('success');
      setTimeout(() => setTestResult(null), 3000);
    }, 1500);
  };

  const handleStatusChange = (serverId: number, newStatus: string) => {
    setServers(servers.map(s => s.id === serverId ? { ...s, status: newStatus } : s));
    setIsStatusConfirmModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'عادی': return 'bg-primary/10 text-primary border-primary/20';
      case 'VIP': return 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'در حال تخلیه': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface-variant text-on-surface-variant border-outline-variant/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline-lg text-[28px] font-light text-on-surface mb-2">
            مدیریت <span className="font-bold text-primary" style={{ textShadow: '0 0 10px rgba(78, 222, 163, 0.4)' }}>سرورها</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">نظارت بر تعداد کاربران، ترافیک مصرفی و وضعیت نودها</p>
        </div>
        
        <div className="flex items-center w-full md:w-auto mt-4 md:mt-0">
          <button 
            onClick={() => setIsSlideOverOpen(true)}
            className="w-full md:w-auto bg-primary text-on-primary hover:bg-primary-fixed transition-all duration-300 font-label-lg text-label-lg py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>افزودن سرور</span>
          </button>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'کل سرورها', value: '۳', icon: 'dns', color: 'text-primary' },
          { label: 'کاربران آنلاین', value: '۱,۷۹۵', icon: 'group', color: 'text-secondary' },
          { label: 'کل ترافیک مصرفی', value: '۳.۳ TB', icon: 'data_usage', color: 'text-primary' },
          { label: 'وضعیت شبکه', value: 'پایدار', icon: 'health_and_safety', color: 'text-secondary' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="glass-panel rounded-xl p-4 flex items-center gap-4 border border-outline-variant/30"
          >
            <div className={`w-12 h-12 rounded-lg bg-surface flex items-center justify-center ${stat.color} bg-opacity-10`}>
              <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
            </div>
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{stat.label}</p>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Servers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {servers.map((server, i) => (
          <motion.div
            key={server.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className={`glass-panel rounded-xl p-6 flex flex-col relative overflow-hidden group border border-outline-variant/30 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all ${server.status === 'VIP' ? 'border-amber-500/30' : server.status === 'در حال تخلیه' ? 'border-error/30' : ''}`}
          >
            {/* Background Ambient Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full blur-3xl z-0 transition-all opacity-30 ${server.status === 'VIP' ? 'bg-amber-500/20 group-hover:bg-amber-500/40' : server.status === 'در حال تخلیه' ? 'bg-error/20 group-hover:bg-error/40' : 'bg-primary/20 group-hover:bg-primary/40'}`}></div>
            
            {/* Card Header */}
            <div className="flex justify-between items-start z-10 mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center border shadow-sm ${server.status === 'VIP' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : server.status === 'در حال تخلیه' ? 'bg-error/10 border-error/30 text-error' : 'bg-surface-container border-outline-variant/50 text-primary'}`}>
                  <span className="material-symbols-outlined text-[24px]">{server.status === 'VIP' ? 'workspace_premium' : 'dns'}</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{server.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-mono" dir="ltr">{server.address}</span>
                  </div>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-md font-label-md text-label-md flex items-center gap-1.5 border ${getStatusColor(server.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${server.status === 'در حال تخلیه' ? 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.6)]' : server.status === 'VIP' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-primary shadow-[0_0_8px_rgba(78,222,163,0.6)]'}`}></span>
                {server.status}
              </div>
            </div>

            {/* Content Stats Grid (Simplified) */}
            <div className="grid grid-cols-2 gap-4 mb-6 z-10 flex-1">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span className="font-label-md text-label-md">کاربران متصل</span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface font-medium mt-1">
                  <span className="font-mono">{server.users}</span>
                </span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">data_usage</span>
                  <span className="font-label-md text-label-md">حجم مصرفی کل</span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-medium font-mono" dir="ltr">{server.consumedData}</span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/30 z-10">
              <button 
                onClick={() => {
                  setSelectedServer(server.id);
                  setIsStatusModalOpen(true);
                }}
                className="flex-1 py-2 px-4 rounded-lg bg-surface-variant hover:bg-surface-container-highest border border-outline-variant/50 text-on-surface font-label-md text-label-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                تعیین وضعیت
              </button>
              
              <div className="flex items-center gap-2 mr-3">
                <button 
                  onClick={() => {
                    setSelectedServer(server.id);
                    setIsSlideOverOpen(true);
                  }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-variant hover:bg-surface-container-highest text-on-surface transition-colors cursor-pointer border border-outline-variant/50 hover:border-primary/30 hover:text-primary tooltip-trigger"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button 
                  onClick={() => {
                    setSelectedServer(server.id);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-variant hover:bg-error/10 text-on-surface hover:text-error transition-colors cursor-pointer border border-outline-variant/50 hover:border-error/30"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        title={<><span className="material-symbols-outlined text-primary">add_circle</span> افزودن سرور جدید</>}
      >
        <form className="space-y-4 w-full" onSubmit={(e) => { e.preventDefault(); setIsSlideOverOpen(false); }}>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">نام سرور</label>
            <input type="text" className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50" placeholder="مثال: آلمان ۱" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">آدرس پنل (URL)</label>
            <input 
              type="text" 
              dir="ltr" 
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className={`w-full bg-surface-variant border ${testResult === 'error' && !serverUrl.trim() ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-primary'} rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-1 ${testResult === 'error' && !serverUrl.trim() ? 'focus:ring-error/50' : 'focus:ring-primary/50'} transition-all placeholder:text-on-surface-variant/50 text-left`} 
              placeholder="http://..." 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">مسیر وب (Web Base Path)</label>
            <input type="text" dir="ltr" className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50 text-left" placeholder="/custom-path" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">API Token</label>
            <div className="relative">
              <input type={showToken ? "text" : "password"} dir="ltr" className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg pl-4 pr-11 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left placeholder:text-on-surface-variant/50" placeholder="••••••••" />
              <button 
                type="button"
                onClick={() => setShowToken(!showToken)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors z-10 p-1 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showToken ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">Domain</label>
              <input type="text" dir="ltr" className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left" placeholder="domain.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">SNI</label>
              <input type="text" dir="ltr" className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-left" placeholder="sni.domain.com" />
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-outline-variant/30 w-full">
            <button 
              type="button" 
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className={`w-full rounded-lg border py-2.5 font-label-lg text-label-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                testResult === 'success' ? 'bg-primary/20 border-primary text-primary' : 
                testResult === 'error' ? 'bg-error/20 border-error text-error' :
                'bg-surface-container-highest border-outline-variant/50 text-on-surface hover:bg-surface-variant'
              } ${isTestingConnection ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isTestingConnection ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  در حال تست...
                </>
              ) : testResult === 'success' ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  ارتباط برقرار است
                </>
              ) : testResult === 'error' && testConnectionError ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">error</span>
                  {testConnectionError}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">wifi_tethering</span>
                  تست ارتباط با سرور
                </>
              )}
            </button>
            <button type="submit" className="w-full rounded-lg bg-primary py-2.5 font-label-lg text-label-lg font-bold text-on-primary hover:bg-primary-fixed transition-colors shadow-[0_0_20px_rgba(78,222,163,0.3)] cursor-pointer hover:-translate-y-0.5 transform">
              ذخیره سرور
            </button>
          </div>
        </form>
      </SlideOver>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={<><span className="material-symbols-outlined text-error text-2xl">warning</span> حذف سرور</>}>
        <div className="text-center w-full">
          <p className="text-on-surface-variant mb-6 text-right sm:text-center leading-relaxed">آیا از حذف این سرور اطمینان دارید؟ این عملیات غیرقابل بازگشت است و ممکن است باعث قطعی کاربران شود.</p>
          <div className="flex justify-end sm:justify-center gap-3 mt-4 w-full">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-variant rounded-lg font-label-lg text-label-lg transition-colors cursor-pointer">
              انصراف
            </button>
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 bg-error text-on-error hover:bg-error-container hover:text-on-error-container rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">delete_forever</span>
              تایید و حذف
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title={<><span className="material-symbols-outlined text-primary text-2xl">swap_vert</span> تعیین وضعیت سرور</>}>
        <div className="space-y-4 w-full">
          <p className="text-on-surface-variant text-sm mb-4">وضعیت جدید را برای این سرور انتخاب کنید:</p>
          <div className="grid grid-cols-1 gap-3 w-full">
            {['عادی', 'VIP', 'در حال تخلیه'].map(status => (
              <button 
                key={status} 
                onClick={() => {
                  setPendingStatus(status);
                  setIsStatusModalOpen(false);
                  setIsStatusConfirmModalOpen(true);
                }}
                className={`w-full p-4 rounded-lg border flex items-center justify-between transition-all cursor-pointer hover:bg-surface-container-highest ${getStatusColor(status)}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${status === 'در حال تخلیه' ? 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.6)]' : status === 'VIP' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-primary shadow-[0_0_8px_rgba(78,222,163,0.6)]'}`}></span>
                  <span className="font-label-lg text-label-lg">{status}</span>
                </div>
                <span className="material-symbols-outlined text-[20px] opacity-50">chevron_left</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isStatusConfirmModalOpen} onClose={() => setIsStatusConfirmModalOpen(false)} title={<><span className="material-symbols-outlined text-primary text-2xl">help</span> تایید تغییر وضعیت</>}>
        <div className="text-center w-full">
          <p className="text-on-surface-variant mb-6 text-right sm:text-center leading-relaxed">
            آیا از تغییر وضعیت این سرور به 
            <span className={`mx-2 px-2 py-0.5 rounded-md border text-sm font-bold ${pendingStatus ? getStatusColor(pendingStatus) : ''}`}>
              {pendingStatus}
            </span> 
            اطمینان دارید؟
          </p>
          <div className="flex justify-end sm:justify-center gap-3 mt-4 w-full">
            <button onClick={() => setIsStatusConfirmModalOpen(false)} className="px-5 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-variant rounded-lg font-label-lg text-label-lg transition-colors cursor-pointer">
              انصراف
            </button>
            <button 
              onClick={() => {
                if (selectedServer && pendingStatus) {
                  handleStatusChange(selectedServer, pendingStatus);
                }
              }} 
              className="px-5 py-2.5 bg-primary text-on-primary hover:bg-primary-fixed hover:text-on-primary-fixed rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">check</span>
              تایید و ثبت
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}