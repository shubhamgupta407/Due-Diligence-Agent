"use client";

import Link from "next/link";
import { ArrowRight, BarChart2, Search, Database, FileText, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden relative">
      
      {/* Elegant Organic Mesh Gradient Background - Moved to root level so it covers the hero */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden h-[800px]">
        {/* Top Left Blue Glow */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[80%] rounded-full bg-blue-300/20 blur-[120px]"></div>
        {/* Bottom Right Purple Glow */}
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[80%] rounded-full bg-purple-300/20 blur-[120px]"></div>
        {/* Center Top Subtle Teal Glow */}
        <div className="absolute top-[-10%] left-[30%] w-[40%] h-[60%] rounded-full bg-teal-300/20 blur-[100px]"></div>
        {/* Faint Base Texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiLz4KPC9zdmc+')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/70 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
              <BarChart2 size={16} className="text-white" />
            </div>
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-lg">Due Diligence</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Features</Link>
            <Link href="#architecture" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Architecture</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/platform" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16 relative z-10">
        {/* Hero Section with Split Layout & CSS Mockup */}
        <section className="relative overflow-hidden pt-20 pb-32">
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left Content */}
            <div className="lg:w-1/2 text-center lg:text-left pt-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-slate-200 text-xs font-semibold tracking-wide mb-6 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Now available for Early Access
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-br dark:from-slate-200 dark:to-slate-500 mb-6 leading-[1.05]">
                Financial research <br className="hidden md:block" />
                automation.
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 dark:text-[#8A95A5] mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                A system built to automate manual data collection. It aggregates market data, structures it into a semantic database, and generates objective investment reports.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/platform" className="w-full sm:w-auto bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2">
                  Start Analysis
                  <ArrowRight size={18} />
                </Link>
                <Link href="#architecture" className="w-full sm:w-auto bg-white/60 dark:bg-white/10 backdrop-blur border border-slate-200 dark:border-white/20 hover:bg-white/80 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 px-8 py-3.5 rounded-xl text-base font-semibold transition-all flex items-center justify-center shadow-sm">
                  View Docs
                </Link>
              </div>
            </div>

            {/* Right Side CSS Mockup */}
            <div className="lg:w-1/2 w-full perspective-[1000px] hidden md:block">
              <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-gray-800 transform rotate-y-[-5deg] rotate-x-[2deg] transition-transform duration-500 hover:rotate-y-0 hover:rotate-x-0">
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-3 text-xs font-mono text-gray-400">~/due-diligence-engine</span>
                </div>
                <div className="p-6">
                  <pre className="text-sm font-mono text-gray-300 leading-relaxed overflow-x-hidden whitespace-pre-wrap">
                    <code>
<span className="text-gray-500"># Initializing analysis pipeline...</span>{"\n"}
&gt; Analyzing <span className="text-blue-400">"NVIDIA Corp (NVDA)"</span>{"\n"}
<span className="text-emerald-400">✔</span> Aggregated 342 SEC filings and market reports{"\n"}
<span className="text-emerald-400">✔</span> Chunked into 8,450 vectors{"\n"}
<span className="text-emerald-400">✔</span> Stored in local DB{"\n"}
&gt; Querying for supply chain constraints...{"\n"}
<span className="text-emerald-400">✔</span> Retrieved top 5 data points{"\n"}
&gt; Generating synthesis...{"\n\n"}
<span className="text-gray-500">// OUTPUT</span>{"\n"}
{"{"}{"\n"}
  <span className="text-blue-400">"status"</span>: <span className="text-emerald-400">"Passed"</span>,{"\n"}
  <span className="text-blue-400">"score"</span>: <span className="text-yellow-300">92</span>,{"\n"}
  <span className="text-blue-400">"key_finding"</span>: <span className="text-yellow-300">"Blackwell orders filled through 2025"</span>,{"\n"}
  <span className="text-blue-400">"risks"</span>: [<span className="text-yellow-300">"TSMC dependence"</span>, <span className="text-yellow-300">"Custom silicon"</span>]{"\n"}
{"}"}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Engine - Compact Unified Panel */}
        <section id="features" className="py-24 px-4 sm:px-6 relative">
          <div className="max-w-7xl mx-auto">
            
            <div className="mb-12 text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">Processing pipeline.</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl font-normal">
                A continuous, high-performance flow of data parsing, local vectorization, and deterministic decision synthesis.
              </p>
            </div>

            {/* Unified Light Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">
              
              {/* Feature 1 */}
              <div className="flex-1 p-8 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <Search className="text-blue-600" size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Aggregation</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Parallel search routes across global news, SEC filings, and competitor data to pull live context instantly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex-1 p-8 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <Database className="text-purple-600" size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Vectorization</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Data is chunked and embedded via <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600">Transformers.js</code> into a local in-memory semantic vector store.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex-1 p-8 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="text-emerald-600" size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Synthesis</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Top conviction signals are passed to the LLM to deterministically output a final Invest/Pass JSON decision matrix.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* Bento Grid System Architecture */}
        <section id="architecture" className="py-24 px-4 sm:px-6 bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">Engine Architecture</h2>
              <p className="text-gray-600 text-lg">A modular, deterministic pipeline built for high-conviction analysis.</p>
            </div>
            
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
              
              {/* Aggregation (Span 1) */}
              <div className="md:col-span-1 bg-gray-50 border border-gray-200 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <Search size={120} />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-white shadow-sm border border-gray-200 rounded-xl flex items-center justify-center mb-6">
                      <Search className="text-gray-900" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">1. Aggregation</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Parallel search routing across global news, SEC filings, and competitor data to pull live context.</p>
                  </div>
                </div>
              </div>

              {/* RAG & Vectorization (Span 2) */}
              <div className="md:col-span-2 bg-slate-900 rounded-3xl p-8 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px]"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-white/10 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center mb-6">
                      <Database className="text-blue-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">2. Local Vectorization (RAG)</h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-md">Data is chunked and embedded via <code className="text-blue-300 font-mono text-xs">all-MiniLM-L6-v2</code> using Transformers.js. All vector embeddings are mapped into an in-memory store for zero-latency semantic retrieval.</p>
                  </div>
                  
                  {/* Decorative Mock Vectors */}
                  <div className="flex gap-2 mt-4">
                    {[42, 17, 89, 34, 65, 91].map((val, i) => (
                      <div key={i} className="flex-1 h-8 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                        <span className="text-[10px] text-slate-500 font-mono">[0.{val}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Synthesis (Span 2) */}
              <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-3xl p-8 relative overflow-hidden">
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-white shadow-sm border border-blue-200 rounded-xl flex items-center justify-center mb-6">
                      <FileText className="text-blue-600" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">3. Quantitative Synthesis</h3>
                    <p className="text-sm text-gray-600 leading-relaxed max-w-lg">Top signals are fed into the LLM synthesis node to deterministically map out the bull/bear case and calculate an explicit Invest/Pass decision.</p>
                  </div>
                  
                  {/* Decorative Pipeline */}
                  <div className="flex items-center gap-4 mt-6">
                    <div className="h-2 flex-1 bg-white rounded-full overflow-hidden border border-blue-100">
                      <div className="h-full bg-blue-500 w-3/4"></div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Processing</span>
                  </div>
                </div>
              </div>

              {/* Output (Span 1) */}
              <div className="md:col-span-1 bg-gray-50 border border-gray-200 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <BarChart2 size={120} />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-white shadow-sm border border-gray-200 rounded-xl flex items-center justify-center mb-6">
                      <Check className="text-emerald-600" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">4. Final Report</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Returns a structured JSON payload containing confidence scoring, key risk factors, and actionable insights.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-gray-900" />
            <span className="font-semibold text-gray-900">Due Diligence</span>
          </div>
          
          <div className="flex items-center gap-4 text-gray-500">
            <a href="https://github.com/shubhamgupta407" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition-colors" title="GitHub">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </a>
            <a href="https://www.linkedin.com/in/shubhamgupta407" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition-colors" title="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>

          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Due Diligence. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
