import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const formatNumber = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

export default function Marketing() {
  const [isLoading, setIsLoading] = useState(true);
  const [marketing, setMarketing] = useState({
    ltv: 0,
    loyalCustomers: 0,
    whales: 0,
    serverDensity: 0,
    testToBuyConversion: 0,
    totalUsers: 0,
    topPlans: [] as { name: string; sold: number; percent: number }[],
  });

  useEffect(() => {
    fetch('/api/marketing')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMarketing(data.marketing);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const stats = [
    {
      title: 'ارزش طول عمر مشتری (LTV)',
      value: `${formatNumber(marketing.ltv)} ت`,
      icon: 'monitoring',
      desc: 'میانگین پرداختی هر کاربر',
    },
    {
      title: 'مشتریان وفادار',
      value: formatNumber(marketing.loyalCustomers),
      icon: 'favorite',
      desc: 'بیش از ۳ بار تمدید',
    },
    {
      title: 'مشتریان پرخرج (Whales)',
      value: formatNumber(marketing.whales),
      icon: 'diamond',
      desc: 'بیش از ۵ میلیون تومان خرید',
    },
    {
      title: 'تراکم سرورها',
      value: `${formatNumber(marketing.serverDensity)}٪`,
      icon: 'dns',
      desc: 'میانگین بار نسبت به شلوغ‌ترین سرور',
    },
  ];

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
      <div className="mb-xl">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">آمار و مارکتینگ</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          تحلیل رفتار کاربران و فروش · {formatNumber(marketing.totalUsers)} کاربر · نرخ تبدیل تست: {formatNumber(marketing.testToBuyConversion)}٪
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center bg-surface-container rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary text-[40px] mb-4">progress_activity</span>
          <p className="text-on-surface-variant text-lg">در حال دریافت آمار...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel rounded-3xl p-6 relative overflow-hidden group border border-outline-variant/30"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full blur-2xl z-0 group-hover:bg-primary/20 transition-all"></div>
                
                <div className="flex justify-between items-start mb-4 z-10 relative">
                  <div className="w-12 h-12 bg-primary/20 text-primary border border-primary/30 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
                  </div>
                </div>
                <h3 className="text-on-surface-variant font-label-md text-label-md mb-1 z-10 relative">{stat.title}</h3>
                <p className="font-headline-md text-headline-md font-bold text-on-surface mb-2 z-10 relative">{stat.value}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant z-10 relative">{stat.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-panel rounded-3xl p-6 border border-outline-variant/30"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-secondary text-[24px]">star</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">پرفروش‌ترین پکیج‌ها</h3>
              </div>
              {marketing.topPlans.length === 0 ? (
                <p className="text-on-surface-variant text-center py-8">داده فروش پکیج موجود نیست.</p>
              ) : (
                <div className="space-y-4">
                  {marketing.topPlans.map((pkg) => (
                    <div key={pkg.name} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/30 hover:bg-surface-container-high/50 transition-colors">
                      <span className="font-label-lg text-label-lg text-on-surface">{pkg.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{formatNumber(pkg.sold)} فروش</span>
                        <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1">
                          {formatNumber(pkg.percent)}٪
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
