import { LucideIcon } from 'lucide-react';
import React from 'react';

export interface RouteConfig {
  path: string;
  name: string;
  icon: LucideIcon;
  component: React.ReactNode;
  category: '常用工具' | '网络工具' | '代码工具' | '飞连工具';
}

export interface FeilianResponse {
  code: number;
  message: string;
  data?: {
    name: string;
    zh_name: string;
    en_name: string;
    domain: string;
    enable_self_signed: boolean;
    self_signed_cert: string;
    enable_public_key: boolean;
    public_key: string;
    enable_spa: boolean;
    spa_port: string;
    enable_backup_domain: boolean;
    backup_domain: string;
  }
}

// Hyperscan is C++ based, we will simulate or use Gemini for complex analysis, 
// but for standard regex testing we use JS RegExp with a disclaimer.
export interface RegexResult {
  match: boolean;
  groups: string[];
  index: number;
}