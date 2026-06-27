import { Search } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#222]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-white rounded-[4px] flex items-center justify-center">
              <Search size={12} className="text-black" strokeWidth={4} />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">Due Diligence</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#methodology" className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
              Framework
            </a>
            <a href="https://github.com/shubhamraj407" target="_blank" rel="noreferrer" className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
              Documentation
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
