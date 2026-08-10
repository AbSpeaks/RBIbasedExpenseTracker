"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Building2, Landmark, 
  Settings, Target, Shield, CreditCard, Activity, BarChart3
} from "lucide-react";

export default function Sidebar() {
  const p = usePathname();
  
  const nav = [
    { n: "Dashboard", href: "/", i: <LayoutDashboard size={16} /> },
    { n: "Treasury", href: "/treasury", i: <Landmark size={16} /> },
    { n: "Ministries", href: "/ministries", i: <Building2 size={16} /> },
    { n: "Transactions", href: "/transactions", i: <CreditCard size={16} /> },
    { n: "Reserve Bank", href: "/reserve-bank", i: <Shield size={16} /> },
    { n: "Budget Plan", href: "/budget", i: <Target size={16} /> },
    { n: "Intelligence", href: "/intelligence", i: <Activity size={16} /> },
    { n: "Reports", href: "/reports", i: <BarChart3 size={16} /> },
    { n: "Settings", href: "/settings", i: <Settings size={16} /> },
  ];

  return (
    <>
      <div className="sidebar hidden md:flex w-56 h-screen fixed left-0 top-0 border-r border-[#1E2D4A] flex-col bg-[#070D19] z-40">
        <div className="p-6 border-b border-[#1E2D4A] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1E3A8A] border border-[#D4AF37] flex items-center justify-center text-xs shadow-[0_0_10px_rgba(212,175,55,0.1)]">
            🏛️
          </div>
          <div>
            <div className="font-serif font-bold text-xs tracking-wider text-[#F8FAFC]">RESERVE BANK</div>
            <div className="text-[9px] font-mono text-[#D4AF37] tracking-widest mt-0.5">OF ABIN</div>
          </div>
        </div>
        
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = p === item.href;
            return (
              <Link 
                key={item.n} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all ${
                  active 
                    ? "text-[#F8FAFC] bg-[#1E3A8A]/20 border-l-2 border-[#D4AF37]" 
                    : "text-[#94A3B8] border-l-2 border-transparent hover:text-[#F8FAFC] hover:bg-[#1E2D4A]/50"
                }`}
              >
                <span className={active ? "text-[#D4AF37]" : "text-[#64748B]"}>{item.i}</span>
                {item.n}
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-[#1E2D4A]">
          <div className="text-[10px] text-[#64748B] font-mono uppercase tracking-widest text-center">
            System V1.0.0
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="mobile-nav fixed bottom-0 left-0 right-0 h-16 bg-[#070D19] border-t border-[#1E2D4A] flex items-center justify-around px-2 z-40 md:hidden">
        {nav.slice(0, 5).map((item) => {
          const active = p === item.href;
          return (
            <Link 
              key={item.n} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                active ? "text-[#D4AF37]" : "text-[#64748B]"
              }`}
            >
              {item.i}
              <span className="text-[9px] font-medium">{item.n.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
