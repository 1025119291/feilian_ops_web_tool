import React, { useState, useMemo } from 'react';
import { Calculator, Clock, Hash, Calendar, ArrowRight, AlertCircle, Cpu } from 'lucide-react';

const DidTool: React.FC = () => {
  const [did, setDid] = useState('');

  const result = useMemo(() => {
    const cleanDid = did.trim();
    
    if (!cleanDid) return null;
    
    if (cleanDid.length < 8) {
      return { error: 'DID 长度不足 8 位' };
    }

    const hexPrefix = cleanDid.substring(0, 8);
    
    // Validate hex
    if (!/^[0-9a-fA-F]+$/.test(hexPrefix)) {
        return { error: '前 8 位包含非十六进制字符' };
    }

    const timestamp = parseInt(hexPrefix, 16);
    const date = new Date(timestamp * 1000);

    return {
      hex: hexPrefix,
      decimal: timestamp,
      date: date.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      }),
      isValidDate: !isNaN(date.getTime())
    };
  }, [did]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" /> DID 生成时间计算
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            通过解析 DID (Device ID) 的前 8 位十六进制代码，推算设备的生成时间。
          </p>
        </div>

        <div className="p-6">
          <div className="relative">
             <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">输入 DID</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Cpu className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={did}
                  onChange={(e) => setDid(e.target.value)}
                  className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono text-sm"
                  placeholder="例如: 66e25f82..."
                />
             </div>
          </div>
        </div>
      </div>

      {did && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
           <div className="p-6">
              {result?.error ? (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-100">
                  <AlertCircle className="w-5 h-5" />
                  <span>{result.error}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Step 1: Hex Extraction */}
                  <div className="relative p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center group hover:border-purple-200 transition-colors">
                     <div className="p-2 bg-white rounded-full shadow-sm mb-3">
                        <Hash className="w-5 h-5 text-slate-500" />
                     </div>
                     <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">提取前 8 位 (Hex)</span>
                     <span className="text-xl font-mono font-bold text-slate-700 break-all">
                       {result?.hex}
                     </span>
                     <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <ArrowRight className="w-5 h-5 text-slate-300" />
                     </div>
                  </div>

                  {/* Step 2: Decimal Conversion */}
                  <div className="relative p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center group hover:border-purple-200 transition-colors">
                     <div className="p-2 bg-white rounded-full shadow-sm mb-3">
                        <BinaryIcon className="w-5 h-5 text-blue-500" />
                     </div>
                     <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">转十进制 (Timestamp)</span>
                     <span className="text-xl font-mono font-bold text-blue-600">
                       {result?.decimal}
                     </span>
                     <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <ArrowRight className="w-5 h-5 text-slate-300" />
                     </div>
                  </div>

                  {/* Step 3: Date Format */}
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex flex-col items-center text-center">
                     <div className="p-2 bg-white rounded-full shadow-sm mb-3">
                        <Clock className="w-5 h-5 text-purple-600" />
                     </div>
                     <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">生成时间</span>
                     <span className="text-xl font-bold text-purple-700">
                       {result?.date}
                     </span>
                  </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const BinaryIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="14" y="14" width="4" height="6" rx="2"/><rect x="6" y="4" width="4" height="6" rx="2"/><path d="M6 20h4"/><path d="M14 10h4"/><path d="M6 14h2v6"/><path d="M14 4h2v6"/></svg>
);

export default DidTool;