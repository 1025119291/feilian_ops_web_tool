import React, { useState } from 'react';
import { Globe, MapPin, Loader2, Search } from 'lucide-react';

interface IpData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  org: string;
  asn: string;
}

const NetworkTool: React.FC = () => {
  const [ip, setIp] = useState('');
  const [data, setData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookupIp = async () => {
    if (!ip) return;
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      if (!response.ok) throw new Error('无法获取 IP 数据');
      const result = await response.json();
      if (result.error) throw new Error(result.reason || '无效的 IP 地址');
      
      setData({
        ip: result.ip,
        city: result.city,
        region: result.region,
        country_name: result.country_name,
        org: result.org,
        asn: result.asn
      });
    } catch (err: any) {
      setError(err.message || '查询发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
           <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
             <Globe className="w-5 h-5 text-primary-500" /> 公网 IP 归属地查询
           </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupIp()}
              className="flex-1 p-3 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="输入公网 IP (例如: 8.8.8.8)"
            />
            <button 
              onClick={lookupIp}
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              查询
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {data && (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              <div className="p-4 flex justify-between items-center bg-slate-50">
                 <span className="text-slate-500 text-sm">IP 地址</span>
                 <span className="font-mono font-medium text-slate-900">{data.ip}</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                 <span className="text-slate-500 text-sm">地理位置</span>
                 <span className="font-medium text-slate-900 flex items-center gap-1">
                   <MapPin className="w-3.5 h-3.5 text-primary-500" />
                   {data.city}, {data.region}, {data.country_name}
                 </span>
              </div>
              <div className="p-4 flex justify-between items-center bg-slate-50">
                 <span className="text-slate-500 text-sm">运营商 / 组织</span>
                 <span className="font-medium text-slate-900">{data.org}</span>
              </div>
               <div className="p-4 flex justify-between items-center">
                 <span className="text-slate-500 text-sm">ASN</span>
                 <span className="font-mono font-medium text-slate-900">{data.asn}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkTool;