import { Link, useLocation } from "wouter";
import { LayoutDashboard, User, BarChart3, MessageSquare, Truck } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";

export function DriverBottomNav() {
  const [location] = useLocation();
  const { unreadCounts } = useChatContext();
  
  // Calculate total unread messages for driver
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const navItems = [
    {
      label: "الرئيسية",
      icon: LayoutDashboard,
      path: "/driver/dashboard",
      active: location === "/driver/dashboard"
    },
    {
      label: "طلباتي",
      icon: Truck,
      path: "/driver/dashboard?tab=active",
      active: location === "/driver/dashboard" && new URLSearchParams(window.location.search).get('tab') === 'active'
    },
    {
      label: "الإحصائيات",
      icon: BarChart3,
      path: "/driver/stats",
      active: location === "/driver/stats"
    },
    {
      label: "الدعم",
      icon: MessageSquare,
      path: "/driver/support",
      active: location === "/driver/support"
    },
    {
      label: "حسابي",
      icon: User,
      path: "/driver/profile",
      active: location === "/driver/profile"
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 py-3 pb-8 flex justify-between items-center shadow-[0_-10px_25px_rgba(0,0,0,0.05)]" dir="rtl">
      {navItems.map((item) => (
        <Link key={item.path} href={item.path}>
          <button 
            className={`flex flex-col items-center gap-1 transition-all relative ${item.active ? 'text-orange-600 scale-110' : 'text-slate-400'}`}
          >
            <div className={`p-2 rounded-2xl ${item.active ? 'bg-orange-100' : ''}`}>
              <item.icon className="h-6 w-6" />
              {item.label === "الدعم" && totalUnread > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white">
                  {totalUnread}
                </span>
              )}
            </div>
            <span className="text-[10px] font-black">{item.label}</span>
          </button>
        </Link>
      ))}
    </nav>
  );
}
