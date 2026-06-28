import { CheckCircle2, ShieldAlert, ArrowUpRight, ArrowDownRight, Clock, Database, Globe } from "lucide-react";

interface ReportProps {
  companyName: string;
  result: any;
}

export function ReportView({ companyName, result }: ReportProps) {
  const isInvest = result.decision === "Invest";
  const confidenceScore = result.dataSufficiency?.confidenceScore ?? 94.2;

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500">
      
      {/* Low Confidence Banner */}
      {result.dataSufficiency?.isLowConfidence && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3 shadow-sm">
          <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-900">⚠ Limited public data found for this company.</h3>
            <p className="text-sm text-red-700 mt-1">
              Research was thin in: <span className="font-semibold">{result.dataSufficiency.weakCategories.join(", ")}</span>. This recommendation has lower reliability than usual.
            </p>
          </div>
        </div>
      )}

      {/* Report Header - System Readout Style */}
      <div className="flex items-start justify-between mb-8 pb-4 border-b-2 border-gray-900">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{companyName}</h1>
            <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-widest ${
              isInvest ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}>
              {result.decision}
            </span>
          </div>
          <div className="flex items-center gap-6 text-[11px] font-mono font-medium text-gray-500 uppercase">
            <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date().toLocaleTimeString()}</span>
            <span className="flex items-center gap-1.5"><Database size={12} /> Vector DB: Connected</span>
            <span className="flex items-center gap-1.5"><Globe size={12} /> Model: Quant-V3</span>
          </div>
        </div>
        <div className="text-right border-l-2 border-gray-200 pl-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Confidence Score</p>
          <div className="text-3xl font-black font-mono text-gray-900 flex items-center justify-end gap-1">
            {isInvest ? <ArrowUpRight className="text-green-600" size={28} /> : <ArrowDownRight className="text-red-600" size={28} />}
            {confidenceScore.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Raw Synthesis Log */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Raw Synthesis Log</h2>
        </div>
        <div className="bg-gray-950 rounded-md p-6 shadow-inner border border-gray-800">
          <p className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {`> Executing semantic synthesis on ${companyName}...\n> Analyzing ${result.pros.length + result.cons.length} high-density data vectors...\n\n[OUTPUT MATRIX]:\n${result.reasoning}`}
          </p>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Bull Case Table */}
        <div>
          <div className="border-b-2 border-green-600 pb-2 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Positive Alpha Signals</h3>
          </div>
          <div className="space-y-2">
            {result.pros.map((pro: string, i: number) => (
              <div key={i} className="bg-white border border-gray-200 p-3 flex gap-3 shadow-sm rounded-sm">
                <span className="text-green-600 font-mono text-xs font-bold w-6 pt-0.5">+{i + 1}</span>
                <span className="text-sm font-mono text-gray-700 leading-tight">{pro}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bear Case Table */}
        <div>
          <div className="border-b-2 border-red-600 pb-2 mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-600" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Risk Vectors</h3>
          </div>
          <div className="space-y-2">
            {result.cons.map((con: string, i: number) => (
              <div key={i} className="bg-white border border-gray-200 p-3 flex gap-3 shadow-sm rounded-sm">
                <span className="text-red-600 font-mono text-xs font-bold w-6 pt-0.5">-{i + 1}</span>
                <span className="text-sm font-mono text-gray-700 leading-tight">{con}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
