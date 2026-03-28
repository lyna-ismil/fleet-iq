import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-dash-bg flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      {/* Main content area uses margin-left equal to sidebar width to push content. 
          flex-1 allows it to take up the remaining space appropriately. */}
      <div 
        className={`flex-1 transition-all duration-250 ease-in-out ${collapsed ? 'ml-[68px]' : 'ml-[250px]'}`} 
        id="dashboard-main"
      >
        <Header />
        <main className="p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
