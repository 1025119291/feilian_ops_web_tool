import React, { useState, useCallback } from 'react';
import { Scale, Copy, ArrowRightLeft } from 'lucide-react';

type Unit = 'bit' | 'B' | 'KB' | 'MB' | 'GB' | 'TB';

const UNIT_LABELS: Record<Unit, string> = {
  bit: '比特 (bit)',
  B: '字节 (B)',
  KB: '千字节 (KB)',
  MB: '兆字节 (MB)',
  GB: '千兆字节 (GB)',
  TB: '太字节 (TB)',
};

const MULTIPLIERS: Record<Unit, number> = {
  bit: 1 / 8,
  B: 1,
  KB: 1024,
  MB: Math.pow(1024, 2),
  GB: Math.pow(1024, 3),
  TB: Math.pow(1024, 4),
};

const ByteConverter: React.FC = () => {
  // Store the base value in Bytes (B)
  const [baseValue, setBaseValue] = useState<number>(1048576); // Default 1MB
  // Track which field is being typed in to avoid formatting it while user interacts
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  const formatValue = (bytes: number, targetUnit: Unit): string => {
    if (isNaN(bytes)) return '';
    const val = bytes / MULTIPLIERS[targetUnit];
    if (val === 0) return '0';
    
    // For very small or very large numbers, use scientific notation
    if (Math.abs(val) < 0.000001 || Math.abs(val) > 1e15) {
      return val.toExponential(6);
    }
    
    // Standard fixed point, strip trailing zeros
    return parseFloat(val.toFixed(10)).toString();
  };

  const handleInputChange = (unit: Unit, value: string) => {
    setInputValue(value);
    setActiveUnit(unit);
    
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setBaseValue(parsed * MULTIPLIERS[unit]);
    } else {
      setBaseValue(NaN);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text || text === 'NaN') return;
    navigator.clipboard.writeText(text);
  };

  const renderInputRow = (unit: Unit) => {
    const isEditing = activeUnit === unit;
    const displayValue = isEditing ? inputValue : formatValue(baseValue, unit);

    return (
      <div key={unit} className="group relative">
        <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center gap-4 ${
          isEditing 
            ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-100 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
          <div className="md:w-40 shrink-0">
            <label className={`text-xs font-bold uppercase tracking-wider ${isEditing ? 'text-primary-600' : 'text-slate-400'}`}>
              {UNIT_LABELS[unit]}
            </label>
          </div>
          
          <div className="flex-1 flex items-center gap-3">
            <input
              type="text"
              value={displayValue}
              onChange={(e) => handleInputChange(unit, e.target.value)}
              onFocus={() => {
                setActiveUnit(unit);
                setInputValue(formatValue(baseValue, unit));
              }}
              onBlur={() => setActiveUnit(null)}
              className="w-full bg-transparent font-mono text-lg font-bold text-slate-800 outline-none focus:ring-0"
              placeholder="0"
            />
            
            <button 
              onClick={() => copyToClipboard(displayValue)}
              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="复制"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary-500" />
            全向字节单位换算
          </h2>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3" />
            在任意输入框输入即可自动转换
          </div>
        </div>

        <div className="space-y-3">
          {(Object.keys(UNIT_LABELS) as Unit[]).map(renderInputRow)}
        </div>
      </div>
      
      <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-widest">换算标准</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              本工具采用 <strong>JEDEC (binary)</strong> 标准进行换算：
              <span className="block mt-1 font-mono text-xs opacity-80">
                1 TB = 1024 GB | 1 GB = 1024 MB | 1 MB = 1024 KB | 1 KB = 1024 B | 1 Byte = 8 bits
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ByteConverter;