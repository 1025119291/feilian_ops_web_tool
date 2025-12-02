import React, { useState, useRef } from 'react';
import { ShieldCheck, Upload, FileText, AlertCircle, CheckCircle, XCircle, Info, Hash, Globe } from 'lucide-react';
import { X509, KJUR } from 'jsrsasign';

interface CertInfo {
  subject: string;
  primaryDomain: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  serial: string;
  fingerprintSha1: string;
  fingerprintSha256: string;
  sans: string[];
  dnsNames: string[];
  ipAddresses: string[];
  isValid: boolean;
  isExpired: boolean;
  daysRemaining: number;
}

const SslTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCert = (pem: string) => {
    try {
      setError('');
      setCertInfo(null);

      // Basic cleanup: ensure headers exist if they look like base64
      let cleanPem = pem.trim();
      if (!cleanPem.includes('-----BEGIN CERTIFICATE-----')) {
         // If user pasted just the body, try to wrap it
         cleanPem = `-----BEGIN CERTIFICATE-----\n${cleanPem}\n-----END CERTIFICATE-----`;
      }

      const x = new X509();
      x.readCertPEM(cleanPem);

      // Validity
      const notBeforeStr = x.getNotBefore();
      const notAfterStr = x.getNotAfter();
      
      // jsrsasign returns "YYMMDDHHMMSSZ" or "YYYYMMDDHHMMSSZ"
      const parseDate = (s: string) => {
        let year = parseInt(s.substring(0, 2));
        let offset = 2;
        if (s.length > 13) { // GeneralizedTime YYYY...
            year = parseInt(s.substring(0, 4));
            offset = 4;
        } else {
            year += (year < 50 ? 2000 : 1900);
        }
        const month = parseInt(s.substring(offset, offset + 2)) - 1;
        const day = parseInt(s.substring(offset + 2, offset + 4));
        const hour = parseInt(s.substring(offset + 4, offset + 6));
        const min = parseInt(s.substring(offset + 6, offset + 8));
        const sec = parseInt(s.substring(offset + 8, offset + 10));
        return new Date(Date.UTC(year, month, day, hour, min, sec));
      };

      const validFrom = parseDate(notBeforeStr);
      const validTo = parseDate(notAfterStr);
      const now = new Date();
      const isExpired = now > validTo;
      const daysRemaining = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Hex for fingerprints
      const hex = x.hex;
      const sha1 = KJUR.crypto.Util.hashHex(hex, 'sha1').match(/.{1,2}/g)?.join(':').toUpperCase() || '';
      const sha256 = KJUR.crypto.Util.hashHex(hex, 'sha256').match(/.{1,2}/g)?.join(':').toUpperCase() || '';

      // SANs & DNS Names
      const sansArrays = x.getExtSubjectAltName2();
      const sans = sansArrays ? sansArrays.map(arr => `${arr[0]}:${arr[1]}`) : [];
      const dnsNames = sansArrays 
        ? sansArrays.filter(arr => arr[0] === 'DNS').map(arr => arr[1]) 
        : [];
      const ipAddresses = sansArrays
        ? sansArrays.filter(arr => arr[0] === 'IP').map(arr => arr[1])
        : [];

      // Subject & Common Name
      const subjectString = x.getSubjectString();
      // Try to match CN=... inside the subject string (jsrsasign often returns /C=XX/O=YY/CN=ZZ)
      const cnMatch = subjectString.match(/(?:^|\/)CN=([^/]+)/);
      const cn = cnMatch ? cnMatch[1] : null;

      // Determine Primary Domain: Priority DNS > IP > CN
      const primaryDomain = dnsNames.length > 0 
        ? dnsNames[0] 
        : (ipAddresses.length > 0 ? ipAddresses[0] : (cn || '-'));

      setCertInfo({
        subject: subjectString,
        primaryDomain,
        issuer: x.getIssuerString(),
        notBefore: validFrom.toLocaleString('zh-CN'),
        notAfter: validTo.toLocaleString('zh-CN'),
        serial: x.getSerialNumberHex().match(/.{1,2}/g)?.join(':').toUpperCase() || '',
        fingerprintSha1: sha1,
        fingerprintSha256: sha256,
        sans,
        dnsNames,
        ipAddresses,
        isValid: !isExpired,
        isExpired,
        daysRemaining
      });

    } catch (e: any) {
      console.error(e);
      setError('无法解析证书。请确保内容是有效的 PEM 格式 X.509 证书。');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
      parseCert(content);
    };
    reader.readAsText(file);
  };

  const formatDN = (dn: string) => {
    // Basic DN formatting: /CN=example.com/O=Org -> CN=example.com, O=Org
    if (!dn) return '-';
    // Remove leading slash if present
    const clean = dn.startsWith('/') ? dn.substring(1) : dn;
    return clean.split('/').join('\n');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" /> SSL 证书查看器
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            解析 X.509 证书内容 (PEM 格式)，查看有效期、颁发者及域名信息。
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
               <label className="text-xs font-semibold text-slate-500 uppercase">证书内容 (PEM)</label>
               <div className="flex gap-2">
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept=".pem,.crt,.cer,.txt" 
                   onChange={handleFileChange}
                 />
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded bg-primary-50 hover:bg-primary-100 transition-colors"
                 >
                   <Upload className="w-3 h-3" /> 上传文件
                 </button>
                 <button 
                   onClick={() => parseCert(input)}
                   className="text-xs flex items-center gap-1 text-white bg-teal-600 hover:bg-teal-700 font-medium px-3 py-1 rounded transition-colors"
                 >
                   <FileText className="w-3 h-3" /> 解析内容
                 </button>
               </div>
            </div>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-48 p-4 bg-slate-900 text-slate-300 font-mono text-xs rounded-lg resize-y outline-none border border-slate-700 focus:border-teal-500"
              placeholder="-----BEGIN CERTIFICATE-----&#10;..."
            />
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-sm animate-in fade-in">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {certInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
           {/* Status Header */}
           <div className={`px-6 py-4 border-b flex justify-between items-center ${certInfo.isValid ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
              <div className="flex items-center gap-3">
                 {certInfo.isValid ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                 <div>
                    <h3 className={`font-bold ${certInfo.isValid ? 'text-green-800' : 'text-red-800'}`}>
                      {certInfo.isValid ? '证书有效' : '证书已过期'}
                    </h3>
                    <p className={`text-xs ${certInfo.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {certInfo.isExpired 
                        ? `已过期 ${Math.abs(certInfo.daysRemaining)} 天` 
                        : `剩余有效期 ${certInfo.daysRemaining} 天`}
                    </p>
                 </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>生效时间: {certInfo.notBefore}</div>
                <div>过期时间: {certInfo.notAfter}</div>
              </div>
           </div>

           <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Domain Information */}
              <div className="col-span-1 md:col-span-2 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
                   <Globe className="w-4 h-4" /> 绑定域名信息
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block mb-1">主域名 (Primary Domain)</span>
                      <div className="font-mono text-lg font-medium text-slate-800 break-all">{certInfo.primaryDomain}</div>
                      <p className="text-[10px] text-slate-400 mt-1">
                         *优先显示 SANs (DNS/IP)，若无则显示 CN
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block mb-1">备用域名/IP (SANs)</span>
                      <div className="flex flex-wrap gap-2">
                        {[...certInfo.dnsNames, ...certInfo.ipAddresses].length > 0 ? (
                          [...certInfo.dnsNames, ...certInfo.ipAddresses].map((item, i) => (
                            <span key={i} className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs font-mono text-slate-600 shadow-sm">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">无备用域名</span>
                        )}
                      </div>
                    </div>
                 </div>
              </div>

              {/* Subject & Issuer */}
              <div className="space-y-6">
                 <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                     <Info className="w-3 h-3" /> 主题 (Subject)
                   </h4>
                   <pre className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                     {formatDN(certInfo.subject)}
                   </pre>
                 </div>
                 <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                     <ShieldCheck className="w-3 h-3" /> 颁发者 (Issuer)
                   </h4>
                   <pre className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                     {formatDN(certInfo.issuer)}
                   </pre>
                 </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-6">
                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">序列号 (Serial Number)</h4>
                    <div className="font-mono text-xs text-slate-600 break-all bg-slate-50 p-2 rounded border border-slate-100">
                      {certInfo.serial}
                    </div>
                 </div>

                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">指纹 (Fingerprints)</h4>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400">SHA-256</span>
                        <div className="font-mono text-[10px] text-slate-600 break-all bg-slate-50 p-2 rounded border border-slate-100">
                          {certInfo.fingerprintSha256}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400">SHA-1</span>
                        <div className="font-mono text-[10px] text-slate-600 break-all bg-slate-50 p-2 rounded border border-slate-100">
                          {certInfo.fingerprintSha1}
                        </div>
                      </div>
                    </div>
                 </div>
                 
                 <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                     <Hash className="w-3 h-3" /> 原始 SANs 数据
                   </h4>
                   <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-700 max-h-32 overflow-y-auto">
                      {certInfo.sans.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {certInfo.sans.map((san, i) => (
                            <li key={i} className="font-mono text-xs break-all">{san}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic">无 SAN 信息</span>
                      )}
                   </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SslTool;