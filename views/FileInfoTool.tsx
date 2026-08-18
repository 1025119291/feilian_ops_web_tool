import React, { useState, useRef } from 'react';
import { File, X, AlertCircle, Loader2, FileSearch } from 'lucide-react';

type FileMetadata = {
  md5: string;
  sha1: string;
  sha256: string;
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

const FileInfoTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = () => {
    setFile(null);
    setMetadata(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setMetadata(null);
    setMetadataLoading(true);
    setError('');

    try {
      const buffer = await selectedFile.arrayBuffer();
      const [sha1Buffer, sha256Buffer] = await Promise.all([
        crypto.subtle.digest('SHA-1', buffer.slice(0)),
        crypto.subtle.digest('SHA-256', buffer.slice(0)),
      ]);
      setMetadata({
        md5: md5ArrayBuffer(buffer),
        sha1: toHex(sha1Buffer),
        sha256: toHex(sha256Buffer),
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-indigo-600" /> 文件信息查看
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            在浏览器本地读取文件信息，查看文件大小、MIME 类型、MD5、SHA1 和 SHA256 指纹。
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
                      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
                        <span className="font-semibold text-slate-500">SHA256</span>
                        <span className="min-w-0 break-all font-mono text-slate-700">{metadata.sha256}</span>
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
                   <FileSearch className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">点击或拖拽文件到此处</p>
                <p className="text-xs text-slate-400 mt-1">文件不会上传，指纹计算在本地完成</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">文件读取遇到问题</p>
                <p className="text-red-600/80 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileInfoTool;
