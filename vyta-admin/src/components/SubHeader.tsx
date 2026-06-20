import { Menu, Info } from 'lucide-react';

interface SubHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function SubHeader({
  isSidebarOpen,
  setIsSidebarOpen
}: SubHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-white border-b border-[#eaeded] px-4 py-3 ">
      {/* Left Title section */}
      <div className="flex items-center space-x-3">
        {/* Toggle Sidebar hamburger menu */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-1.5 hover:bg-gray-100 rounded text-[#414d5c] hover:text-black transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-aws-blue-accent`}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Menu size={18} />
        </button>

        <h1 className="text-xl md:text-2xl font-semibold text-aws-heading tracking-tight flex items-center space-x-2">
          <span>VYTA Console</span>
          <span className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-[#0066cc] text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer transition-colors duration-200" title="Welcome to your home page workspace. Drag cards to align them.">
            Info
          </span>
        </h1>
      </div>
    </div>
  );
}
