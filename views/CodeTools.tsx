import React, { useState, useEffect } from 'react';
import { FileJson, Braces, Terminal, FileDiff, Sparkles, Check, X } from 'lucide-react';
import clsx from 'clsx';
import { checkShellScript, explainRegex } from '../services/geminiService';

// Sub-component: JSON Formatter
const JsonFormatter = () => {
  const [input, setInput] = useState('');
  const [valid, setValid] = useState<boolean | null>(null);

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      setValid(true);
    } catch (e) {
      setValid(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 flex gap-2 items-center"><FileJson className="w-4 h-4" /> JSON 格式化工具</h3>
        <span className={clsx("text-xs font-bold px-2 py-1 rounded", valid === true ? "bg-green-100 text-green-700" : valid === false ? "bg-red-100 text-red-700" : "hidden")}>
          {valid === true ? 'JSON 有效' : 'JSON 无效'}
        </span>
      </div>
      <textarea
        className="flex-1 w-full p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none mb-3"
        placeholder='{"key": "value"}'
        value={input}
        onChange={(e) => { setInput(e.target.value); setValid(null); }}
      />
      <button onClick={format} className="bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition">格式化 & 校验</button>
    </div>
  );
};

// Sub-component: Text Diff (Simple Line Diff)
const TextDiff = () => {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  
  // Basic comparison logic
  const leftLines = left.split('\n');
  const rightLines = right.split('\n');
  const maxLines = Math.max(leftLines.length, rightLines.length);

  return (
    <div className="h-full flex flex-col">
       <h3 className="font-semibold text-slate-700 mb-2 flex gap-2 items-center"><FileDiff className="w-4 h-4" /> 文本对比工具</h3>
       <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden min-h-[400px]">
          <textarea 
            className="p-3 border border-slate-300 rounded-lg font-mono text-xs resize-none" 
            placeholder="原文"
            value={left} 
            onChange={e => setLeft(e.target.value)}
          />
          <textarea 
            className="p-3 border border-slate-300 rounded-lg font-mono text-xs resize-none" 
            placeholder="新文本"
            value={right} 
            onChange={e => setRight(e.target.value)}
          />
       </div>
       <div className="mt-4 p-4 bg-slate-900 rounded-lg h-64 overflow-y-auto font-mono text-xs">
         {Array.from({ length: maxLines }).map((_, i) => {
           const l = leftLines[i] || '';
           const r = rightLines[i] || '';
           const diff = l !== r;
           return (
             <div key={i} className={clsx("flex border-b border-slate-800", diff ? "bg-red-900/30" : "")}>
                <div className={clsx("w-1/2 p-1 border-r border-slate-700 break-all", diff && l ? "text-red-400" : "text-slate-400")}>{l}</div>
                <div className={clsx("w-1/2 p-1 break-all", diff && r ? "text-green-400" : "text-slate-400")}>{r}</div>
             </div>
           )
         })}
       </div>
    </div>
  );
};

// Sub-component: Regex Tester
const RegexTester = () => {
  const [regexStr, setRegexStr] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  const getMatches = () => {
    try {
      if (!regexStr) return [];
      const re = new RegExp(regexStr, flags);
      return Array.from(testString.matchAll(re));
    } catch (e) {
      return null;
    }
  };

  const matches = getMatches();
  
  const handleExplain = async () => {
    setIsExplaining(true);
    const result = await explainRegex(regexStr, testString);
    setExplanation(result);
    setIsExplaining(false);
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between">
          <h3 className="font-semibold text-slate-700 flex gap-2 items-center"><Braces className="w-4 h-4" /> 正则在线测试 (Hyperscan)</h3>
          <button onClick={handleExplain} className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-800">
             <Sparkles className="w-3 h-3" /> AI 解释
          </button>
      </div>
      
      <div className="flex gap-2">
        <span className="flex items-center px-3 bg-slate-100 border border-slate-300 rounded-l-lg text-slate-500 font-mono">/</span>
        <input 
          type="text" 
          value={regexStr} 
          onChange={(e) => setRegexStr(e.target.value)} 
          className="flex-1 p-2 border-y border-slate-300 font-mono text-sm outline-none" 
          placeholder="正则模式 (例如: ^[a-z]+$)"
        />
        <span className="flex items-center px-3 bg-slate-100 border border-slate-300 text-slate-500 font-mono">/</span>
        <input 
          type="text" 
          value={flags} 
          onChange={(e) => setFlags(e.target.value)} 
          className="w-16 p-2 border border-l-0 border-slate-300 rounded-r-lg font-mono text-sm outline-none" 
          placeholder="g"
        />
      </div>

      <textarea 
        className="w-full h-24 p-3 border border-slate-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none"
        placeholder="测试字符串"
        value={testString}
        onChange={(e) => setTestString(e.target.value)}
      />

      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">匹配结果</div>
        {matches === null ? (
          <span className="text-red-500 text-sm">无效的正则表达式</span>
        ) : matches.length === 0 ? (
          <span className="text-slate-400 text-sm italic">无匹配内容</span>
        ) : (
          <div className="space-y-2">
            {matches.map((m, i) => (
              <div key={i} className="bg-white p-2 border border-slate-200 rounded shadow-sm text-sm font-mono break-all">
                <span className="bg-green-100 text-green-800 px-1 rounded mr-2">Match {i + 1}</span>
                {m[0]}
                {m.length > 1 && (
                  <div className="mt-1 ml-4 text-xs text-slate-500">
                    Groups: {Array.from(m).slice(1).map((g, gi) => `[${gi+1}]: ${g}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* AI Explanation Area */}
        {isExplaining && <div className="mt-4 text-sm text-slate-500 flex items-center gap-2"><Loader className="w-3 h-3 animate-spin"/> 正在生成 AI 解释...</div>}
        {explanation && (
            <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs font-semibold text-primary-600 uppercase mb-2">AI 解释</div>
                <div className="prose prose-sm text-slate-700 max-w-none text-sm leading-relaxed">
                   {explanation}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// Sub-component: Shell Check
const ShellCheck = () => {
  const [script, setScript] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if(!script.trim()) return;
    setLoading(true);
    setAnalysis('');
    const result = await checkShellScript(script);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 flex gap-2 items-center"><Terminal className="w-4 h-4" /> Shell 脚本语法检查</h3>
        <button 
          onClick={check} 
          disabled={loading || !script}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
          AI 审计
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[400px]">
        <textarea 
          className="p-4 bg-slate-900 text-slate-300 font-mono text-xs rounded-lg resize-none outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="#!/bin/bash&#10;# 请粘贴 Shell 脚本..."
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />
        <div className="bg-white border border-slate-200 rounded-lg p-4 overflow-y-auto prose prose-sm max-w-none">
          {!analysis && !loading && <div className="text-slate-400 italic text-center mt-10">点击 AI 审计以查看结果</div>}
          {loading && <div className="text-primary-500 text-center mt-10">正在分析脚本结构与安全性...</div>}
          {analysis && <div className="whitespace-pre-wrap">{analysis}</div>}
        </div>
      </div>
    </div>
  );
};

const Loader = ({className}: {className?: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
)

const CodeTools: React.FC<{ defaultTab?: string }> = ({ defaultTab = 'json' }) => {
  const [active, setActive] = useState(defaultTab);

  // Sync active tab when defaultTab prop changes (e.g. from sidebar navigation)
  useEffect(() => {
    setActive(defaultTab);
  }, [defaultTab]);

  const tabs = [
    { id: 'json', label: 'JSON 格式化', icon: FileJson },
    { id: 'regex', label: '正则测试', icon: Braces },
    { id: 'shell', label: 'Shell 检查', icon: Terminal },
    { id: 'diff', label: '文本对比', icon: FileDiff },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={clsx(
              "px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors",
              active === t.id ? "text-primary-600 border-b-2 border-primary-600 bg-slate-50" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 p-6 overflow-hidden">
        {active === 'json' && <JsonFormatter />}
        {active === 'regex' && <RegexTester />}
        {active === 'shell' && <ShellCheck />}
        {active === 'diff' && <TextDiff />}
      </div>
    </div>
  );
};

export default CodeTools;