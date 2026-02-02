import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TimeTool from './views/TimeTool';
import EncodingTool from './views/EncodingTool';
import NetworkTool from './views/NetworkTool';
import CodeTools from './views/CodeTools';
import FeilianTool from './views/FeilianTool';
import DidTool from './views/DidTool';
import SslTool from './views/SslTool';
import FileTransferTool from './views/FileTransferTool';
import ByteConverter from './views/ByteConverter';
import { RouteConfig } from './types';
import { 
  Clock, 
  Binary, 
  Globe, 
  Shield, 
  FileJson, 
  Braces, 
  Terminal, 
  FileDiff,
  Calculator,
  ShieldCheck,
  UploadCloud,
  Scale
} from 'lucide-react';

const App: React.FC = () => {
  const routes: RouteConfig[] = [
    { path: '/time', name: 'Unix 时间戳转换', icon: Clock, component: <TimeTool />, category: '常用工具' },
    { path: '/byte', name: '字节单位换算', icon: Scale, component: <ByteConverter />, category: '常用工具' },
    { path: '/encode', name: '编码/解码工具', icon: Binary, component: <EncodingTool />, category: '常用工具' },
    { path: '/ssl', name: 'SSL 证书查看', icon: ShieldCheck, component: <SslTool />, category: '常用工具' },
    { path: '/ip', name: '公网 IP 查询', icon: Globe, component: <NetworkTool />, category: '网络工具' },
    { path: '/transfer', name: '文件临时传输', icon: UploadCloud, component: <FileTransferTool />, category: '网络工具' },
    { path: '/feilian', name: '飞连企业识别码查询', icon: Shield, component: <FeilianTool />, category: '飞连工具' },
    { path: '/did', name: 'DID 生成时间计算', icon: Calculator, component: <DidTool />, category: '飞连工具' },
    // Grouping code tools for cleaner sidebar, but routing individually
    { path: '/json', name: 'JSON 格式化', icon: FileJson, component: <CodeTools defaultTab="json" />, category: '代码工具' },
    { path: '/regex', name: '正则在线测试', icon: Braces, component: <CodeTools defaultTab="regex" />, category: '代码工具' },
    { path: '/shell', name: 'Shell 脚本检查', icon: Terminal, component: <CodeTools defaultTab="shell" />, category: '代码工具' },
    { path: '/diff', name: '文本对比', icon: FileDiff, component: <CodeTools defaultTab="diff" />, category: '代码工具' },
  ];

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar routes={routes} />
        <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">
                {/* Dynamic Header could go here */}
              </h1>
            </header>
            <Routes>
              <Route path="/" element={<Navigate to="/time" replace />} />
              {routes.map((route) => (
                <Route 
                  key={route.path} 
                  path={route.path} 
                  element={
                    <div className="animate-fade-in-up">
                      {route.component}
                    </div>
                  } 
                />
              ))}
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;