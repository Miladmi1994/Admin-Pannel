import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LayoutProps {
  onLogout: () => void;
}

const NAV_ITEMS = [
  { path: '/', label: 'داشبورد', icon: 'dashboard' },
  { path: '/servers', label: 'سرورها', icon: 'dns' },
  { path: '/users', label: 'کاربران', icon: 'group' },
  { path: '/plans', label: 'پکیج‌ها', icon: 'inventory_2' },
  { path: '/finance', label: 'مالی', icon: 'payments' },
  { path: '/marketing', label: 'مارکتینگ', icon: 'monitoring' },
  { path: '/admins', label: 'مدیران', icon: 'admin_panel_settings' },
];

export default function Layout({ onLogout }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full gap-xl px-4 py-xl">
      {/* Header */}
      <div className="flex items-center gap-md px-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-[18px] font-bold text-on-surface tracking-wide">مدیریت وی‌پی‌ان</span>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-3 rounded-l-xl font-label-lg text-label-lg transition-all duration-300 border-r-[3px]",
              isActive 
                ? "bg-gradient-to-l from-primary/5 to-transparent border-primary text-primary" 
                : "border-transparent text-on-surface-variant hover:text-primary hover:bg-surface"
            )}
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Links */}
      <div className="flex flex-col gap-2 mt-auto pr-2">
        <button 
          className="flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:text-primary rounded-l-xl border-transparent border-r-[3px] font-label-lg text-label-lg transition-all duration-300 hover:bg-surface cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
          <span>تنظیمات</span>
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:text-error rounded-l-xl border-transparent border-r-[3px] font-label-lg text-label-lg transition-all duration-300 hover:bg-error/5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span>خروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-on-background overflow-hidden rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-full border-l border-surface-container-low bg-background fixed right-0 top-0 w-[260px] z-50 transition-all duration-300">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-[260px] flex-col bg-background border-l border-surface-container-low md:hidden shadow-2xl"
            >
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute left-4 top-6 rounded-full p-2 text-on-surface-variant hover:bg-surface-variant cursor-pointer z-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:mr-[260px] h-screen overflow-hidden bg-background">
        {/* TopNavBar */}
        <header className="flex flex-row-reverse justify-between items-center px-xl py-lg w-full z-40 bg-background border-b border-surface-container-low">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer hover:bg-surface">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-primary transition-colors cursor-pointer bg-primary/5 hover:bg-primary/10">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </button>
            </div>
            
            <div className="w-px h-6 bg-surface-container-low hidden sm:block"></div>
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="hidden sm:flex flex-col items-end">
                <span className="font-label-lg text-label-lg text-on-surface group-hover:text-primary transition-colors">ادمین اصلی</span>
                <span className="font-label-md text-label-md text-on-surface-variant">پنل زمرد</span>
              </div>
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-surface-container-low group-hover:border-primary/50 transition-colors">
                <img 
                  alt="تصویر مدیر" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAG0sPNX5OzS2tI8sm_CaNqwdcU1qtfzb1z9SNsKMZigS0ZqMRQ8JZAiE_1ORec8QkasolcSc8v_TctV2E9sNoWjMv4uZvMJHZTm7pzjjHiQnADiIpeOBi5RnRohVD5AwVraD3BNvoVQw89ImxYH5tmR1qFv_HThdCVHBD0hIW6Yz5l5ex4FQpDWbHihMuL9McYA7OcQVn2p1og7CatWh2XQSh1jRdk9o239lPTgaUcuddUvfA4gHGB9jrkDvd-b2RS0X69Os43crc"
                />
              </div>
            </div>
          </div>
          
          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-on-surface-variant hover:text-primary p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-wide">مدیریت وی‌پی‌ان</span>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-on-surface-variant">
            <span className="font-body-sm text-body-sm">آخرین بروزرسانی: ۲ دقیقه پیش</span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.6)]"></span>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-xl custom-scrollbar relative z-10 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
