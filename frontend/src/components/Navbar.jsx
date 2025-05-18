import { Link } from 'react-router-dom';
import React, { useContext } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ isMobile, onToggleSidebar }) {
  const { userInfo, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
      <div className="flex items-center gap-4 flex-1">
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            className="text-white text-2xl hover:bg-gray-700 p-1 rounded"
            aria-label="Toggle menu"
          >
            ☰
          </button>
        )}
        <Link to="/" className="text-xl font-semibold whitespace-nowrap">
          OCEAN SYSTEM
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-full">
          <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center font-medium">
            {userInfo?.isAdmin ? 'A' : 'U'}
          </div>
          <span className="text-sm uppercase">
            {userInfo?.isAdmin ? 'Admin' : 'User'}
          </span>
        </div>
        <button
          onClick={logout}
          className="hover:bg-gray-700 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}