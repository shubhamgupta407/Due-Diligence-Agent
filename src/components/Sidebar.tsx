import { Search, FolderOpen, Clock, Settings, HelpCircle, BarChart2, Activity, BookOpen } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const getTabClass = (tabId: string) => {
    return activeTab === tabId
      ? "flex items-center gap-3 px-3 py-2 bg-white text-blue-600 rounded-md font-medium text-sm shadow-sm border border-gray-200"
      : "flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors cursor-pointer";
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col justify-between hidden md:flex">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-white cursor-pointer" onClick={() => setActiveTab("new")}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
              <BarChart2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight text-lg">Due Diligence</span>
          </div>
        </div>
        <div className="p-4 mt-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Menu</p>
          <nav className="space-y-1">
            <a onClick={() => setActiveTab("new")} className={getTabClass("new")}>
              <Search size={16} />
              New Analysis
            </a>
            <a onClick={() => setActiveTab("saved")} className={getTabClass("saved")}>
              <FolderOpen size={16} />
              Saved Reports
            </a>
            <a onClick={() => setActiveTab("recent")} className={getTabClass("recent")}>
              <Clock size={16} />
              Recent Activity
            </a>
            <a onClick={() => setActiveTab("network")} className={getTabClass("network")}>
              <Activity size={16} />
              Agent Network
            </a>
            <a onClick={() => setActiveTab("framework")} className={getTabClass("framework")}>
              <BookOpen size={16} />
              Analysis Framework
            </a>
          </nav>
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        <nav className="space-y-1">
          <a onClick={() => setActiveTab("settings")} className={getTabClass("settings")}>
            <Settings size={16} />
            Settings
          </a>
          <a onClick={() => setActiveTab("support")} className={getTabClass("support")}>
            <HelpCircle size={16} />
            Support
          </a>
        </nav>
      </div>
    </div>
  );
}
