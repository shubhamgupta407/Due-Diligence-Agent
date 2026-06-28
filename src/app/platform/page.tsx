"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ReportView } from "@/components/ReportView";
import { AlertCircle, FileText, Search, Loader2, CheckCircle2, Database, Globe, Brain, Briefcase, Newspaper, Users, ShieldAlert, X } from "lucide-react";

type BatchStatusData = {
  loading: boolean;
  error: string | null;
  result: any | null;
  traces: string[];
};

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState("new");
  const [showColdStartNotice, setShowColdStartNotice] = useState(true);
  
  // Single Mode States
  const [companyName, setCompanyName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [traces, setTraces] = useState<string[]>([]);

  // Batch Mode States
  const [analysisMode, setAnalysisMode] = useState<"single" | "batch">("single");
  const [batchCompanies, setBatchCompanies] = useState<string[]>([]);
  const [batchInput, setBatchInput] = useState("");
  const [batchStatus, setBatchStatus] = useState<Record<string, BatchStatusData>>({});
  const [batchOverallLoading, setBatchOverallLoading] = useState(false);

  // State for real data
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedReports = localStorage.getItem("dueDil_reports");
    if (storedReports) {
      setSavedReports(JSON.parse(storedReports));
    }
    const storedActivity = localStorage.getItem("dueDil_activity");
    if (storedActivity) {
      setRecentActivity(JSON.parse(storedActivity));
    } else {
      const initialActivity = [{
        id: Date.now(),
        type: "login",
        message: "User logged in",
        timestamp: new Date().toISOString()
      }];
      setRecentActivity(initialActivity);
      localStorage.setItem("dueDil_activity", JSON.stringify(initialActivity));
    }
  }, []);

  const addActivity = (message: string, type: string) => {
    const newActivity = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toISOString()
    };
    setRecentActivity(prev => {
      const updated = [newActivity, ...prev].slice(0, 20);
      localStorage.setItem("dueDil_activity", JSON.stringify(updated));
      return updated;
    });
  };

  const saveReport = (company: string, reportData: any) => {
    const newReport = {
      id: Date.now(),
      companyName: company,
      decision: reportData.decision,
      timestamp: new Date().toISOString(),
      reportData
    };
    setSavedReports(prev => {
      const filtered = prev.filter(r => r.companyName !== company);
      const updated = [newReport, ...filtered];
      localStorage.setItem("dueDil_reports", JSON.stringify(updated));
      return updated;
    });
  };

  // The core fetch logic extracted for reuse in Single and Batch modes
  const runAnalysisFetch = async (targetCompany: string, onTrace: (msg: string) => void, onResult: (res: any) => void, onError: (err: string) => void) => {
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: targetCompany }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to initiate research.");
      }
      if (!response.body) throw new Error("No response stream available.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalData = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "trace") {
                onTrace(data.message);
              } else if (data.type === "result") {
                finalData = data.data;
                onResult(data.data);
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch (e: any) {
              if (e.message !== "Unexpected end of JSON input") {
                 // rethrow custom stream errors
                 if (line.includes('"type":"error"')) throw e;
              }
            }
          }
        }
      }

      if (finalData) {
        saveReport(targetCompany, finalData);
        addActivity(`System generated report for ${targetCompany}`, "report");
      }
    } catch (err: any) {
      onError(err.message || "An unexpected error occurred.");
      addActivity(`Error during analysis for ${targetCompany}: ${err.message}`, "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (analysisMode === "single") {
      if (!companyName.trim()) return;
      
      setActiveTab("new");
      setLoading(true);
      setError(null);
      setResult(null);
      setTraces([]);
      setSearchQuery(companyName);

      addActivity(`Started analysis for ${companyName}`, "system");

      await runAnalysisFetch(
        companyName, 
        (msg) => setTraces(prev => [...prev, msg]),
        (res) => setResult(res),
        (err) => setError(err)
      );
      
      setLoading(false);

    } else {
      // Batch Mode
      if (batchCompanies.length === 0) return;

      setActiveTab("new");
      setBatchOverallLoading(true);
      
      // Initialize states for all companies
      const initialStatus: Record<string, BatchStatusData> = {};
      batchCompanies.forEach(c => {
        initialStatus[c] = { loading: true, error: null, result: null, traces: [] };
      });
      setBatchStatus(initialStatus);

      addActivity(`Started batch analysis for ${batchCompanies.length} entities`, "system");

      // Run all concurrently
      await Promise.all(batchCompanies.map(async (company) => {
        await runAnalysisFetch(
          company,
          (msg) => setBatchStatus(prev => ({
            ...prev,
            [company]: { ...prev[company], traces: [...prev[company].traces, msg] }
          })),
          (res) => setBatchStatus(prev => ({
            ...prev,
            [company]: { ...prev[company], result: res, loading: false }
          })),
          (err) => setBatchStatus(prev => ({
            ...prev,
            [company]: { ...prev[company], error: err, loading: false }
          }))
        );
      }));

      setBatchOverallLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  // Helper to render the terminal view for a specific execution
  const renderTerminal = (tracesArray: string[], isCurrentlyLoading: boolean, title: string) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
          {isCurrentlyLoading ? <Loader2 size={16} className="text-blue-600 animate-spin" /> : <CheckCircle2 size={16} className="text-green-500" />}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900 tracking-tight truncate">{title}</h2>
          <p className="text-xs text-gray-500 truncate">{isCurrentlyLoading ? "Running due diligence pipeline..." : "Analysis complete."}</p>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {tracesArray.length === 0 && isCurrentlyLoading && (
           <p className="text-sm text-gray-400 italic">Initializing pipeline...</p>
        )}
        {tracesArray.map((trace, i) => (
          <div key={i} className="flex gap-3 animate-in slide-in-from-left-2 fade-in duration-300">
            <div className="mt-0.5 shrink-0">
              <CheckCircle2 size={14} className="text-green-500" />
            </div>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">{trace}</p>
          </div>
        ))}
        {isCurrentlyLoading && (
          <div className="flex gap-3 opacity-50">
            <div className="mt-0.5 shrink-0">
              <Loader2 size={14} className="text-gray-400 animate-spin" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Agent is processing...</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeTab === "saved") {
      return (
        <div className="max-w-5xl mx-auto py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved Reports</h2>
          {savedReports.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
              <FileText size={32} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No reports yet</h3>
              <p className="text-gray-500">Run an analysis to save your first report.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {savedReports.map((report) => (
                <div 
                  key={report.id} 
                  className="p-4 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setAnalysisMode("single");
                    setSearchQuery(report.companyName);
                    setResult(report.reportData);
                    setActiveTab("new");
                  }}
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{report.companyName} Analysis</h3>
                    <p className="text-sm text-gray-500">Generated {formatDate(report.timestamp)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    report.decision === "Invest" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {report.decision}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "recent") {
       // ... existing recent tab rendering
       return (
        <div className="max-w-5xl mx-auto py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm flex items-start gap-4">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  activity.type === 'error' ? 'bg-red-500' :
                  activity.type === 'report' ? 'bg-blue-500' :
                  activity.type === 'system' ? 'bg-yellow-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === "network") {
      return (
        <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-300">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Agent Network</h2>
            <p className="text-sm text-gray-500">Live topology of active reasoning models and orchestrators</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Diagram Container */}
            <div className="flex-1 bg-gray-50 p-12 relative overflow-x-auto min-h-[460px] flex items-center">
              {/* Dotted Background */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="relative z-10 flex items-center justify-between min-w-[900px] w-full gap-16 h-full mx-auto px-8">
                
                {/* Column 1 */}
                <div className="flex-shrink-0 w-64 relative">
                  <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 tracking-wider"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>ACTIVE</span>
                      <span className="text-[10px] font-mono text-gray-400">1.2ms</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-50 rounded text-blue-600 flex items-center justify-center"><Search size={16} /></div>
                      <h3 className="text-base font-bold text-gray-900">Intake Agent</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">Ingests incoming search requests and triggers parallel SEC & News scrapers.</p>
                    <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold tracking-wider border-t border-gray-100 pt-3">
                      <span>VOL</span>
                      <span>142/m</span>
                    </div>
                  </div>
                </div>

                {/* Column 2 (Stacked) */}
                <div className="flex-shrink-0 w-64 flex flex-col gap-8 relative">
                  {/* Splitting Connector (Left side) */}
                  <div className="absolute top-[25%] -left-16 w-16 h-[50%] z-0">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
                      <path d="M 0 50 L 50 50 L 50 0 L 100 0" fill="none" stroke="#9ca3af" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="animate-flow-dash" />
                      <path d="M 50 50 L 50 100 L 100 100" fill="none" stroke="#9ca3af" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="animate-flow-dash" />
                    </svg>
                  </div>
                  
                  {/* Merging Connector (Right side) */}
                  <div className="absolute top-[25%] -right-16 w-16 h-[50%] z-0">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
                      <path d="M 0 0 L 50 0 L 50 50 L 100 50" fill="none" stroke="#9ca3af" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="animate-flow-dash" />
                      <path d="M 0 100 L 50 100 L 50 50" fill="none" stroke="#9ca3af" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="animate-flow-dash" />
                    </svg>
                  </div>
                  
                  {/* Node 2A */}
                  <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 tracking-wider"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>ACTIVE</span>
                      <span className="text-[10px] font-mono text-gray-400">42ms</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-amber-50 rounded text-amber-600 flex items-center justify-center"><Globe size={16} /></div>
                      <h3 className="text-base font-bold text-gray-900">Research Agent</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">Uses Tavily API to gather real-time data and populate the shared LangGraph state schema.</p>
                    <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold tracking-wider border-t border-gray-100 pt-3">
                      <span>VOL</span>
                      <span>1,420/m</span>
                    </div>
                  </div>
                  
                  {/* Node 2B */}
                  <div className="bg-white border border-purple-200 rounded-xl p-5 shadow-sm relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 tracking-wider"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>ACTIVE</span>
                      <span className="text-[10px] font-mono text-gray-400">2.4s</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-purple-50 rounded text-purple-600 flex items-center justify-center"><Brain size={16} /></div>
                      <h3 className="text-base font-bold text-gray-900">Reasoning Agent</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">Evaluates the shared state schema, applies logical reasoning, and builds the thesis.</p>
                    <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold tracking-wider border-t border-gray-100 pt-3">
                      <span>VOL</span>
                      <span>24/m</span>
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="flex-shrink-0 w-64 relative">
                  <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 tracking-wider"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>ACTIVE</span>
                      <span className="text-[10px] font-mono text-gray-400">18ms</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded text-emerald-600 flex items-center justify-center"><CheckCircle2 size={16} /></div>
                      <h3 className="text-base font-bold text-gray-900">Decision Matrix</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">Packages full diagnostic context into a deterministic JSON matrix.</p>
                    <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold tracking-wider border-t border-gray-100 pt-3">
                      <span>VOL</span>
                      <span>24/m</span>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "framework") {
      return (
        <div className="max-w-5xl mx-auto py-12 animate-in fade-in duration-500">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-4">The Due Diligence Matrix</h2>
            <p className="text-base text-gray-500 max-w-2xl mx-auto">
              Our Research Agents execute a highly parallelized search across four primary dimensions to synthesize a deterministic verdict.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* 1. Business Overview */}
            <div className="lg:col-span-8 group relative bg-white border border-gray-200 rounded-3xl p-8 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-500 h-full flex flex-col">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
              <div className="absolute -right-6 -top-12 text-[160px] font-black text-gray-50 select-none group-hover:text-blue-50/50 transition-colors duration-300 pointer-events-none tracking-tighter">01</div>
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20">
                  <Briefcase size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-blue-700 transition-colors">Business Overview</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-8 max-w-2xl">
                  Evaluates fundamental operations, core business models, target demographics, and primary revenue streams. We analyze the core unit economics and long-term viability to establish a comprehensive baseline context.
                </p>
                <div className="flex gap-3 mt-auto">
                  <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-200">Revenue Engine</span>
                  <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-200">Market Fit</span>
                </div>
              </div>
            </div>

            {/* 2. Recent News */}
            <div className="lg:col-span-4 group relative bg-white border border-gray-200 rounded-3xl p-8 overflow-hidden shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-500 h-full flex flex-col">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -ml-20 -mb-20 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
              <div className="absolute -right-6 -top-12 text-[160px] font-black text-gray-50 select-none group-hover:text-purple-50/50 transition-colors duration-300 pointer-events-none tracking-tighter">02</div>
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-600/20">
                  <Newspaper size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-purple-700 transition-colors">Recent News</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-8">
                  Scans global press releases and news coverage from the last 6-12 months for major developments.
                </p>
                <div className="flex gap-3 flex-wrap mt-auto">
                  <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-200">Funding Events</span>
                  <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-200">PR Sentiment</span>
                </div>
              </div>
            </div>

            {/* 3. Competitor Landscape */}
            <div className="lg:col-span-5 group relative bg-white border border-gray-200 rounded-3xl p-8 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-500 h-full flex flex-col">
               <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -ml-20 -mt-20 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
               <div className="absolute -right-6 -top-12 text-[160px] font-black text-gray-50 select-none group-hover:text-emerald-50/50 transition-colors duration-300 pointer-events-none tracking-tighter">03</div>
               <div className="relative z-10 flex-1 flex flex-col">
                 <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-600/20">
                   <Users size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-emerald-700 transition-colors">Competitor Landscape</h3>
                 <p className="text-gray-600 text-sm leading-relaxed mb-8">
                   Maps out the competitive ecosystem, identifying peer rivals and calculating relative market share.
                 </p>
                 <div className="flex gap-3 flex-wrap mt-auto">
                  <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-200">Moat Analysis</span>
                  <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-200">Peer Comparison</span>
                </div>
               </div>
            </div>

            {/* 4. Risk Factors */}
            <div className="lg:col-span-7 group relative bg-white border border-gray-200 rounded-3xl p-8 overflow-hidden shadow-sm hover:shadow-xl hover:border-red-300 transition-all duration-500 h-full flex flex-col">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-20 -mb-20 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
              <div className="absolute -right-6 -top-12 text-[160px] font-black text-gray-50 select-none group-hover:text-red-50/50 transition-colors duration-300 pointer-events-none tracking-tighter">04</div>
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-600/20">
                  <ShieldAlert size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-red-700 transition-colors">Risk Factors & Liabilities</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-8 max-w-2xl">
                  Actively hunts for existential threats, regulatory headwinds, ongoing litigation, and abrupt leadership changes. We deeply cross-reference filings to form the bear case.
                </p>
                <div className="flex gap-3 flex-wrap mt-auto">
                  <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-200">Litigation Check</span>
                  <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-200">Regulatory Headwinds</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      );
    }

    if (activeTab === "settings") {
       // ... same as before
       return (
        <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">System Settings</h2>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-gray-500">
             Settings module active.
          </div>
        </div>
      );
    }

    // Default "new" tab rendering
    
    // Condition 1: Single mode actively loading or has result
    if (analysisMode === "single") {
      return (
        <>
          {error && (
            <div className="max-w-5xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-3 text-sm shadow-sm">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          {loading && !result && (
            <div className="max-w-3xl mx-auto py-16 animate-in fade-in duration-500">
               {renderTerminal(traces, loading, `Agent Execution Log: ${searchQuery}`)}
            </div>
          )}

          {!loading && !result && !error && (
            <div className="max-w-4xl mx-auto mt-12 relative animate-in fade-in duration-700">
              {/* Decorative Background Orbs */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-400/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
              <div className="absolute top-20 left-1/2 -translate-x-1/4 w-[400px] h-[200px] bg-purple-400/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

              <div className="text-center mb-12 relative z-10">
                <div className="w-16 h-16 bg-white/80 backdrop-blur-xl text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/5 border border-white/50 relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                  <Search size={28} strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-800 to-gray-500 mb-3 tracking-tight">Ready to begin research</h1>
                <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                  Enter a company name or ticker in the search bar above to initiate a comprehensive due diligence report.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 relative z-10">
                <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:bg-white transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                      <Briefcase size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1.5">Single Asset Analysis</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Search for a single company to generate a deep-dive report covering business models, recent news, competitors, and risk factors.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:bg-white transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-white text-purple-600 rounded-xl flex items-center justify-center mb-5 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                      <Database size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1.5">Batch Processing</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Toggle to Batch Mode to analyze up to 3 companies concurrently. Perfect for screening multiple competitors in the same sector.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && !loading && (
            <ReportView companyName={searchQuery} result={result} />
          )}
        </>
      );
    }

    // Condition 2: Batch Mode actively loading or has results
    if (analysisMode === "batch") {
      const hasStartedBatch = Object.keys(batchStatus).length > 0;

      if (!hasStartedBatch) {
        return (
          <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500">
             <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Batch Analysis Mode</h1>
                <p className="text-sm text-gray-500 mt-1">Run concurrent multi-agent pipelines for up to 3 entities simultaneously.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
                <Database size={48} className="mx-auto text-blue-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Awaiting Batch Input</h3>
                <p className="text-gray-500 max-w-md mx-auto">Use the top navigation bar to add companies to the batch queue and hit Analyze.</p>
              </div>
          </div>
        );
      }

      // Render the grid of terminals or reports
      return (
        <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Batch Processing: {batchCompanies.length} Entities</h2>
            {batchOverallLoading && (
              <span className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Loader2 size={14} className="animate-spin" /> Pipelines Active
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {batchCompanies.map(company => {
              const status = batchStatus[company];
              if (!status) return null;

              return (
                <div key={company} className="flex flex-col gap-4">
                  {/* If error, show error card */}
                  {status.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-3 text-sm shadow-sm">
                      <AlertCircle size={16} className="shrink-0" />
                      <p className="break-words">{company}: {status.error}</p>
                    </div>
                  )}

                  {/* If loading OR has no result but no error, show terminal */}
                  {(status.loading || (!status.result && !status.error)) && (
                    <div className="h-96">
                      {renderTerminal(status.traces, status.loading, company)}
                    </div>
                  )}

                  {/* If finished and has result, show ReportView inline (scaled down naturally by grid) */}
                  {!status.loading && status.result && (
                    <div className="h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col relative">
                      {status.result.dataSufficiency?.isLowConfidence && (
                        <div className="bg-red-50 px-4 py-1.5 border-b border-red-100 flex items-center gap-2">
                          <AlertCircle size={12} className="text-red-600" />
                          <span className="text-[10px] font-bold text-red-800 uppercase tracking-widest">Low Data Confidence</span>
                        </div>
                      )}
                      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-gray-900 truncate pr-4">{company}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase shrink-0 ${
                          status.result.decision === "Invest" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {status.result.decision}
                        </span>
                      </div>
                      <div className="p-4 flex-1 overflow-y-auto">
                        <p className="text-sm text-gray-700 leading-relaxed mb-4">{status.result.reasoning}</p>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Alpha Signals</h4>
                            <ul className="space-y-1.5">
                              {status.result.pros.map((p: string, i: number) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-green-500">•</span> {p}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Risk Vectors</h4>
                            <ul className="space-y-1.5">
                              {status.result.cons.map((c: string, i: number) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-red-500">•</span> {c}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-200 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        <Header 
          analysisMode={analysisMode}
          setAnalysisMode={setAnalysisMode}
          companyName={companyName}
          setCompanyName={setCompanyName}
          batchCompanies={batchCompanies}
          setBatchCompanies={setBatchCompanies}
          batchInput={batchInput}
          setBatchInput={setBatchInput}
          onSubmit={handleSubmit}
          loading={analysisMode === "single" ? loading : batchOverallLoading}
        />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderContent()}
        </main>
      </div>

      {showColdStartNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-900 text-blue-50 p-4 rounded-xl shadow-2xl max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-500 flex gap-3 items-start border border-blue-800">
          <AlertCircle size={20} className="shrink-0 text-blue-300 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm mb-1 text-white">Render Free Tier Host</h4>
            <p className="text-xs text-blue-200 leading-relaxed">
              This application is hosted on Render's free tier. Your very first search may take <strong>25-30 seconds</strong> to initialize due to a server cold start.
            </p>
          </div>
          <button 
            onClick={() => setShowColdStartNotice(false)}
            className="text-blue-400 hover:text-white transition-colors p-1 -mt-1 -mr-1"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
