import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-dash-bg">
      <Sidebar />
      {/* Main content area — offset by sidebar width. 
          The sidebar is 250px when expanded, 68px when collapsed.
          We use ml-[68px] as base since sidebar starts collapsed on narrow and 
          the sidebar manages its own width. Content adjusts via CSS. */}
      <div className="ml-[250px] transition-all duration-300" id="dashboard-main">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
