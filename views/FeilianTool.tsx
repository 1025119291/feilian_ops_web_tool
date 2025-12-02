
import React, { useState } from 'react';
import { Shield, Search, Server, FileKey, Globe, CheckCircle2, XCircle, Copy, Info } from 'lucide-react';
import { FeilianResponse } from '../types';

interface PortalInfo {
  version: string;
  deployType: string;
  loading: boolean;
  error?: string;
}

const FeilianTool: React.FC = () => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<FeilianResponse | null>(null);
  const [portalInfo, setPortalInfo] = useState<PortalInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPortalInfo = async (domain: string) => {
    setPortalInfo({ version: '', deployType: '', loading: true });
    try {
      // Use the proxy endpoint (defined in api/proxy.js for Vercel, and vite.config.ts for local)
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(domain)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('无法访问门户页面');
      }

      const html = await response.text();
      
      // Regex extraction based on user logic:
      // version=$(echo "$response_portal" | grep -o "VERSION: '[^']*'" | awk -F"'" '{print $2}')
      // DEPLOY_TYPE=$(echo "$response_portal" | grep -o "DEPLOY_TYPE: '[^']*'" | awk -F"'" '{print $2}')
      
      const versionMatch = html.match(/VERSION:\s*'([^']+)'/);
      const deployTypeMatch = html.match(/DEPLOY_TYPE:\s*'([^']+)'/);
      
      const version = versionMatch ? versionMatch[1] : '未检测到';
      const deployTypeRaw = deployTypeMatch ? deployTypeMatch[1] : 'unknown';
      
      let deployType = deployTypeRaw;
      if (deployTypeRaw === '0') deployType = '私有化部署';
      if (deployTypeRaw === '1') deployType = 'SaaS 部署';

      setPortalInfo({
        version,
        deployType,
        loading: false
      });
    } catch (e: any) {
      setPortalInfo({
        version: '获取失败',
        deployType: '获取失败',
        loading: false,
        error: e.message
      });
    }
  };

  const queryCode = async () => {
    if (!code) return;
    setLoading(true);
    setError('');
    setResult(null);
    setPortalInfo(null);

    try {
      // Local dev uses vite proxy, Prod uses vercel rewrite
      const response = await fetch("/feilian-api/match", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error(`请求失败 (HTTP ${response.status})`);
      }

      const data: FeilianResponse = await response.json();
      setResult(data);
      if (data.code !== 0) {
        setError(data.message || '查询返回错误代码');
      } else if (data.data?.domain) {
        // Automatically fetch portal info if domain exists
        fetchPortalInfo(data.data.domain);
      }
    } catch (err: any) {
      setError(err.message || '网络请求失败，请检查网络连接或跨域设置。');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" /> 飞连企业识别码查询
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            输入企业识别码获取门户域名及证书配置信息。
          </p>
        </div>

        <div className="p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && queryCode()}
                placeholder="请输入企业识别码 (例如: feilian1)"
                className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
              />
            </div>
            <button
              onClick={queryCode}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2 transition-colors shadow-sm"
            >
              {loading ? '查询中...' : '立即查询'}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <XCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {result && result.data && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-500" />
              查询结果
            </h3>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
              Code: {code}
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <InfoItem label="名称" value={result.data.name} />
            <InfoItem label="中文名" value={result.data.zh_name} />
            <InfoItem label="英文名" value={result.data.en_name} />
            
            {/* Added Portal Info Section */}
            <div className="flex flex-col border-b border-slate-100 pb-2 md:border-b-0 md:pb-0">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">服务端版本</label>
              <div className="text-slate-900 font-medium break-words flex items-center gap-2">
                {portalInfo?.loading ? (
                  <span className="text-slate-400 text-xs animate-pulse">解析中...</span>
                ) : (
                  <span>{portalInfo?.version || '-'}</span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col border-b border-slate-100 pb-2 md:border-b-0 md:pb-0">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">部署类型</label>
               <div className="text-slate-900 font-medium break-words">
                  {portalInfo?.loading ? (
                    <span className="text-slate-400 text-xs animate-pulse">解析中...</span>
                  ) : (
                    <span className={portalInfo?.deployType?.includes('SaaS') ? 'text-blue-600' : 'text-slate-700'}>
                      {portalInfo?.deployType || '-'}
                    </span>
                  )}
               </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <div className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-blue-800 uppercase tracking-wider">门户域名</label>
                    <button 
                      onClick={() => copyToClipboard(result.data?.domain || '')}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> 复制
                    </button>
                  </div>
                  <a 
                    href={result.data.domain} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-lg font-medium text-blue-700 hover:text-blue-900 hover:underline break-all"
                  >
                    {result.data.domain}
                  </a>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
               <StatusCard 
                 label="自签证书" 
                 active={result.data.enable_self_signed} 
                 activeText="已启用" 
                 inactiveText="未启用" 
               />
               <StatusCard 
                 label="软件分发公钥" 
                 active={result.data.enable_public_key} 
                 activeText="已启用" 
                 inactiveText="未启用" 
               />
               <StatusCard 
                 label="SPA 端口" 
                 active={result.data.enable_spa} 
                 activeText={result.data.spa_port || '开启'} 
                 inactiveText="未启用" 
               />
            </div>

            {result.data.enable_self_signed && result.data.self_signed_cert && (
              <div className="col-span-1 md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <FileKey className="w-3 h-3" /> 自签证书内容
                  </label>
                  <button 
                    onClick={() => copyToClipboard(result.data?.self_signed_cert || '')}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> 复制
                  </button>
                </div>
                <div className="relative group">
                  <pre className="p-4 bg-slate-900 text-slate-300 rounded-lg text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all leading-relaxed shadow-inner">
                    {result.data.self_signed_cert}
                  </pre>
                </div>
              </div>
            )}

            {result.data.enable_public_key && result.data.public_key && (
              <div className="col-span-1 md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <FileKey className="w-3 h-3" /> 公钥内容
                  </label>
                   <button 
                    onClick={() => copyToClipboard(result.data?.public_key || '')}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> 复制
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-300 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed shadow-inner">
                  {result.data.public_key}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="flex flex-col border-b border-slate-100 pb-2 md:border-b-0 md:pb-0">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
    <div className="text-slate-900 font-medium break-words">{value || '-'}</div>
  </div>
);

const StatusCard: React.FC<{ label: string; active: boolean; activeText: string; inactiveText: string }> = ({ label, active, activeText, inactiveText }) => (
  <div className={`p-3 rounded-lg border ${active ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'} flex items-center justify-between`}>
    <span className="text-xs font-semibold text-slate-500">{label}</span>
    <div className={`flex items-center gap-1.5 text-sm font-medium ${active ? 'text-green-700' : 'text-slate-500'}`}>
      {active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {active ? activeText : inactiveText}
    </div>
  </div>
);

export default FeilianTool;
