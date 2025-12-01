import React, { useState } from 'react';
import { ArrowDownUp, Link as LinkIcon, Lock } from 'lucide-react';
import clsx from 'clsx';

type Tab = 'base64' | 'url' | 'jwt';

const EncodingTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('base64');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const handleBase64 = (str: string, isEncode: boolean) => {
    try {
      if (isEncode) {
        return btoa(unescape(encodeURIComponent(str))); // Handle UTF-8
      } else {
        return decodeURIComponent(escape(atob(str)));
      }
    } catch (e) {
      return "Base64 格式无效";
    }
  };

  const handleUrl = (str: string, isEncode: boolean) => {
    try {
      return isEncode ? encodeURIComponent(str) : decodeURIComponent(str);
    } catch (e) {
      return "URL 格式无效";
    }
  };

  const handleJwt = (token: string) => {
    try {
      if (!token) return '';
      const parts = token.split('.');
      if (parts.length !== 3) return "无效的 JWT 格式 (必须包含3个部分)";
      
      const header = JSON.parse(decodeURIComponent(escape(atob(parts[0]))));
      const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1]))));
      
      return JSON.stringify({ header, payload }, null, 2);
    } catch (e) {
      return "JWT 解码失败，请检查格式";
    }
  };

  const process = () => {
    if (activeTab === 'base64') setOutput(handleBase64(input, mode === 'encode'));
    if (activeTab === 'url') setOutput(handleUrl(input, mode === 'encode'));
    if (activeTab === 'jwt') setOutput(handleJwt(input));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('base64'); setMode('encode'); setInput(''); setOutput(''); }}
          className={clsx("flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50", activeTab === 'base64' ? "text-primary-600 border-b-2 border-primary-600" : "text-slate-600")}
        >
          <ArrowDownUp className="w-4 h-4" /> Base64
        </button>
        <button
          onClick={() => { setActiveTab('url'); setMode('encode'); setInput(''); setOutput(''); }}
          className={clsx("flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50", activeTab === 'url' ? "text-primary-600 border-b-2 border-primary-600" : "text-slate-600")}
        >
          <LinkIcon className="w-4 h-4" /> URL 编码/解码
        </button>
        <button
          onClick={() => { setActiveTab('jwt'); setMode('decode'); setInput(''); setOutput(''); }}
          className={clsx("flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50", activeTab === 'jwt' ? "text-primary-600 border-b-2 border-primary-600" : "text-slate-600")}
        >
          <Lock className="w-4 h-4" /> JWT 解码
        </button>
      </div>

      <div className="p-6 space-y-4">
        {activeTab !== 'jwt' && (
          <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => { setMode('encode'); process(); }}
              className={clsx("px-4 py-1.5 rounded-md text-sm font-medium transition-all", mode === 'encode' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              编码 (Encode)
            </button>
            <button
              onClick={() => { setMode('decode'); process(); }}
              className={clsx("px-4 py-1.5 rounded-md text-sm font-medium transition-all", mode === 'decode' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              解码 (Decode)
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
          <div className="flex flex-col">
             <label className="text-xs font-semibold text-slate-500 uppercase mb-2">输入</label>
             <textarea
               className="flex-1 w-full p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
               placeholder={activeTab === 'jwt' ? "粘贴 JWT Token..." : "请输入内容..."}
               value={input}
               onChange={(e) => { setInput(e.target.value); }}
             />
          </div>
          <div className="flex flex-col">
             <label className="text-xs font-semibold text-slate-500 uppercase mb-2">输出</label>
             <div className="relative flex-1">
                <textarea
                  readOnly
                  className="w-full h-full p-4 bg-slate-50 border border-slate-300 rounded-lg font-mono text-sm text-slate-700 resize-none outline-none"
                  value={output}
                />
             </div>
          </div>
        </div>

        <button
          onClick={process}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          {activeTab === 'jwt' ? '解析 Token' : (mode === 'encode' ? '执行编码' : '执行解码')}
        </button>
      </div>
    </div>
  );
};

export default EncodingTool;