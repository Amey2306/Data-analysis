import { LayoutDashboard, Building2, Map, PieChart, Settings, LogOut } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden sm:flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shrink-0">
          <div className="w-4 h-4 border-2 border-white transform rotate-45"></div>
        </div>
        <span className="font-bold text-lg tracking-tight">PropAnalytics</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2 mt-2">Analytics</div>
        <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Sales Dashboard" active />
        <NavItem icon={<Map className="w-5 h-5" />} label="Map Analysis" />
        <NavItem icon={<PieChart className="w-5 h-5" />} label="Opportunity Index" />
        
        <div className="h-4"></div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Management</div>
        <NavItem icon={<Building2 className="w-5 h-5" />} label="Portfolio" />
        <br/>
        <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" />
        <NavItem icon={<LogOut className="w-5 h-5" />} label="Logout" />
      </nav>
      
      <div className="p-4 border-t border-slate-100 flex items-center gap-3 text-sm shrink-0">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0">
          JD
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="font-semibold truncate">John Developer</div>
          <div className="text-xs text-slate-500 truncate">Senior Analyst</div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <a
      href="#"
      className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}
