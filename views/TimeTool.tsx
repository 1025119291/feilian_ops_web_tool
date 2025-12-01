import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';

const TimeTool: React.FC = () => {
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));
  const [inputTs, setInputTs] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const [inputDate, setInputDate] = useState<string>(new Date().toISOString().slice(0, 16));
  
  // Auto-update "Current Time"
  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const tsToDate = (ts: string) => {
    const num = parseInt(ts, 10);
    if (isNaN(num)) return '无效的时间戳';
    // Handle milliseconds if length is 13
    const date = new Date(ts.length === 13 ? num : num * 1000);
    return date.toLocaleString('zh-CN');
  };

  const dateToTs = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '无效的日期';
    return Math.floor(date.getTime() / 1000).toString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-500" />
          当前 Unix 时间戳
        </h2>
        <div className="text-4xl font-mono text-primary-600 font-bold tracking-tight">
          {now}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-medium text-slate-700 mb-3">时间戳 &rarr; 日期时间</h3>
          <div className="flex gap-2 mb-4">
             <input 
               type="text" 
               value={inputTs}
               onChange={(e) => setInputTs(e.target.value)}
               className="flex-1 p-2 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
               placeholder="输入 Unix 时间戳"
             />
             <button 
               onClick={() => setInputTs(now.toString())}
               className="p-2 text-slate-500 hover:text-primary-600 bg-slate-50 border border-slate-300 rounded-lg"
               title="设置为当前时间"
             >
               <RefreshCw className="w-4 h-4" />
             </button>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-slate-700 font-mono text-sm min-h-[44px] flex items-center">
            {tsToDate(inputTs)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-medium text-slate-700 mb-3">日期时间 &rarr; 时间戳</h3>
          <input 
             type="datetime-local" 
             value={inputDate}
             onChange={(e) => setInputDate(e.target.value)}
             className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none mb-4"
           />
           <div className="p-3 bg-slate-50 rounded-lg text-slate-700 font-mono text-sm min-h-[44px] flex items-center">
             {dateToTs(inputDate)}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTool;