// 在App.jsx、Navbar.jsx、Sidebar.jsx等所有使用JSX的文件顶部添加
import React from 'react';
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole] = useState('admin'); // 从全局状态获取实际角色

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      setSidebarOpen(!isMobileView);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        isMobile={isMobile} 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        userRole={userRole}
      />
      
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        <Sidebar
          isOpen={sidebarOpen}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
          userRole={userRole}
        />
        
        <main style={{
          flex: 1,
          padding: '20px',
          transition: 'margin 0.3s',
          marginLeft: !isMobile && sidebarOpen ? '200px' : '0'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}