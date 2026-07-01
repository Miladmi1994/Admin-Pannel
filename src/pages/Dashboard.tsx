import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// داده‌های تستی نمودار (در آینده می‌توانید لاگ‌های واقعی را جایگزین کنید)
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
  const [stats, setStats] = useState({
    totalIncome: 0,
    successfulSales: 0,
    activeConfigs: 0,
    abandonedCarts: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // دریافت تنظیمات و آمار مالی
        const resSettings = await fetch('/api/settings');
        const dataSettings = await resSettings.json();
        
        // دریافت کاربران برای شمارش کانفیگ‌های فعال
        const resUsers = await fetch('/api/users');
        const dataUsers = await resUsers.json();

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
      } catch (err) {
        console.error("خطا در دریافت اطلاعات داشبورد:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // تابع فرمت کردن اعداد به تومان
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

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

      {/* بخش تب‌ها و نمودار (بدون تغییر منطق نسبت به کدهای شما) */}
      <div className="mt-12 flex flex-col gap-6">
        <div className="flex gap-8 border-b border-surface-container-low px-2">
          <button className="pb-4 font-label-lg border-b-2 border-primary text-primary transition-colors">روند درآمد و فروش</button>
          <button className="pb-4 font-label-lg text-outline hover:text-on-surface transition-colors">مانیتورینگ سرورها</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
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

          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6 border border-outline-variant/30">
            <h2 className="font-label-lg text-on-surface font-medium">وضعیت سیستم</h2>
            <div className="flex flex-col gap-4">
               <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30">
                  <p className="text-sm text-on-surface-variant">ارتباط با دیتابیس:</p>
                  <p className="text-primary font-bold mt-1">متصل (telbot.db)</p>
               </div>
               <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30">
                  <p className="text-sm text-on-surface-variant">آی‌پی سرور بک‌اند:</p>
                  <p className="text-on-surface font-mono mt-1" dir="ltr">127.0.0.1:3000</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}