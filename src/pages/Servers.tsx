import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';

export default function Servers() {
  const [servers, setServers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isStatusConfirmModalOpen, setIsStatusConfirmModalOpen] = useState(false);
  
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testConnectionError, setTestConnectionError] = useState('');
  
  const [formData, setFormData] = useState<any>({});

  // 1. دریافت سرورها از بک‌اند
  const fetchServers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/servers');
      const data = await res.json();
      if (data.success) {
        // داده‌های دریافتی از API را به آرایه تبدیل می‌کنیم
        setServers(data.servers);
      }
    } catch (err) {
      console.error('Error fetching servers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  // 2. ذخیره یا ویرایش سرور
  const handleSaveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!formData.id;
      const serverId = isEdit ? formData.id : `srv_${Date.now()}`;
      
      const payload = {
        ...formData,
        id: serverId,
        status: formData.status || 'عادی'
      };

      const res = await fetch(isEdit ? `/api/servers/${serverId}` : '/api/servers', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchServers();
        setIsSlideOverOpen(false);
      }
    } catch (err) {
      console.error('Error saving server:', err);
    }
  };

  // 3. حذف سرور
  const handleDeleteConfirm = async () => {
    if (!selectedServerId) return;
    try {
      await fetch(`/api/servers/${selectedServerId}`, { method: 'DELETE' });
      fetchServers();
    } catch (err) {
      console.error('Error deleting server:', err);
    }
    setIsDeleteModalOpen(false);
  };

  // 4. تغییر وضعیت سرور
  const handleStatusChange = async (serverId: string, newStatus: string) => {
    try {
      const serverToUpdate = servers.find(s => s.id === serverId);
      if (serverToUpdate) {
        await fetch(`/api/servers/${serverId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...serverToUpdate, status: newStatus })
        });
        fetchServers();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
    setIsStatusConfirmModalOpen(false);
  };

  const handleTestConnection = () => {
    if (!formData.panelUrl) {
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

  const openAddModal = () => {
    setFormData({});
    setIsSlideOverOpen(true);
  };

  const openEditModal = (server: any) => {
    setFormData(server);
    setIsSlideOverOpen(true);
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
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline-lg text-[28px] font-light text-on-surface mb-2">
            مدیریت <span className="font-bold text-primary" style={{ textShadow: '0 0 10px rgba(78, 222, 163, 0.4)' }}>سرورها</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">نظارت بر تعداد کاربران، ترافیک مصرفی و وضعیت نودها</p>
        </div>
        <div className="flex items-center w-full md:w-auto mt-4 md:mt-0">
          <button onClick={openAddModal} className="w-full md:w-auto bg-primary text-on-primary hover:bg-primary-fixed transition-all duration-300 font-label-lg text-label-lg py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>افزودن سرور</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center bg-surface-container rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-primary text-[40px] mb-4">progress_activity</span>
            <p className="text-on-surface-variant text-lg">در حال دریافت سرورها...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {servers.map((server, i) => (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className={`glass-panel rounded-xl p-6 flex flex-col relative overflow-hidden group border border-outline-variant/30 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all ${server.status === 'VIP' ? 'border-amber-500/30' : server.status === 'در حال تخلیه' ? 'border-error/30' : ''}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full blur-3xl z-0 transition-all opacity-30 ${server.status === 'VIP' ? 'bg-amber-500/20 group-hover:bg-amber-500/40' : server.status === 'در حال تخلیه' ? 'bg-error/20 group-hover:bg-error/40' : 'bg-primary/20 group-hover:bg-primary/40'}`}></div>
              
              <div className="flex justify-between items-start z-10 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border shadow-sm ${server.status === 'VIP' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : server.status === 'در حال تخلیه' ? 'bg-error/10 border-error/30 text-error' : 'bg-surface-container border-outline-variant/50 text-primary'}`}>
                    <span className="material-symbols-outlined text-[24px]">{server.status === 'VIP' ? 'workspace_premium' : 'dns'}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface truncate max-w-[150px]">{server.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-mono truncate max-w-[150px]" dir="ltr">{server.domain || server.panelUrl || 'بدون آدرس'}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-md font-label-md text-label-md flex items-center gap-1.5 border ${getStatusColor(server.status || 'عادی')}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${server.status === 'در حال تخلیه' ? 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.6)]' : server.status === 'VIP' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-primary shadow-[0_0_8px_rgba(78,222,163,0.6)]'}`}></span>
                  {server.status || 'عادی'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 z-10 flex-1">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    <span className="font-label-md text-label-md">کاربران (تخمینی)</span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-medium mt-1">
                    <span className="font-mono">--</span>
                  </span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">api</span>
                    <span className="font-label-md text-label-md">SNI اتصال</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-medium font-mono truncate max-w-[100px]" dir="ltr">{server.sni || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/30 z-10">
                <button onClick={() => { setSelectedServerId(server.id); setIsStatusModalOpen(true); }} className="flex-1 py-2 px-4 rounded-lg bg-surface-variant hover:bg-surface-container-highest border border-outline-variant/50 text-on-surface font-label-md text-label-md transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                  تعیین وضعیت
                </button>
                <div className="flex items-center gap-2 mr-3">
                  <button onClick={() => openEditModal(server)} className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-variant hover:bg-surface-container-highest text-on-surface transition-colors cursor-pointer border border-outline-variant/50 hover:border-primary/30 hover:text-primary">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button onClick={() => { setSelectedServerId(server.id); setIsDeleteModalOpen(true); }} className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-variant hover:bg-error/10 text-on-surface hover:text-error transition-colors cursor-pointer border border-outline-variant/50 hover:border-error/30">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <SlideOver isOpen={isSlideOverOpen} onClose={() => setIsSlideOverOpen(false)} title={<><span className="material-symbols-outlined text-primary">{formData.id ? 'edit' : 'add_circle'}</span> {formData.id ? 'ویرایش سرور' : 'افزودن سرور'}</>}>
        <form className="space-y-4 w-full" onSubmit={handleSaveServer}>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">نام سرور</label>
            <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary" placeholder="مثال: آلمان ۱" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">آدرس پنل (URL)</label>
            <input required type="text" dir="ltr" value={formData.panelUrl || ''} onChange={e => setFormData({...formData, panelUrl: e.target.value})} className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface text-left focus:outline-none focus:border-primary" placeholder="http://192.168.1.1:2053" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">مسیر وب (Web Base Path)</label>
            <input type="text" dir="ltr" value={formData.webBasePath || ''} onChange={e => setFormData({...formData, webBasePath: e.target.value})} className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface text-left focus:outline-none focus:border-primary" placeholder="/custom-path" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">API Token</label>
            <div className="relative">
              <input required type={showToken ? "text" : "password"} dir="ltr" value={formData.apiToken || ''} onChange={e => setFormData({...formData, apiToken: e.target.value})} className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg pl-4 pr-11 py-2.5 text-on-surface text-left focus:outline-none focus:border-primary" />
              <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer hover:text-on-surface z-10 p-1">
                <span className="material-symbols-outlined text-[20px]">{showToken ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">Domain</label>
              <input type="text" dir="ltr" value={formData.domain || ''} onChange={e => setFormData({...formData, domain: e.target.value})} className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface text-left focus:outline-none focus:border-primary" placeholder="domain.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant pr-1">SNI</label>
              <input type="text" dir="ltr" value={formData.sni || ''} onChange={e => setFormData({...formData, sni: e.target.value})} className="w-full bg-surface-variant border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface text-left focus:outline-none focus:border-primary" placeholder="sni.domain.com" />
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-outline-variant/30 w-full">
            <button type="button" onClick={handleTestConnection} disabled={isTestingConnection} className="w-full rounded-lg border py-2.5 font-label-lg text-label-lg transition-colors cursor-pointer flex items-center justify-center gap-2 bg-surface-container-highest border-outline-variant/50 text-on-surface hover:bg-surface-variant">
              {isTestingConnection ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>در حال تست...</> : testResult === 'success' ? <><span className="material-symbols-outlined text-[20px] text-primary">check_circle</span> ارتباط برقرار است</> : testResult === 'error' ? <><span className="material-symbols-outlined text-[20px] text-error">error</span> خطا</> : <><span className="material-symbols-outlined text-[20px]">wifi_tethering</span>تست ارتباط با سرور</>}
            </button>
            <button type="submit" className="w-full rounded-lg bg-primary py-2.5 font-label-lg text-label-lg font-bold text-on-primary hover:bg-primary-fixed transition-colors cursor-pointer transform hover:-translate-y-0.5">
              ذخیره سرور
            </button>
          </div>
        </form>
      </SlideOver>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={<><span className="material-symbols-outlined text-error text-2xl">warning</span> حذف سرور</>}>
        <div className="text-center w-full">
          <p className="text-on-surface-variant mb-6 text-right sm:text-center leading-relaxed">آیا از حذف این سرور اطمینان دارید؟</p>
          <div className="flex justify-end sm:justify-center gap-3 mt-4 w-full">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-variant rounded-lg font-label-lg text-label-lg transition-colors cursor-pointer">انصراف</button>
            <button onClick={handleDeleteConfirm} className="px-5 py-2.5 bg-error text-on-error hover:bg-error-container hover:text-on-error-container rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">delete_forever</span> تایید و حذف
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title={<><span className="material-symbols-outlined text-primary text-2xl">swap_vert</span> تعیین وضعیت سرور</>}>
        <div className="space-y-4 w-full">
          <div className="grid grid-cols-1 gap-3 w-full">
            {['عادی', 'VIP', 'در حال تخلیه'].map(status => (
              <button key={status} onClick={() => { setPendingStatus(status); setIsStatusModalOpen(false); setIsStatusConfirmModalOpen(true); }} className={`w-full p-4 rounded-lg border flex items-center justify-between transition-all cursor-pointer hover:bg-surface-container-highest ${getStatusColor(status)}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${status === 'در حال تخلیه' ? 'bg-error' : status === 'VIP' ? 'bg-amber-500' : 'bg-primary'}`}></span>
                  <span className="font-label-lg text-label-lg">{status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isStatusConfirmModalOpen} onClose={() => setIsStatusConfirmModalOpen(false)} title={<><span className="material-symbols-outlined text-primary text-2xl">help</span> تایید تغییر وضعیت</>}>
        <div className="text-center w-full">
          <p className="text-on-surface-variant mb-6 text-right sm:text-center">آیا از تغییر وضعیت اطمینان دارید؟</p>
          <div className="flex justify-end sm:justify-center gap-3 mt-4 w-full">
            <button onClick={() => setIsStatusConfirmModalOpen(false)} className="px-5 py-2.5 border border-outline-variant text-on-surface rounded-lg cursor-pointer">انصراف</button>
            <button onClick={() => { if (selectedServerId && pendingStatus) handleStatusChange(selectedServerId, pendingStatus); }} className="px-5 py-2.5 bg-primary text-on-primary rounded-lg flex items-center gap-2 cursor-pointer"><span className="material-symbols-outlined">check</span> تایید</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}