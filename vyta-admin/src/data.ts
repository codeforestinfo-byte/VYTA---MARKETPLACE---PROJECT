import { RegionConfig, AccountConfig, AWSService } from './types';

export const REGIONS: RegionConfig[] = [
  {
    id: 'us-east-1',
    name: 'N. Virginia',
    code: 'US East (N. Virginia)',
    monthlyCost: 125.79,
    forecastedCost: 244.06,
    securityScore: 75,
    failedControls: '63/326',
    criticalFindings: 11,
    highFindings: 35
  },
  {
    id: 'us-west-2',
    name: 'Oregon',
    code: 'US West (Oregon)',
    monthlyCost: 94.52,
    forecastedCost: 182.15,
    securityScore: 82,
    failedControls: '41/326',
    criticalFindings: 4,
    highFindings: 18
  },
  {
    id: 'eu-west-1',
    name: 'Ireland',
    code: 'Europe (Ireland)',
    monthlyCost: 210.45,
    forecastedCost: 395.80,
    securityScore: 89,
    failedControls: '21/326',
    criticalFindings: 2,
    highFindings: 9
  },
  {
    id: 'ap-northeast-1',
    name: 'Tokyo',
    code: 'Asia Pacific (Tokyo)',
    monthlyCost: 154.30,
    forecastedCost: 290.00,
    securityScore: 71,
    failedControls: '78/326',
    criticalFindings: 15,
    highFindings: 42
  },
  {
    id: 'ap-southeast-2',
    name: 'Sydney',
    code: 'Asia Pacific (Sydney)',
    monthlyCost: 88.40,
    forecastedCost: 165.50,
    securityScore: 92,
    failedControls: '15/326',
    criticalFindings: 1,
    highFindings: 6
  }
];

export const ACCOUNTS: AccountConfig[] = [
  {
    name: 'nikki.wolf@mycorp.com',
    email: 'nikki.wolf@mycorp.com',
    accountId: '1111-2222-3333',
    role: 'ReadWrite'
  },
  {
    name: 'admin@corp.internal',
    email: 'admin@corp.internal',
    accountId: '9999-8888-7777',
    role: 'Administrator'
  },
  {
    name: 'sandbox-user@mycorp.com',
    email: 'sandbox-user@mycorp.com',
    accountId: '5555-4444-3333',
    role: 'Developer'
  }
];

export const SERVICES: AWSService[] = [
  {
    name: 'DynamoDB',
    category: 'Database',
    description: 'Managed NoSQL Database',
    iconBg: '#3b82f6',
    iconText: 'Dy',
    href: '#dynamodb'
  },
  {
    name: 'EC2',
    category: 'Compute',
    description: 'Virtual Servers in the Cloud',
    iconBg: '#f97316',
    iconText: 'EC',
    href: '#ec2'
  },
  {
    name: 'CloudWatch',
    category: 'Management & Governance',
    description: 'Monitor Resources and Applications',
    iconBg: '#ec4899',
    iconText: 'CW',
    href: '#cloudwatch'
  },
  {
    name: 'CloudFront',
    category: 'Networking & Content Delivery',
    description: 'Global Content Delivery Network',
    iconBg: '#8b5cf6',
    iconText: 'CF',
    href: '#cloudfront'
  },
  {
    name: 'RDS',
    category: 'Database',
    description: 'Managed Relational Database Service',
    iconBg: '#2563eb',
    iconText: 'RD',
    href: '#rds'
  },
  {
    name: 'Billing and Cost Management',
    category: 'AWS Cost Management',
    description: 'Analyze costs and configure billing',
    iconBg: '#10b981',
    iconText: 'Bi',
    href: '#billing'
  },
  {
    name: 'Lambda',
    category: 'Compute',
    description: 'Run Code without Thinking about Servers',
    iconBg: '#ea580c',
    iconText: 'λ',
    href: '#lambda'
  },
  {
    name: 'Route 53',
    category: 'Networking & Content Delivery',
    description: 'Scalable Domain Name System',
    iconBg: '#6366f1',
    iconText: 'R5',
    href: '#route53'
  },
  {
    name: 'S3',
    category: 'Storage',
    description: 'Scalable Storage in the Cloud',
    iconBg: '#10b981',
    iconText: 'S3',
    href: '#s3'
  },
  {
    name: 'Amazon Redshift',
    category: 'Database',
    description: 'Fast, Simple, Cost-Effective Data Warehousing',
    iconBg: '#7c3aed',
    iconText: 'Re',
    href: '#redshift'
  },
  {
    name: 'AWS App Studio',
    category: 'Developer Tools',
    description: 'Build enterprise grade apps with AI',
    iconBg: '#8b5cf6',
    iconText: 'AS',
    href: '#appstudio'
  },
  {
    name: 'Application Composer',
    category: 'Developer Tools',
    description: 'Visually design serverless applications',
    iconBg: '#4f46e5',
    iconText: 'AC',
    href: '#composer'
  },
  // Additional services for search
  {
    name: 'IAM',
    category: 'Security, Identity, & Compliance',
    description: 'Manage User Access and Encryption Keys',
    iconBg: '#ef4444',
    iconText: 'IM',
    href: '#iam'
  },
  {
    name: 'VPC',
    category: 'Networking & Content Delivery',
    description: 'Isolated Cloud Resources',
    iconBg: '#3b82f6',
    iconText: 'VP',
    href: '#vpc'
  },
  {
    name: 'API Gateway',
    category: 'Networking & Content Delivery',
    description: 'Build, Deploy, and Manage APIs',
    iconBg: '#ec4899',
    iconText: 'AG',
    href: '#apigateway'
  },
  {
    name: 'SQS',
    category: 'Application Integration',
    description: 'Managed Message Queues',
    iconBg: '#f59e0b',
    iconText: 'SQ',
    href: '#sqs'
  },
  {
    name: 'SNS',
    category: 'Application Integration',
    description: 'Pub/Sub Messaging and Notifications',
    iconBg: '#eab308',
    iconText: 'SN',
    href: '#sns'
  },
  {
    name: 'Athena',
    category: 'Analytics',
    description: 'Query Data in S3 using SQL',
    iconBg: '#14b8a6',
    iconText: 'At',
    href: '#athena'
  }
];

export const BAR_DATA = [
  { month: 'Apr 24', database: 15, compute: 28, networking: 11, storage: 12, other: 8 },
  { month: 'May 24', database: 16, compute: 26, networking: 12, storage: 13, other: 9 },
  { month: 'Jun 24', database: 17, compute: 29, networking: 11, storage: 12, other: 10 },
  { month: 'Jul 24', database: 48, compute: 112, networking: 34, storage: 21, other: 15 },
  { month: 'Aug 24', database: 46, compute: 110, networking: 36, storage: 22, other: 16 },
  { month: 'Sep 24', database: 24, compute: 48, networking: 18, storage: 15, other: 12 }
];

// Color allocations matching bar chart in image_43136a.jpg (stacked layers)
// From bottom to top, layers correspond to:
// Blue-ish (Compute), Magenta (Database), Teal (Storage), Orange (Networking), Green/Other (Other)
export const BAR_COLORS = {
  compute: '#5c7ee6',   // Base blue/lavender
  database: '#d9381e',  // Dark reddish/magenta-ish
  networking: '#e07f00', // Warning style orange tint
  storage: '#00a1c9',   // Light cyan
  other: '#1d8102'      // Greenish top
};
