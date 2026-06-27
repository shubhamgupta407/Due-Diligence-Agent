"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ReportView } from "@/components/ReportView";
import { AlertCircle, FileText, Search, Loader2, CheckCircle2, Database, Globe, Brain } from "lucide-react";

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState("new");
  const [companyName, setCompanyName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [traces, setTraces] = useState<string[]>([]);

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
      // Add initial login activity if empty
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
      const updated = [newActivity, ...prev].slice(0, 20); // Keep last 20
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
      // Remove older report for same company if it exists
      const filtered = prev.filter(r => r.companyName !== company);
      const updated = [newReport, ...filtered];
      localStorage.setItem("dueDil_reports", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setActiveTab("new"); // Force back to new analysis view
    setLoading(true);
    setError(null);
    setResult(null);
    setTraces([]);
    setSearchQuery(companyName); // lock in the name for the report header

    addActivity(`Started analysis for ${companyName}`, "system");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
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
        buffer = lines.pop() || ""; // Keep the incomplete chunk in the buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "trace") {
                setTraces((prev) => [...prev, data.message]);
              } else if (data.type === "result") {
                setResult(data.data);
                finalData = data.data;
              } else if (data.type === "error") {
                setError(data.message);
                addActivity(`Analysis failed for ${companyName}: ${data.message}`, "error");
                setLoading(false);
                return;
              }
            } catch (e) {
              console.error("Failed to parse stream data", line);
            }
          }
        }
      }

      if (finalData) {
        saveReport(companyName, finalData);
        addActivity(`System generated report for ${companyName}`, "report");
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      addActivity(`Error during analysis: ${err.message}`, "error");
    } finally {
      setLoading(false);
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
      return (
        <div className="max-w-5xl mx-auto py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm flex items-start gap-4">
                <div className={`mt-1 w-2 h-2 rounded-full ${
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

    if (activeTab === "settings") {
      return (
        <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">System Settings</h2>
          
          <div className="space-y-8">
            {/* API Keys */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">API Configuration</h3>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">Connected</span>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Synthesis LLM API Key (Groq)</label>
                  <div className="flex gap-3">
                    <input type="password" value="gsk_***************************************" readOnly className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono text-gray-500 focus:outline-none" />
                    <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors border border-gray-200" onClick={() => alert("In a production environment, this would invalidate your old API key and securely request a new one from your vault.")}>Rotate Key</button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Required for fast, open-source final synthesis and decision matrix generation.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Research Agent API Key (Tavily)</label>
                  <div className="flex gap-3">
                    <input type="password" value="tvly-***************************" readOnly className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono text-gray-500 focus:outline-none" />
                    <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors border border-gray-200" onClick={() => alert("In a production environment, this would invalidate your old API key and securely request a new one from your vault.")}>Rotate Key</button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 mb-2">Required by the Research Agent to crawl web search and scrape financial contexts.</p>
                  <p className="text-xs text-amber-600 font-medium mt-1">Warning: Key expires in 3 days.</p>
                </div>
              </div>
            </div>

            {/* Pipeline Configuration */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Engine Parameters</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Synthesis Model</label>
                    <select className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none shadow-sm">
                      <option>Llama-3-70b-8192 (Recommended)</option>
                      <option>Mixtral-8x7b-32768</option>
                      <option>Gemma-7b-it</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Vector Embedding Model</label>
                    <select className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none shadow-sm">
                      <option>all-MiniLM-L6-v2 (Fast/Local)</option>
                      <option>text-embedding-3-small</option>
                      <option>text-embedding-3-large</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                    <span className="text-sm font-bold text-gray-900">Strict Deterministic Mode</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-7">Forces the LLM temperature to 0 and enforces a strict JSON schema output format for all reports. Prevents hallucination.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end border-t border-gray-200 pt-6">
               <button className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-md transition-colors shadow-sm tracking-wide">Save Configuration</button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "support") {
      return (
        <div className="max-w-5xl mx-auto py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 capitalize">{activeTab}</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <p className="text-gray-500 text-sm">This module is currently in read-only mode for this demo workspace.</p>
          </div>
        </div>
      );
    }

    // Default "new" tab rendering
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
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <Loader2 size={20} className="text-blue-600 animate-spin" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Agent Execution Log</h2>
                  <p className="text-sm text-gray-500">Running institutional due diligence on {searchQuery}...</p>
                </div>
              </div>

              <div className="space-y-6">
                {traces.map((trace, i) => (
                  <div key={i} className="flex gap-4 animate-in slide-in-from-left-4 fade-in duration-300">
                    <div className="mt-0.5">
                      <CheckCircle2 size={18} className="text-green-500" />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{trace}</p>
                  </div>
                ))}
                {/* Current executing step (spinning) */}
                <div className="flex gap-4 opacity-50">
                  <div className="mt-0.5">
                    <Loader2 size={18} className="text-gray-400 animate-spin" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Agent is processing...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, Analyst.</h1>
              <p className="text-sm text-gray-500 mt-1">System is online. Ready to initiate due diligence pipelines.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Quick Start Card */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 border border-blue-100">
                    <Search size={24} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Initiate New Analysis</h2>
                  <p className="text-sm text-gray-600 max-w-md leading-relaxed">
                    Enter a company name or ticker in the search bar above to trigger the automated research pipeline. The engine will aggregate real-time data, vectorize context, and synthesize a deterministic decision matrix.
                  </p>
                </div>
                <div className="mt-8">
                   <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Suggested Targets</p>
                   <div className="flex flex-wrap gap-2">
                     <button onClick={() => setCompanyName("NVIDIA (NVDA)")} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-700 transition-colors">NVIDIA (NVDA)</button>
                     <button onClick={() => setCompanyName("Palantir (PLTR)")} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-700 transition-colors">Palantir (PLTR)</button>
                     <button onClick={() => setCompanyName("Snowflake (SNOW)")} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-700 transition-colors">Snowflake (SNOW)</button>
                   </div>
                </div>
              </div>

              {/* System Status Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
                <h2 className="text-[11px] font-semibold text-gray-400 mb-4 uppercase tracking-wider">System Status</h2>
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Vector Store</span>
                    <span className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">42,104 docs</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Embedding Engine</span>
                    <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium flex items-center gap-1.5 border border-green-200"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>Online</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">LLM Synthesis</span>
                    <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium flex items-center gap-1.5 border border-green-200"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">API Rate Limits</span>
                    <span className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">Healthy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Mini-Feed */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recent Pipeline Activity</h2>
                <button onClick={() => setActiveTab("recent")} className="text-xs text-blue-600 font-medium hover:underline">View All</button>
              </div>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        activity.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                        activity.type === 'report' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                        activity.type === 'system' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-gray-300'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent activity found in the logs.</p>
              )}
            </div>

          </div>
        )}

        {result && !loading && (
          <ReportView companyName={searchQuery} result={result} />
        )}
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-200 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        <Header 
          companyName={companyName}
          setCompanyName={setCompanyName}
          onSubmit={handleSubmit}
          loading={loading}
        />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
