import { useState, useEffect, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SubHeader from '../components/SubHeader';
import WidgetCard from '../components/WidgetCard';
import RecentlyVisitedWidget from '../components/RecentlyVisitedWidget';
import SecurityWidget from '../components/SecurityWidget';
import WelcomeWidget from '../components/WelcomeWidget';
import CostUsageWidget from '../components/CostUsageWidget';
import HealthWidget from '../components/HealthWidget';
import AddWidgetsDrawer from '../components/AddWidgetsDrawer';
import AWSExploreDropdown from '../components/AWSExploreDropdown';
import { REGIONS, ACCOUNTS } from '../data';
import type { Widget, RegionConfig, AccountConfig } from '../types';
import { 
  Layers, 
  Star, 
  HelpCircle, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft,
  X,
  Sparkles,
  Award,
  Bell,
  Settings,
  Info,
  Store,
  Users,
  Package,
  Wallet,
  Calendar
} from 'lucide-react';

const INITIAL_WIDGETS: Widget[] = [
  { id: 'recents', title: 'Marketplace Overview', infoText: 'Key metrics and quick links across your marketplace platform', size: 'wide', visible: true },
  { id: 'security', title: 'Security', infoText: 'Overall security posture and failed compliance ratings', size: 'medium', visible: true },
  { id: 'welcome', title: 'Welcome to AWS', size: 'medium', visible: true },
  { id: 'cost', title: 'Cost and usage', infoText: 'Consolidated month billing costs and predictive forecast indexes', size: 'extra-wide', visible: true },
  { id: 'health', title: 'AWS Health', infoText: 'Realtime active cloud services monitoring', size: 'medium', visible: true }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState<Widget[]>(INITIAL_WIDGETS);
  
  const [activeRegion, setActiveRegion] = useState<RegionConfig>(REGIONS[0]);
  const [activeAccount, setActiveAccount] = useState<AccountConfig>(ACCOUNTS[0]);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<{ id: string; msg: string; type?: 'info' | 'success' }[]>([]);

  const addToast = (msg: string, type: 'info' | 'success' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  useEffect(() => {
    addToast(`Switched active data plane to Region: ${activeRegion.name} (${activeRegion.id})`, 'success');
  }, [activeRegion]);

  useEffect(() => {
    addToast(`Authenticated as Role: ${activeAccount.role} for target account: ${activeAccount.accountId}`, 'info');
  }, [activeAccount]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      const fromIndex = widgets.findIndex(w => w.id === draggedId);
      const toIndex = widgets.findIndex(w => w.id === targetId);
      
      const reordered = [...widgets];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      
      setWidgets(reordered);
      addToast(`Rearranged layout coordinates: Moved "${moved.title}" grid index.`, 'success');
    }
    handleDragEnd();
  };

  const moveWidget = (id: string, direction: 'left' | 'right') => {
    const index = widgets.findIndex(w => w.id === id);
    if (index === -1) return;

    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= widgets.length) return;

    const reordered = [...widgets];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    setWidgets(reordered);
    addToast(`Shifted "${moved.title}" ${direction === 'left' ? 'upstream' : 'downstream'}`, 'info');
  };

  const handleRemoveWidget = (id: string) => {
    const widget = widgets.find(w => w.id === id);
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, visible: false } : w)
    );
    addToast(`Collapsed "${widget?.title}" widget. Add it back anytime from Customize panel.`, 'info');
  };

  const handleResizeWidget = (id: string, newSize: 'narrow' | 'medium' | 'wide' | 'extra-wide') => {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, size: newSize } : w)
    );
    const widget = widgets.find(w => w.id === id);
    addToast(`Resized "${widget?.title}" dimensions to: ${newSize.toUpperCase()}`, 'info');
  };

  const handleToggleWidgetVisibility = (id: string) => {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    );
  };

  const handleResetWorkspace = () => {
    setWidgets(INITIAL_WIDGETS.map(w => ({ ...w })));
    addToast('Restored default widget layout configuration.', 'success');
  };

  const sidebarManagement = [
    { name: 'Vendors', href: '/vendors', letter: 'V' },
    { name: 'Customers', href: '/customers', letter: 'C' },
    { name: 'Products', href: '/products', letter: 'P' },
    { name: 'Withdrawals', href: '/withdrawals', letter: 'W' },
    { name: 'Consultations', href: '/consultations', letter: 'N' },
    { name: 'User Management', href: '/user-management', letter: 'U' },
  ];

  const renderWidgetContent = (id: string) => {
    switch (id) {
      case 'recents':
        return (
          <RecentlyVisitedWidget
            onOpenAllServices={() => navigate('/orders')}
            searchFilter={searchQuery}
          />
        );
      case 'security':
        return <SecurityWidget activeRegion={activeRegion} />;
      case 'welcome':
        return <WelcomeWidget />;
      case 'cost':
        return <CostUsageWidget activeRegion={activeRegion} />;
      case 'health':
        return <HealthWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-aws-body-bg flex flex-col font-sans antialiased overflow-hidden">
      
      <Header
        activeAccount={activeAccount}
        setActiveAccount={setActiveAccount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenExplorer={() => setCatalogOpen(true)}
      />

      <SubHeader
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex relative overflow-y-auto">
        
        <aside
          className={`bg-white border-r border-[#eaeded] transition-all duration-300 ease-in-out shrink-0 sticky top-0 flex flex-col justify-between overflow-y-auto ${
            isSidebarOpen ? 'w-56' : 'w-12'
          }`}
        >
          <div>
            <ul className="py-2.5 space-y-1">
              <li>
                <a
                  href="/"
                  className="flex items-center px-3.5 py-2 hover:bg-gray-100 text-[#232f3e] hover:text-black transition-colors duration-150 rounded mx-1"
                  title="Dashboard"
                >
                  <span className="font-mono text-[9px] w-4 h-4 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-500 mr-2 uppercase shrink-0">
                    D
                  </span>
                  {isSidebarOpen && (
                    <span className="font-semibold text-[13px] tracking-tight">Dashboard</span>
                  )}
                </a>
              </li>

              <li>
                <a
                  href="/orders"
                  className="flex items-center px-3.5 py-2 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors duration-150 rounded mx-1"
                  title="Orders"
                >
                  <span className="font-mono text-[9px] w-4 h-4 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-500 mr-2 uppercase shrink-0">
                    O
                  </span>
                  {isSidebarOpen && (
                    <span className="font-medium text-[13px] tracking-tight">Orders</span>
                  )}
                </a>
              </li>
            </ul>

            <span className="block h-px bg-[#eaeded] mx-2 my-2" />

            <div className="px-3.5 py-1 text-gray-400 font-extrabold text-[10px] uppercase tracking-wide flex items-center space-x-2">
              <Star size={12} className="text-amber-500 shrink-0 fill-amber-500" />
              {isSidebarOpen && <span>Management</span>}
            </div>

            <ul className="py-1 space-y-0.5">
              {sidebarManagement.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="flex items-center px-3.5 py-1.5 hover:bg-gray-50 text-[13px] text-[#414d5c] hover:text-aws-blue-accent transition-colors duration-150 rounded mx-1 pl-4"
                    title={item.name}
                  >
                    <span className="font-mono text-[9px] w-4 h-4 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-500 mr-2 uppercase">
                      {item.letter}
                    </span>
                    {isSidebarOpen && <span className="font-medium tracking-tight truncate">{item.name}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-1 border-t border-[#eaeded] text-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full py-1.5 flex justify-center hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors duration-150"
              title={isSidebarOpen ? "Collapse menu" : "Expand menu"}
            >
              {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-6 max-w-7xl mx-auto space-y-6">
          
          {searchQuery && (
            <div className="bg-blue-50 border border-blue-200 text-[13px] text-[#0066cc] p-3 rounded-[2.5px] flex items-center justify-between shadow-sm animate-fade-in ">
              <p className="flex items-center space-x-2">
                <Sparkles size={14} />
                <span>
                  Active filter is masking <strong>Recently Visited</strong> services. Search criteria: <em>"{searchQuery}"</em>.
                </span>
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-bold uppercase tracking-wide hover:underline focus:outline-none"
              >
                Reset Filter
              </button>
            </div>
          )}

          <div className="grid grid-cols-12 gap-5 md:gap-6">
            
            {widgets.filter((w) => w.visible).length > 0 ? (
              widgets
                .filter((w) => w.visible)
                .map((widget, idx) => {
                  const activeVisible = widgets.filter(w => w.visible);
                  const innerIdx = activeVisible.findIndex(w => w.id === widget.id);
                  const canMoveLeft = innerIdx > 0;
                  const canMoveRight = innerIdx < activeVisible.length - 1;

                  return (
                    <WidgetCard
                      key={widget.id}
                      widget={widget}
                      onRemove={() => handleRemoveWidget(widget.id)}
                      onResize={(newSize) => handleResizeWidget(widget.id, newSize)}
                      onMoveLeft={canMoveLeft ? () => moveWidget(widget.id, 'left') : undefined}
                      onMoveRight={canMoveRight ? () => moveWidget(widget.id, 'right') : undefined}
                      dragOver={dragOverId === widget.id}
                      onDragStart={(e) => handleDragStart(e, widget.id)}
                      onDragOver={(e) => handleDragOver(e, widget.id)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, widget.id)}
                    >
                      {renderWidgetContent(widget.id)}
                    </WidgetCard>
                  );
                })
            ) : (
              <div className="col-span-12 bg-white border border-[#c1c9d2] p-12 text-center rounded-[2px]  text-aws-text-secondary">
                <Layers className="mx-auto text-gray-300 mb-3" size={36} />
                <h3 className="font-bold text-[15px] text-aws-heading">All widgets are closed</h3>
                <p className="text-[12px] text-gray-500 mt-1 max-w-sm mx-auto">
                  Bring security scoring indices, billing forecasts, and active resource trackers back by clicking add widgets below.
                </p>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="mt-4 px-4 py-2 bg-aws-orange-accent hover:bg-aws-orange-accent-hover text-black font-bold text-[13px] rounded transition-all duration-200 shadow-sm"
                >
                  + Customize Layout
                </button>
              </div>
            )}
          </div>
        </main>

        <aside className="hidden lg:block w-9 border-l border-[#eaeded] bg-white shrink-0 sticky top-0 py-2 space-y-3.5 text-center">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full flex justify-center p-1.5 focus:outline-none hover:bg-gray-100 rounded transition-all duration-200 group text-gray-500 hover:text-black"
            title="Configure widget cards"
          >
            <Settings size={15} className="group-hover:rotate-45 duration-300" />
          </button>
          
          <button
            onClick={() => addToast("Support chat center offline in local simulation.", "info")}
            className="w-full flex justify-center p-1.5 focus:outline-none hover:bg-gray-100 rounded transition-all duration-200 text-gray-500 hover:text-aws-blue-accent"
            title="Help and feedback"
          >
            <MessageSquare size={15} />
          </button>

          <span className="block h-px bg-[#eaeded] mx-1" />

          <div className="w-full text-center text-[10px] text-gray-400 font-mono scale-90 translate-y-3 font-semibold leading-tight px-1">
            AWS
          </div>
        </aside>
      </div>

      <AddWidgetsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        widgets={widgets}
        onToggleWidget={handleToggleWidgetVisibility}
        onResetLayout={handleResetWorkspace}
      />

      <AWSExploreDropdown
        isOpen={catalogOpen}
        onClose={() => setCatalogOpen(false)}
      />

      <div className="fixed bottom-4 left-4 z-50 flex flex-col space-y-2 max-w-sm ">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`border rounded px-3.5 py-2.5 shadow-xl text-[12.5px] font-medium flex items-center justify-between space-x-3.5 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-emerald-900 border-emerald-800 text-emerald-100'
                : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            <span className="leading-tight">{toast.msg}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-400 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
