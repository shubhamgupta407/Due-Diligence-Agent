import { Database, TrendingUp, Shield, Activity } from "lucide-react";

export function Methodology() {
  return (
    <section id="methodology" className="py-20 border-t border-[#222] mt-24">
      <div className="mb-12 max-w-2xl">
        <h2 className="text-2xl font-medium text-white mb-4">Evaluation Framework</h2>
        <p className="text-neutral-400 text-sm leading-relaxed">
          The agent evaluates companies using a strict, multi-dimensional framework based on institutional due diligence standards.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-[#222] border border-[#222] rounded-xl overflow-hidden">
        <div className="bg-[#0a0a0a] p-8">
          <Database size={18} className="text-neutral-400 mb-4" />
          <h3 className="text-sm font-medium text-white mb-2">1. Business Model Viability</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Analysis of core revenue streams, target market size, unit economics, and structural scalability.
          </p>
        </div>
        <div className="bg-[#0a0a0a] p-8">
          <TrendingUp size={18} className="text-neutral-400 mb-4" />
          <h3 className="text-sm font-medium text-white mb-2">2. Market Momentum</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Evaluation of the last 6-12 months of public data, product velocity, leadership changes, and funding history.
          </p>
        </div>
        <div className="bg-[#0a0a0a] p-8">
          <Shield size={18} className="text-neutral-400 mb-4" />
          <h3 className="text-sm font-medium text-white mb-2">3. Competitive Moat</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Assessment of market share, pricing power, intellectual property, and defensibility against incumbents.
          </p>
        </div>
        <div className="bg-[#0a0a0a] p-8">
          <Activity size={18} className="text-neutral-400 mb-4" />
          <h3 className="text-sm font-medium text-white mb-2">4. Risk Profile</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Identification of critical red flags including litigation, regulatory exposure, and macroeconomic sensitivity.
          </p>
        </div>
      </div>
    </section>
  );
}
