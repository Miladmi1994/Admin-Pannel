import React from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: '1', uv: 4000 },
  { name: '2', uv: 3000 },
  { name: '3', uv: 5000 },
  { name: '4', uv: 2780 },
  { name: '5', uv: 6890 },
  { name: '6', uv: 2390 },
  { name: '7', uv: 4490 },
];

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
      {/* Welcome */}
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="font-headline-lg text-[28px] font-light text-on-surface">
          نمای کلی <span className="font-bold text-primary" style={{ textShadow: '0 0 10px rgba(78, 222, 163, 0.4)' }}>سیستم</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">وضعیت شبکه پایدار است و تمامی سرویس‌ها در حال اجرا هستند.</p>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'درآمد کل (تومان)', value: '۴۵,۰۰۰,۰۰۰', icon: 'account_balance_wallet', trend: '+۱۲٪', isBad: false },
          { title: 'فروش موفق', value: '۱۲۴', icon: 'shopping_cart_checkout', trend: '+۸٪', isBad: false, label: 'مورد' },
          { title: 'کانفیگ‌های فعال', value: '۳,۴۵۰', icon: 'network_check', trend: 'پایدار', isBad: false, indicator: true },
          { title: 'سبدهای رها شده', value: '۱۸', icon: 'remove_shopping_cart', trend: '-۲٪', isBad: true },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="glass-panel rounded-2xl p-6 flex flex-col gap-6 relative overflow-hidden group hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all"
          >
            <div className="flex justify-between items-center">
              <div className={`w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-on-surface-variant transition-colors ${stat.isBad ? 'group-hover:text-error' : 'group-hover:text-primary'}`}>
                <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
              </div>
              <span className={`font-label-lg text-label-lg px-3 py-1 rounded-full border flex items-center gap-1 ${
                stat.isBad 
                  ? 'text-error bg-error/5 border-error/10' 
                  : 'text-primary bg-primary/5 border-primary/10'
              }`}>
                {stat.indicator && <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>}
                {stat.trend}
              </span>
            </div>
            
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">{stat.title}</p>
              <div className="flex items-baseline gap-1">
                <p className="font-headline-md text-[28px] text-on-surface font-light tracking-tight">{stat.value}</p>
                {(!stat.indicator || stat.label) && <span className="font-body-sm text-body-sm text-on-surface-variant">{stat.label || 'تومان'}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabbed Section for Charts & Data */}
      <div className="mt-12 flex flex-col gap-6">
        {/* Tabs Header */}
        <div className="flex gap-8 border-b border-surface-container-low px-2">
          <button className="pb-4 font-label-lg border-b-2 border-primary text-primary transition-colors">روند درآمد و فروش</button>
          <button className="pb-4 font-label-lg text-outline hover:text-on-surface transition-colors">مانیتورینگ سرورها</button>
          <button className="pb-4 font-label-lg text-outline hover:text-on-surface transition-colors">گزارش ترافیک</button>
        </div>

        {/* Tab Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {/* Revenue Chart Area */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="font-label-lg text-on-surface font-medium">نمودار درآمد (۳۰ روز گذشته)</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded-lg text-xs font-medium bg-surface text-on-surface-variant hover:text-primary transition-colors cursor-pointer">هفتگی</button>
                <button className="px-3 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary transition-colors cursor-pointer">ماهانه</button>
              </div>
            </div>
            
            <div className="w-full h-72 relative flex items-end px-2 pb-6" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4edea3" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4edea3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1d2022', border: '1px solid #3c4a42', borderRadius: '12px', color: '#e0e3e5' }}
                    itemStyle={{ color: '#4edea3' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="uv" 
                    stroke="#4edea3" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorUv)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="font-label-lg text-on-surface font-medium">لاگ فعالیت‌ها</h2>
              <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex items-start gap-4 py-3 border-b border-surface-container-low/30 group">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 group-hover:shadow-[0_0_8px_rgba(78,222,163,0.6)] transition-shadow"></div>
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-on-surface">ثبت‌نام کاربر جدید</span>
                    <span className="text-[10px] text-outline">۲ دقیقه پیش</span>
                  </div>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">ali.reza@gmail.com</span>
                </div>
              </div>
              
              <div className="flex items-start gap-4 py-3 border-b border-surface-container-low/30 group">
                <div className="w-2 h-2 rounded-full bg-secondary mt-2 group-hover:shadow-[0_0_8px_rgba(69,223,164,0.6)] transition-shadow"></div>
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-on-surface">خرید پکیج ۳ ماهه</span>
                    <span className="text-[10px] text-outline">۱۵ دقیقه پیش</span>
                  </div>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">توسط کاربر #8492</span>
                </div>
              </div>
              
              <div className="flex items-start gap-4 py-3 border-b border-surface-container-low/30 group">
                <div className="w-2 h-2 rounded-full bg-error mt-2 group-hover:shadow-[0_0_8px_rgba(255,180,171,0.6)] transition-shadow"></div>
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-on-surface">افت سرعت سرور آلمان</span>
                    <span className="text-[10px] text-outline">۱ ساعت پیش</span>
                  </div>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">Node-DE-02</span>
                </div>
              </div>
              
              <div className="flex items-start gap-4 py-3 group">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 group-hover:shadow-[0_0_8px_rgba(78,222,163,0.6)] transition-shadow"></div>
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-on-surface">تمدید اشتراک</span>
                    <span className="text-[10px] text-outline">۳ ساعت پیش</span>
                  </div>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">کاربر ویژه</span>
                </div>
              </div>
            </div>
            
            <button className="mt-auto w-full py-2 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1 border border-surface-container-low rounded-lg hover:border-primary/30 hover:bg-primary/5 cursor-pointer">
              مشاهده کامل لاگ‌ها
              <span className="material-symbols-outlined text-[16px]">arrow_left</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
