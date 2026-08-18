import React, { useEffect, useState } from 'react';
import { Copy, KeyRound, Clock3, Hash, RefreshCw, XCircle } from 'lucide-react';

type UninstallMode = 'company' | 'subject';
type UninstallTimeMode = 'now' | 'custom';

interface UninstallCodeResult {
  code: string;
  plainText: string;
  timeText: string;
  bucket: number;
  utcTime: string;
  validFromMs: number;
  validUntilMs: number;
  validFromText: string;
  validUntilText: string;
}

const pad2 = (value: number) => value.toString().padStart(2, '0');

const formatUtcInputValue = (date: Date) => {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
};

const parseUtcInputValue = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (Number.isNaN(date.getTime())) return null;

  return date;
};

const getBucket = (date: Date) => Math.floor(date.getUTCMinutes() / 15) + 1;

const formatBucketTime = (date: Date) => {
  const bucket = getBucket(date);
  const timeText = `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())},${pad2(date.getUTCHours())}:${bucket}`;

  return { bucket, timeText };
};

const getBucketWindow = (date: Date) => {
  const bucketStartMinute = Math.floor(date.getUTCMinutes() / 15) * 15;
  const validFrom = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    bucketStartMinute,
    0,
    0
  ));
  const validUntil = new Date(validFrom.getTime() + 15 * 60 * 1000);

  return { validFrom, validUntil };
};

const formatUtcDisplay = (date: Date) => `${formatUtcInputValue(date).replace('T', ' ')} UTC`;

const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${pad2(minutes)}:${pad2(seconds)}`;
};

const sha256Hex = async (text: string) => {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const UninstallCodeTool: React.FC = () => {
  const [companyId, setCompanyId] = useState('');
  const [mode, setMode] = useState<UninstallMode>('company');
  const [subjectId, setSubjectId] = useState('');
  const [timeMode, setTimeMode] = useState<UninstallTimeMode>('now');
  const [utcInput, setUtcInput] = useState(formatUtcInputValue(new Date()));
  const [result, setResult] = useState<UninstallCodeResult | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const calculateCode = async () => {
    const normalizedCompanyId = companyId.trim().toLowerCase();
    const normalizedSubjectId = subjectId.trim();

    setError('');
    setResult(null);

    if (!normalizedCompanyId) {
      setError('请输入企业识别码。');
      return;
    }

    if (mode === 'subject' && !normalizedSubjectId) {
      setError('请输入用户 ID 或设备 DID。');
      return;
    }

    const targetDate = timeMode === 'now' ? new Date() : parseUtcInputValue(utcInput);
    if (!targetDate) {
      setError('请输入有效的 UTC 时间。');
      return;
    }

    if (!crypto?.subtle) {
      setError('当前浏览器环境不支持 Web Crypto SHA-256，请使用 HTTPS 或 localhost 访问。');
      return;
    }

    setLoading(true);

    try {
      const { bucket, timeText } = formatBucketTime(targetDate);
      const { validFrom, validUntil } = getBucketWindow(targetDate);
      const plainText = mode === 'subject'
        ? `feilian|${normalizedCompanyId}|${normalizedSubjectId}|${timeText}`
        : `feilian|${normalizedCompanyId}|${timeText}`;
      const hash = await sha256Hex(plainText);

      setResult({
        code: hash.slice(0, 8),
        plainText,
        timeText,
        bucket,
        utcTime: formatUtcDisplay(targetDate),
        validFromMs: validFrom.getTime(),
        validUntilMs: validUntil.getTime(),
        validFromText: formatUtcDisplay(validFrom),
        validUntilText: formatUtcDisplay(validUntil)
      });
    } catch (err: any) {
      setError(err.message || '卸载码计算失败。');
    } finally {
      setLoading(false);
    }
  };

  const refreshUtcInput = () => {
    setUtcInput(formatUtcInputValue(new Date()));
  };

  const getValidityState = (targetResult: UninstallCodeResult) => {
    if (nowMs < targetResult.validFromMs) {
      return {
        label: '距离生效',
        value: formatDuration(targetResult.validFromMs - nowMs),
        className: 'bg-amber-50 border-amber-200 text-amber-800'
      };
    }

    if (nowMs >= targetResult.validUntilMs) {
      return {
        label: '状态',
        value: '已过期',
        className: 'bg-red-50 border-red-200 text-red-700'
      };
    }

    return {
      label: '有效期倒计时',
      value: formatDuration(targetResult.validUntilMs - nowMs),
      className: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" /> 飞连卸载码计算
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            基于企业识别码、UTC 15 分钟时间分桶和 SHA-256 截断值生成卸载码。
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">企业识别码</label>
              <input
                type="text"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && calculateCode()}
                placeholder="例如: eps-deliver"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">计算维度</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode('company')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'company' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  企业维度
                </button>
                <button
                  type="button"
                  onClick={() => setMode('subject')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'subject' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  用户/DID
                </button>
              </div>
            </div>

            {mode === 'subject' && (
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">用户 ID 或设备 DID</label>
                <input
                  type="text"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && calculateCode()}
                  placeholder="例如: ou_xxxx 或设备 DID"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">时间来源</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTimeMode('now')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${timeMode === 'now' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  当前 UTC
                </button>
                <button
                  type="button"
                  onClick={() => setTimeMode('custom')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${timeMode === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  自定义 UTC
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">UTC 时间</label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={utcInput}
                  onChange={(e) => setUtcInput(e.target.value)}
                  disabled={timeMode === 'now'}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono disabled:bg-slate-100 disabled:text-slate-400"
                />
                <button
                  type="button"
                  onClick={refreshUtcInput}
                  className="px-3 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  title="刷新为当前 UTC 时间"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={calculateCode}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-70 flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Hash className="w-4 h-4" />
            {loading ? '计算中...' : '计算卸载码'}
          </button>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center gap-3">
              <XCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="border border-emerald-100 bg-emerald-50/50 rounded-lg overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">卸载码</div>
                  <div className="font-mono text-3xl font-semibold text-emerald-700 tracking-wide">{result.code}</div>
                </div>
                <div className={`px-4 py-3 rounded-lg border text-center ${getValidityState(result).className}`}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1">{getValidityState(result).label}</div>
                  <div className="font-mono text-2xl font-semibold leading-none">{getValidityState(result).value}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(result.code)}
                  className="px-4 py-2 bg-white border border-emerald-200 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" /> 复制卸载码
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-5 pb-5">
                <UninstallMeta icon={<Clock3 className="w-4 h-4" />} label="UTC 时间" value={result.utcTime} />
                <UninstallMeta icon={<Clock3 className="w-4 h-4" />} label="时间分桶" value={`第 ${result.bucket} 桶`} />
                <UninstallMeta icon={<Hash className="w-4 h-4" />} label="时间串" value={result.timeText} />
                <UninstallMeta icon={<Clock3 className="w-4 h-4" />} label="生效时间" value={result.validFromText} />
                <UninstallMeta icon={<Clock3 className="w-4 h-4" />} label="过期时间" value={result.validUntilText} />
              </div>
              <div className="px-5 pb-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">参与哈希的明文</label>
                  <button
                    onClick={() => copyToClipboard(result.plainText)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> 复制
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-300 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed shadow-inner">
                  {result.plainText}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UninstallMeta: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="p-3 bg-white border border-emerald-100 rounded-lg">
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
      {icon}
      {label}
    </div>
    <div className="text-sm font-mono text-slate-800 break-all">{value}</div>
  </div>
);

export default UninstallCodeTool;
