import React from 'react';
import { HeartPulse, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function HealthWidget() {
  const healthData = [
    {
      label: 'Open issues',
      count: 0,
      period: 'Past 7 days',
      isWarning: false
    },
    {
      label: 'Scheduled changes',
      count: 2,
      period: 'Upcoming and past 7 days',
      isWarning: true
    },
    {
      label: 'Other notifications',
      count: 0,
      period: 'Past 7 days',
      isWarning: false
    }
  ];

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        {healthData.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between border-b border-aws-border pb-3 last:border-0 last:pb-0  group"
          >
            {/* Left label & counts */}
            <div className="space-y-1">
              <div className="text-[11.5px] font-medium text-gray-500 uppercase tracking-tight">
                {item.label}
              </div>
              
              <div className="flex items-center space-x-2">
                <span
                  className={`text-3xl font-bold tracking-tight select-all leading-none ${
                    item.count > 0 && item.isWarning
                      ? 'text-aws-blue-accent cursor-pointer hover:underline'
                      : 'text-aws-heading'
                  }`}
                >
                  {item.count}
                </span>
                
                {/* Visual state dot */}
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.count === 0 ? 'bg-green-500' : 'bg-[#0066cc]'
                  }`}
                  title={item.count === 0 ? 'Fully operational' : `${item.count} notice(s)`}
                ></span>
              </div>
            </div>

            {/* Right metadata period */}
            <div className="text-right text-[11px] text-gray-400 font-medium whitespace-nowrap self-end pb-1">
              {item.period}
            </div>
          </div>
        ))}
      </div>

      {/* Health footer */}
      <div className="border-t border-aws-border pt-3 mt-3 text-center">
        <a
          href="#health-dashboard"
          className="text-aws-blue-accent hover:underline text-[13px] font-semibold inline-flex items-center space-x-1"
        >
          <span>Go to AWS Health Dashboard</span>
        </a>
      </div>
    </div>
  );
}
