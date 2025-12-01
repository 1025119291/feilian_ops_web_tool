import React from 'react';
import { NavLink } from 'react-router-dom';
import { RouteConfig } from '../types';
import { Box, Layers, Globe, Shield, Terminal, Settings } from 'lucide-react';

interface SidebarProps {
  routes: RouteConfig[];
}

const Sidebar: React.FC<SidebarProps> = ({ routes }) => {
  const categories = Array.from(new Set(routes.map(r => r.category)));

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 overflow-y-auto border-r border-slate-800 flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-primary-600 p-2 rounded-lg">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight">飞连运维工具</h1>
          <p className="text-xs text-slate-500">Operation Toolkit</p>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-8">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              {category}
            </h3>
            <div className="space-y-1">
              {routes.filter(r => r.category === category).map(route => (
                <NavLink
                  key={route.path}
                  to={route.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-600/10 text-primary-400'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`
                  }
                >
                  <route.icon className="w-4 h-4" />
                  {route.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
           <Settings className="w-3 h-3" />
           <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;