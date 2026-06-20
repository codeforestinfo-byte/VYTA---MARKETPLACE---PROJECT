export interface Widget {
  id: string;
  title: string;
  infoText?: string;
  size: 'wide' | 'medium' | 'extra-wide' | 'narrow';
  visible: boolean;
}

export interface AWSService {
  name: string;
  category: string;
  description: string;
  iconBg: string;
  iconText: string;
  href: string;
}

export interface RegionConfig {
  id: string;
  name: string;
  code: string;
  monthlyCost: number;
  forecastedCost: number;
  securityScore: number;
  failedControls: string;
  criticalFindings: number;
  highFindings: number;
}

export interface AccountConfig {
  name: string;
  email: string;
  accountId: string;
  role: string;
}
