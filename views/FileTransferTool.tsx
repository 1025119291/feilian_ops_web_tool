import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Copy, Terminal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const FileTransferTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDownloadUrl('');
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setDownloadUrl('');
      setError('');
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setDownloadUrl('');

    try {
      // transfer.sh supports PUT requests
      // Note: This may fail if CORS is not enabled on the transfer.sh instance or blocked by browser.
      // Ideally, a proxy is safer, but transfer.sh often allows direct usage.
      const response = await fetch(`https://transfer.sh/${file.name}`, {
        method: 'PUT',
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const url = await response.text();
      setDownloadUrl(url.trim());
    } catch (err: any) {
      console.error(err);
      setError('上传失败。可能是由于跨域限制(CORS)或网络问题。建议尝试使用下方的 CLI 命令上传。');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getCurlCommand = () => {
    const filename = file ? file.name : 'filename';
    return `curl --upload-file ./${filename} https://transfer.sh/${filename}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" /> 临时文件传输 (Transfer.sh)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            上传文件生成临时下载链接 (有效期通常为 14 天)。支持网页上传或命令行操作。
          </p>
        </div>

        <div className="p-6">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer
              ${file ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
            `}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            
            {file ? (
              <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <File className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); setDownloadUrl(''); }}
                  className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> 移除文件
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto mb-3">
                   <UploadCloud className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">点击或拖拽文件到此处</p>
                <p className="text-xs text-slate-400 mt-1">支持任意类型文件</p>
              </div>
            )}
          </div>

          {/* Action Button */}
          {file && !downloadUrl && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={uploadFile}
                disabled={uploading}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-70 flex items-center gap-2 shadow-sm transition-all"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> 上传中...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> 开始上传
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">上传遇到问题</p>
                <p className="text-red-600/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success / Result */}
          {downloadUrl && (
            <div className="mt-6 p-5 bg-green-50 border border-green-100 rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">上传成功</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                   <label className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1 block">下载链接</label>
                   <div className="flex gap-2">
                      <input 
                        readOnly 
                        value={downloadUrl} 
                        className="flex-1 text-sm p-2 rounded border border-green-200 text-green-800 bg-white outline-none"
                      />
                      <button 
                        onClick={() => copyToClipboard(downloadUrl)}
                        className="px-3 py-2 bg-white border border-green-200 rounded text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                <div className="flex justify-end">
                   <a 
                     href={downloadUrl} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                   >
                     打开链接 <div className="w-1 h-1 bg-current rounded-full mx-0.5"></div> 在新窗口预览
                   </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CLI Usage Guide */}
      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden text-slate-300">
         <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Terminal className="w-4 h-4 text-slate-400" /> Linux / macOS 命令行上传
            </h3>
         </div>
         <div className="p-6">
            <p className="text-sm text-slate-400 mb-3">
              如果您无法使用网页上传，或需要传输大文件，可以直接在终端使用 curl 命令：
            </p>
            <div className="relative group">
               <pre className="bg-slate-950 p-4 rounded-lg font-mono text-sm overflow-x-auto text-green-400 border border-slate-800">
                 {getCurlCommand()}
               </pre>
               <button 
                 onClick={() => copyToClipboard(getCurlCommand())}
                 className="absolute right-2 top-2 p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
               >
                 <Copy className="w-4 h-4" />
               </button>
            </div>
            <div className="mt-4 text-xs text-slate-500 space-y-1">
               <p>• 默认保留时间：14 天</p>
               <p>• 最大文件大小：无严格限制 (取决于服务端配置)</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default FileTransferTool;
