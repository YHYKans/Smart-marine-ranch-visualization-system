// src/Layout.jsx
import React, { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-gradient-to-b from-[#0a192f] via-[#0c2a4a] to-[#0a3d62] relative overflow-hidden">
      {/* 海洋背景装饰 */}
      <div className="absolute inset-0 z-0">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 2}px`,
              height: `${Math.random() * 10 + 2}px`,
              backgroundColor: i % 3 === 0 
                ? 'rgba(0, 255, 255, 0.3)' 
                : i % 3 === 1 
                  ? 'rgba(0, 191, 255, 0.3)' 
                  : 'rgba(30, 144, 255, 0.3)',
              opacity: Math.random() * 0.5 + 0.2,
              animationDuration: `${Math.random() * 5 + 3}s`,
            }}
          />
        ))}
        
        {/* 波浪效果 */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg 
            className="relative block w-[calc(100%+1.3px)] h-[80px]"
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              fill="rgba(255,255,255,0.1)" 
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              fill="rgba(255,255,255,0.2)" 
            ></path>
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              fill="rgba(255,255,255,0.3)" 
            ></path>
          </svg>
        </div>
      </div>
      
      {/* 海洋生物装饰 */}
      <div className="absolute top-10 right-10 z-10">
        <div className="text-4xl text-cyan-300 opacity-30 animate-float">
          🐠
        </div>
      </div>
      
      <div className="absolute bottom-20 left-10 z-10">
        <div className="text-5xl text-teal-300 opacity-30 animate-float-reverse">
          🐢
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          isMobile={isMobile} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userRole={userRole}
        />
        
        <div className="flex flex-1 relative">
          <Sidebar
            isOpen={sidebarOpen}
            isMobile={isMobile}
            onClose={() => setSidebarOpen(false)}
            userRole={userRole}
          />
          
          <main className={`
            flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300
            ${!isMobile && sidebarOpen ? 'ml-[200px]' : 'ml-0'}
          `}>
            <div className="bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-4 md:p-6 min-h-[calc(100vh-150px)]">
              <Outlet />
            </div>
          </main>
        </div>

        {/* 底部版权信息 */}
        <footer className="py-4 px-6 text-center text-cyan-300/50 text-xs">
          智慧海洋牧场 AI 系统 © {new Date().getFullYear()}
        </footer>
      </div>

      {/* 定义动画 */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(10deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}