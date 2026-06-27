import { Search, Bell, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  analysisMode: "single" | "batch";
  setAnalysisMode: (mode: "single" | "batch") => void;
  
  // Single mode props
  companyName: string;
  setCompanyName: (val: string) => void;
  
  // Batch mode props
  batchCompanies: string[];
  setBatchCompanies: React.Dispatch<React.SetStateAction<string[]>>;
  batchInput: string;
  setBatchInput: (val: string) => void;
  
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export function Header({ 
  analysisMode, setAnalysisMode,
  companyName, setCompanyName,
  batchCompanies, setBatchCompanies, batchInput, setBatchInput,
  onSubmit, loading 
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const handleAddBatchCompany = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = batchInput.trim();
      if (val && batchCompanies.length < 3 && !batchCompanies.includes(val)) {
        setBatchCompanies([...batchCompanies, val]);
        setBatchInput("");
      }
    }
  };

  const removeBatchCompany = (companyToRemove: string) => {
    setBatchCompanies(batchCompanies.filter(c => c !== companyToRemove));
  };

  return (
    <header className="h-auto min-h-[80px] py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between px-8 z-10 sticky top-0 shadow-sm">
      <div className="flex-1 w-full max-w-5xl flex flex-col xl:flex-row xl:items-center gap-6">
        
        {/* Mode Toggle */}
        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl shrink-0 border border-gray-200/50">
          <button 
            type="button"
            onClick={() => setAnalysisMode("single")}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${analysisMode === "single" ? "bg-white text-blue-700 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] ring-1 ring-black/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"}`}
          >
            Single Asset
          </button>
          <button 
            type="button"
            onClick={() => setAnalysisMode("batch")}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${analysisMode === "batch" ? "bg-white text-purple-700 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] ring-1 ring-black/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"}`}
          >
            Batch Mode <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-black ${analysisMode === "batch" ? "bg-purple-100 text-purple-800" : "bg-gray-200 text-gray-500"}`}>Max 3</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={onSubmit} className="relative flex items-center flex-1">
          {analysisMode === "single" ? (
            <>
              <div className="absolute left-4 text-gray-400">
                {loading ? <Loader2 size={20} className="animate-spin text-blue-600" /> : <Search size={20} />}
              </div>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Search company (e.g., Stripe, Airbnb)..."
                disabled={loading}
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 hover:bg-gray-100/50 border-2 border-transparent focus:bg-white rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-gray-400 shadow-inner"
              />
              {companyName && !loading && (
                <button
                  type="button"
                  onClick={() => setCompanyName("")}
                  className="absolute right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 flex-wrap min-h-[52px] bg-gray-50 border-2 border-transparent focus-within:bg-white rounded-2xl px-4 py-2 shadow-inner focus-within:ring-4 focus-within:ring-purple-500/10 focus-within:border-purple-500 transition-all">
                {batchCompanies.map(company => (
                  <span key={company} className="flex items-center gap-1 bg-purple-50 text-purple-700 text-sm font-bold px-3 py-1.5 rounded-lg border border-purple-100">
                    {company}
                    <button type="button" onClick={() => removeBatchCompany(company)} disabled={loading} className="hover:bg-purple-200 rounded-full p-0.5 ml-1 transition-colors"><X size={14} /></button>
                  </span>
                ))}
                
                {batchCompanies.length < 3 && (
                  <input
                    type="text"
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    onKeyDown={handleAddBatchCompany}
                    placeholder={batchCompanies.length === 0 ? "Type company & hit Enter..." : "Add another..."}
                    disabled={loading}
                    className="flex-1 bg-transparent min-w-[150px] text-base font-medium text-gray-900 focus:outline-none placeholder:text-gray-400"
                  />
                )}
                
                {/* Analyze All Button for Batch Mode */}
                {batchCompanies.length > 0 && (
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="ml-auto bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-5 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg shadow-purple-600/20"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Analyze Batch"}
                  </button>
                )}
              </div>
            </div>
          )}
          {analysisMode === "single" && <button type="submit" className="hidden" disabled={loading || !companyName.trim()} />}
        </form>
      </div>

      <div className="flex items-center gap-5 md:ml-6 mt-4 md:mt-0">
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
                  <p className="text-xs font-semibold text-gray-900">Batch Analysis Added</p>
                  <span className="text-[10px] text-gray-400">Just now</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">System upgraded to support concurrent pipeline execution.</p>
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
