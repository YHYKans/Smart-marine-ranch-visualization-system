import { NavLink } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../context/AuthContext';

const menuConfig = [
  { 
    title: 'Dashboard', 
    path: '/user-dashboard', 
    icon: '📊',
    adminOnly: false,
    description: 'System overview'
  },
  { 
    title: 'Underwater', 
    path: '/underwater', 
    icon: '🏞️',
    adminOnly: false,
    description: 'Underwater monitoring'
  },
  { 
    title: 'FishVisualization', 
    path: '/fish', 
    icon: '🐋',
    adminOnly: false,
    description: 'FishVisualization'
  },
  { 
    title: 'Weather', 
    path: '/weather', 
    icon: '⚙️',
    adminOnly: false,
    description: 'weather'
  },
  { 
    title: 'Video', 
    path: '/video', 
    icon: '⚙️',
    adminOnly: false,
    description: 'Video'
  },
  { 
    title: 'AI Center', 
    path: '/ai-center', 
    icon: '🧠',
    adminOnly: true,
    description: 'AI Analytics'
  },
  { 
    title: 'Admin', 
    path: '/admin-dashboard', 
    icon: '⚙️',
    adminOnly: true,
    description: 'System administration'
  }
];

export default function Sidebar({ isOpen, isMobile, onClose }) {
  const { userInfo } = useAuth();
  
  const filteredMenu = menuConfig.filter(item => 
    !item.adminOnly || (item.adminOnly && userInfo?.isAdmin)
  );

  return (
    <>
      <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-800 transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 h-full overflow-y-auto">
          <nav>
            <ul className="space-y-2">
              {filteredMenu.map(item => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={isMobile ? onClose : undefined}
                    className={({ isActive }) => 
                      `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:bg-gray-700'
                      }`
                    }
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-400">{item.description}</div>
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}
    </>
  );
}