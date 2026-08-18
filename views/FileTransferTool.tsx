import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Copy, Terminal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type FileMetadata = {
  md5: string;
  sha1: string;
  mime: string;
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const leftRotate = (value: number, shift: number) => ((value << shift) | (value >>> (32 - shift))) >>> 0;

const add32 = (...values: number[]) => values.reduce((sum, value) => (sum + value) >>> 0, 0);

const wordToHex = (word: number) => {
  let hex = '';
  for (let i = 0; i < 4; i++) {
    hex += ((word >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
  }
  return hex;
};

const md5ArrayBuffer = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const originalBitLength = bytes.length * 8;
  const paddedLength = (((bytes.length + 8) >>> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, originalBitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(originalBitLength / 0x100000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const constants = Array.from({ length: 64 }, (_, index) =>
    Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0
  );

  for (let offset = 0; offset < paddedLength; offset += 64) {
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    const words = Array.from({ length: 16 }, (_, index) => view.getUint32(offset + index * 4, true));

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      b = add32(b, leftRotate(add32(a, f, constants[i], words[g]), shifts[i]));
      a = temp;
    }

    a0 = add32(a0, a);
    b0 = add32(b0, b);
    c0 = add32(c0, c);
    d0 = add32(d0, d);
  }

  return [a0, b0, c0, d0].map(wordToHex).join('');
};

const FileTransferTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = () => {
    setFile(null);
    setMetadata(null);
    setDownloadUrl('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setMetadata(null);
    setMetadataLoading(true);
    setDownloadUrl('');
    setError('');

    try {
      const buffer = await selectedFile.arrayBuffer();
      const sha1Buffer = await crypto.subtle.digest('SHA-1', buffer.slice(0));
      setMetadata({
        md5: md5ArrayBuffer(buffer),
        sha1: toHex(sha1Buffer),
        mime: selectedFile.type || '未知',
      });
    } catch (err: any) {
      console.error(err);
      setError(`文件信息读取失败: ${err.message}`);
    } finally {
      setMetadataLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      selectFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setDownloadUrl('');

    try {
      // Use the internal proxy to bypass CORS
      const targetUrl = `https://transfer.sh/${file.name}`;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'PUT',
        body: file, // Send file blob directly
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const url = await response.text();
      setDownloadUrl(url.trim());
    } catch (err: any) {
      console.error(err);
      setError(`上传失败: ${err.message}`);
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
              <div className="flex w-full max-w-2xl flex-col items-center gap-3 animate-in fade-in zoom-in">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <File className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <div className="w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-left text-xs shadow-sm">
                  {metadataLoading ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> 正在计算文件指纹...
                    </div>
                  ) : metadata ? (
                    <div className="grid gap-2">
                      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
                        <span className="font-semibold text-slate-500">MIME</span>
                        <span className="min-w-0 break-all font-mono text-slate-700">{metadata.mime}</span>
                      </div>
                      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
                        <span className="font-semibold text-slate-500">MD5</span>
                        <span className="min-w-0 break-all font-mono text-slate-700">{metadata.md5}</span>
                      </div>
                      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
                        <span className="font-semibold text-slate-500">SHA1</span>
                        <span className="min-w-0 break-all font-mono text-slate-700">{metadata.sha1}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="py-3 text-center text-slate-400">暂无文件指纹信息</p>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
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
