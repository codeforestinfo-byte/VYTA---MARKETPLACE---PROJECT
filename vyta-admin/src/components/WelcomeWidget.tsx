import React from 'react';
import { Rocket, Award, Lightbulb, ExternalLink } from 'lucide-react';

export default function WelcomeWidget() {
  const links = [
    {
      title: 'Getting started with AWS',
      url: 'https://aws.amazon.com/getting-started/',
      desc: 'Learn the fundamentals and find valuable information to get the most out of AWS.',
      icon: <Rocket size={20} className="text-[#0066cc]" />
    },
    {
      title: 'Training and certification',
      url: 'https://aws.amazon.com/training/',
      desc: 'Learn from AWS experts and advance your skills and knowledge.',
      icon: <Award size={20} className="text-[#0066cc]" />
    },
    {
      title: "What's new with AWS?",
      url: 'https://aws.amazon.com/new/',
      desc: 'Discover new AWS services, features, and Regions.',
      icon: <Lightbulb size={20} className="text-[#0066cc]" />
    }
  ];

  return (
    <div className="flex flex-col space-y-4 justify-between h-full">
      <div className="space-y-4">
        {links.map((link) => (
          <div key={link.title} className="flex items-start space-x-3.5 group ">
            {/* Visual Icon container with thin borders */}
            <div className="w-10 h-10 rounded-full bg-blue-50/50 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110">
              {link.icon}
            </div>

            {/* Title & Desc */}
            <div className="flex-1 min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 font-semibold text-aws-blue-accent hover:underline text-[13px] leading-snug group-hover:text-blue-700 transition-colors duration-150"
              >
                <span>{link.title}</span>
                <ExternalLink size={12} className="shrink-0 text-gray-400 group-hover:text-aws-blue-accent ml-0.5" />
              </a>
              <p className="text-[12px] text-gray-500 mt-1 leading-normal">
                {link.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Guide label */}
      <div className="border-t border-aws-border pt-3 mt-1.5 text-center text-[11px] text-gray-400">
        Looking for consolidated guides? Switch regions or search above.
      </div>
    </div>
  );
}
