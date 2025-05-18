import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PasswordEditModal from '../components/PasswordEditModal';

/**
 * UserDashboard 组件 - 普通用户仪表板
 * 
 * 功能：
 * 1. 提供仪表板界面
 * 2. 显示用户个人信息
 * 3. 提供用户登出功能
 */
const UserDashboard = () => {
  // 从认证上下文获取用户信息和登出方法
  const { userInfo, logout, authFetch } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordSave = async (passwordData) => {
    try {
      const response = await authFetch(`/api/users/${userInfo.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '密码修改失败');
      }

      setSuccessMessage('密码修改成功！');
      setShowPasswordModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 用户导航栏 */}
      <nav className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* 左侧：标题 */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">用户仪表板</h1>
            </div>
            {/* 右侧：用户信息和登出按钮 */}
            <div className="flex items-center">
              <span className="text-white mr-4">欢迎，{userInfo.username}</span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 成功消息提示 */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* 错误消息提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">账户信息</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">个人信息</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">用户名</span>
                    <p className="text-gray-800">{userInfo.username}</p>
                  </div>
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">邮箱</span>
                    <p className="text-gray-800">{userInfo.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">账户类型</span>
                    <p className="text-gray-800">
                      {userInfo.isAdmin ? (
                        <span className="text-blue-600 font-medium">管理员</span>
                      ) : (
                        "普通用户"
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">账户安全</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300 mb-3"
                >
                    修改密码
                  </button>
                  <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-300">
                    更新个人信息
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">最近活动</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      活动
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      登录系统
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date().toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        成功
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      {showPasswordModal && (
        <PasswordEditModal
          onClose={() => {
            setShowPasswordModal(false);
            setError('');
          }}
          onSave={handlePasswordSave}
        />
      )}
    </div>
  );
};

export default UserDashboard;