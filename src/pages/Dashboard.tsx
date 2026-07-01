import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

const mockChartData = [
  { name: '1', uv: 4000 },
  { name: '2', uv: 3000 },
  { name: '3', uv: 5000 },
  { name: '4', uv: 2780 },
  { name: '5', uv: 6890 },
  { name: '6', uv: 2390 },
  { name: '7', uv: 4490 },
];

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  
  // متغیر برای مدیریت تب فعال
  const [activeTab, setActiveTab] = useState<'revenue' | 'monitoring'>('revenue');
  
  const [servers, setServers] = useState<any[]>([]);
  const [serverStats, setServerStats] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    successfulSales: 0,
    activeConfigs: 0,
    abandonedCarts: 0
  });

  // ----------------------------------------------------
  // هوک اول: دریافت اطلاعات اولیه داشبورد (فقط یک‌بار اجرا می‌شود)
  // ----------------------------------------------------
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // دریافت آمار
        const resSettings = await fetch('/api/settings');
        const dataSettings = await resSettings.json();
        
        const resUsers = await fetch('/api/users');
        const dataUsers = await resUsers.json();

        // دریافت لیست سرورها برای تب مانیتورینگ
        const resServers = await fetch('/api/servers');
        const dataServers = await resServers.json();

        let configsCount = 0;
        if (dataUsers.success) {
          dataUsers.users.forEach((u: any) => {
            configsCount += (u.configs || []).length;
          });
        }

        if (dataSettings.success) {
          setStats({
            totalIncome: dataSettings.settings.totalIncome || 0,
            successfulSales: dataSettings.settings.successfulSales || 0,
            activeConfigs: configsCount,
            abandonedCarts: dataSettings.settings.abandonedCarts || 0
          });
        }
        
        if (dataServers.success) {
          setServers(Array.isArray(dataServers.servers) ? dataServers.servers : []);
        }
      } catch (err) {
        console.error("خطا در دریافت اطلاعات داشبورد:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // <--- اینجا هوک اول به درستی بسته شد


  // ----------------------------------------------------
  // هوک دوم: دریافت اطلاعات مانیتورینگ (هر ۱۰ ثانیه آپدیت می‌شود)
  // ----------------------------------------------------
  useEffect(() => {
    const fetchServerStats = async () => {
      if (activeTab !== 'monitoring') return; 
      try {
        const res = await fetch('/api/servers/stats');
        const data = await res.json();
        if (data.success) {
          setServerStats(Array.isArray(data.stats) ? data.stats : []);
        }
      } catch (err) {
        console.error("خطا در دریافت وضعیت سرورها:", err);
      }
    };

    if (activeTab === 'monitoring') {
      fetchServerStats();
    }

    const interval = setInterval(fetchServerStats, 10000); // 10000 میلی‌ثانیه
    return () => clearInterval(interval);
  }, [activeTab]);


  // تابع فرمت قیمت
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  // ... (ادامه کد از کلمه return به بعد بدون تغییر باقی می‌ماند)

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full pb-10">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="font-headline-lg text-[28px] font-light text-on-surface">
          نمای کلی <span className="font-bold text-primary" style={{ textShadow: '0 0 10px rgba(78, 222, 163, 0.4)' }}>سیستم</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">وضعیت شبکه پایدار است و تمامی سرویس‌ها متصل هستند.</p>
      </div>
      
      {isLoading ? (
        <div className="py-16 text-center bg-surface-container rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-primary text-[40px] mb-4">progress_activity</span>
            <p className="text-on-surface-variant text-lg">در حال بارگذاری آمار سیستم...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'درآمد کل', value: formatPrice(stats.totalIncome), icon: 'account_balance_wallet', isBad: false, label: 'تومان' },
            { title: 'فروش موفق', value: formatPrice(stats.successfulSales), icon: 'shopping_cart_checkout', isBad: false, label: 'مورد' },
            { title: 'کانفیگ‌های فعال', value: formatPrice(stats.activeConfigs), icon: 'network_check', isBad: false, indicator: true, label: 'عدد' },
            { title: 'سبدهای رها شده', value: formatPrice(stats.abandonedCarts), icon: 'remove_shopping_cart', isBad: true, label: 'مورد' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-panel rounded-2xl p-6 flex flex-col gap-6 relative overflow-hidden group border border-outline-variant/30 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all"
            >
              <div className="flex justify-between items-center">
                <div className={`w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-on-surface-variant transition-colors ${stat.isBad ? 'group-hover:text-error' : 'group-hover:text-primary'}`}>
                  <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
                </div>
                {stat.indicator && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.6)]"></span>
                )}
              </div>
              
              <div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">{stat.title}</p>
                <div className="flex items-baseline gap-1">
                  <p className="font-headline-md text-[28px] text-on-surface font-light tracking-tight">{stat.value}</p>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mr-1">{stat.label}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* بخش تب‌ها */}
      <div className="mt-12 flex flex-col gap-6">
        <div className="flex gap-8 border-b border-surface-container-low px-2">
          <button 
            onClick={() => setActiveTab('revenue')}
            className={`pb-4 font-label-lg transition-colors cursor-pointer ${activeTab === 'revenue' ? 'border-b-2 border-primary text-primary' : 'text-outline hover:text-on-surface'}`}
          >
            روند درآمد و فروش
          </button>
          <button 
            onClick={() => setActiveTab('monitoring')}
            className={`pb-4 font-label-lg transition-colors cursor-pointer ${activeTab === 'monitoring' ? 'border-b-2 border-primary text-primary' : 'text-outline hover:text-on-surface'}`}
          >
            مانیتورینگ سرورها
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          
          {/* محتوای متغیر بر اساس تب انتخاب شده */}
          {activeTab === 'revenue' ? (
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col gap-6 border border-outline-variant/30">
              <div className="flex justify-between items-center">
                <h2 className="font-label-lg text-on-surface font-medium">نمودار فروش</h2>
              </div>
              
              <div className="w-full h-72 relative flex items-end px-2 pb-6" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4edea3" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4edea3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ backgroundColor: '#1d2022', border: '1px solid #3c4a42', borderRadius: '12px' }} itemStyle={{ color: '#4edea3' }} />
                    <Area type="monotone" dataKey="uv" stroke="#4edea3" strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            ) : (
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col gap-6 border border-outline-variant/30">
              <div className="flex justify-between items-center">
                <h2 className="font-label-lg text-on-surface font-medium">وضعیت لحظه‌ای سرورها</h2>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/30">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  آپدیت خودکار (Live)
                </div>
              </div>
              
              {serverStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[40px] mb-3 opacity-50">dns</span>
                  <p>در حال دریافت اطلاعات از نودها...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {serverStats?.map(server => (
                    <div key={server.id} className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col md:flex-row justify-between gap-4">
                      
                      {/* مشخصات سرور */}
                      <div className="flex items-center gap-3 md:w-1/3">
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${server.status === 'قطعی ارتباط' ? 'bg-error/10 text-error border-error/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                           <span className="material-symbols-outlined text-[20px]">{server.status === 'قطعی ارتباط' ? 'wifi_off' : 'dns'}</span>
                         </div>
                         <div className="overflow-hidden">
                           <p className="text-on-surface font-bold text-sm truncate">{server.name}</p>
                           <p className="text-[11px] text-on-surface-variant mt-0.5 font-mono truncate" dir="ltr">{server.domain}</p>
                         </div>
                      </div>

                      {/* منابع سرور (CPU و RAM) */}
                      <div className="flex-1 grid grid-cols-2 gap-4 items-center px-0 md:px-4 md:border-x border-outline-variant/30">
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-on-surface-variant">CPU</span>
                            <span className={`font-mono font-bold ${server.cpu > 80 ? 'text-error' : 'text-on-surface'}`}>{server.cpu}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden flex" dir="ltr">
                            <div className={`h-full rounded-full transition-all duration-1000 ${server.cpu > 80 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${server.cpu}%` }}></div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-on-surface-variant">RAM</span>
                            <span className={`font-mono font-bold ${server.ram > 80 ? 'text-error' : 'text-on-surface'}`}>{server.ram}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden flex" dir="ltr">
                            <div className={`h-full rounded-full transition-all duration-1000 ${server.ram > 80 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${server.ram}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* اطلاعات تکمیلی */}
                      <div className="flex items-center justify-between md:justify-end gap-6 md:w-1/4">
                         <div className="text-center md:text-right">
                           <p className="text-[10px] text-on-surface-variant mb-1">آپتایم</p>
                           <p className="text-xs font-bold text-on-surface font-mono">{server.uptime}</p>
                         </div>
                         <div className="text-center md:text-right">
                           <p className="text-[10px] text-on-surface-variant mb-1">آنلاین</p>
                           <p className="text-xs font-bold text-primary font-mono">{server.onlineUsers} 👤</p>
                         </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* پنل کناری ثابت ریدیزاین شده */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6 border border-outline-variant/30 relative overflow-hidden group">
            {/* هاله نور پس‌زمینه */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-br-full blur-3xl z-0 transition-all group-hover:bg-primary/20"></div>

            <div className="relative z-10 flex items-center justify-between">
              <h2 className="font-label-lg text-on-surface font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">memory</span>
                وضعیت سیستم
              </h2>
              <span className="flex h-3 w-3 relative" title="سیستم آنلاین است">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              {/* باکس دیتابیس */}
              <div className="p-4 rounded-xl bg-surface-container-highest/50 border border-outline-variant/30 hover:border-primary/30 transition-colors flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary shadow-sm border border-outline-variant/50 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">storage</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-on-surface-variant">دیتابیس</p>
                    <p className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">متصل (SQLite)</p>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5 font-mono flex items-center gap-2" dir="ltr">
                    <span><strong className="text-on-surface text-sm">52</strong> Usr</span>
                    <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                    <span><strong className="text-on-surface text-sm">43</strong> Srv</span>
                    <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                    <span><strong className="text-on-surface text-sm">5</strong> Pln</span>
                  </p>
                </div>
              </div>

              {/* باکس آدرس پنل */}
              <div className="p-4 rounded-xl bg-surface-container-highest/50 border border-outline-variant/30 hover:border-primary/30 transition-colors flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary shadow-sm border border-outline-variant/50 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">public</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm text-on-surface-variant mb-1">آدرس پنل</p>
                  <p className="text-on-surface font-mono text-sm truncate" dir="ltr">
                    <a href="http://216.106.191.213:3000" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                      http://216.106.191.213:3000
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}