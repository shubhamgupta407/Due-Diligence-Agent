import { Search, Bell, Loader2 } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  companyName: string;
  setCompanyName: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export function Header({ companyName, setCompanyName, onSubmit, loading }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
      <div className="flex-1 max-w-2xl">
        <form onSubmit={onSubmit} className="relative flex items-center">
          <div className="absolute left-3 text-gray-400">
            {loading ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <Search size={16} />}
          </div>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Search company (e.g., Stripe, Anthropic)..."
            disabled={loading}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500 shadow-inner"
          />
          <button type="submit" className="hidden" disabled={loading || !companyName.trim()} />
        </form>
      </div>
      <div className="flex items-center gap-5 ml-6">
        <div className="relative">
          <button 
            className="text-gray-400 hover:text-gray-600 transition-colors relative focus:outline-none"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-2 border border-gray-200 z-50">
              <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900">System Notifications</h3>
                <span className="text-xs text-blue-600 cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-semibold text-gray-900">Vector Store Updated</p>
                  <span className="text-[10px] text-gray-400">2m ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">NVIDIA (NVDA) Q3 Earnings Call Transcript successfully chunked and vectorized.</p>
              </div>
              <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-semibold text-amber-600">API Key Expiring</p>
                  <span className="text-[10px] text-gray-400">1h ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">Your financial data provider API key expires in 3 days. Please rotate keys in settings.</p>
              </div>
              <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-semibold text-gray-900">Pipeline Sync Complete</p>
                  <span className="text-[10px] text-gray-400">3h ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">Market data pipeline synced successfully. 142 new SEC filings indexed.</p>
              </div>
            </div>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-semibold text-sm cursor-pointer hover:bg-blue-200 transition-colors">
          SR
        </div>
      </div>
    </header>
  );
}
