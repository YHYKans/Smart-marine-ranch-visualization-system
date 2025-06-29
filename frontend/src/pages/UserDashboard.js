import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PasswordEditModal from '../components/PasswordEditModal';
import { motion } from 'framer-motion';

const UserDashboard = () => {
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
    <div className="min-h-screen bg-gradient-to-b from-[#0a192f] via-[#0c2a4a] to-[#0a3d62] overflow-hidden relative">
      {/* 海洋背景装饰 */}
      <div className="absolute inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 2}px`,
              height: `${Math.random() * 10 + 2}px`,
              backgroundColor: i % 3 === 0 
                ? '#00FFFF' 
                : i % 3 === 1 
                  ? '#00BFFF' 
                  : '#1E90FF',
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
              className="fill-current text-blue-500 opacity-30" 
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              className="fill-current text-teal-400 opacity-40" 
            ></path>
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              className="fill-current text-cyan-300 opacity-30" 
            ></path>
          </svg>
        </div>
      </div>
      
      {/* 海洋生物装饰 */}
      <div className="absolute top-10 right-10 z-10">
        <motion.div 
          className="text-4xl text-cyan-300"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🐠
        </motion.div>
      </div>
      
      <div className="absolute bottom-20 left-10 z-10">
        <motion.div 
          className="text-5xl text-teal-300"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          🐢
        </motion.div>
      </div>

      {/* 用户导航栏 */}
      <nav className="bg-[rgba(10,25,47,0.8)] backdrop-blur-md border-b border-cyan-500/30 shadow-lg shadow-cyan-500/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* 左侧：标题 */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-teal-300">
                智慧海洋牧场 - 用户仪表板
              </h1>
            </div>
            {/* 右侧：用户信息和登出按钮 */}
            <div className="flex items-center space-x-4">
              <span className="text-cyan-200">欢迎，{userInfo.username}</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2 px-4 rounded-lg shadow-md shadow-cyan-500/30"
              >
                退出系统
              </motion.button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
        <div className="px-4 py-6 sm:px-0">
          {/* 成功消息提示 */}
          {successMessage && (
            <motion.div 
              className="mb-4 p-4 bg-green-900/50 border border-green-500/30 rounded-xl text-green-300"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {successMessage}
            </motion.div>
          )}

          {/* 错误消息提示 */}
          {error && (
            <motion.div 
              className="mb-4 p-4 bg-red-900/50 border border-red-500/30 rounded-xl text-red-300"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
          
          <motion.div 
            className="bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-teal-300 mb-6">账户信息</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="flex items-center mb-4">
                  <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30 mr-3">
                    <div className="text-xl text-cyan-400">👤</div>
                  </div>
                  <h3 className="text-lg font-medium text-cyan-300">个人信息</h3>
                </div>
                <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-xl border border-cyan-500/30">
                  <div className="mb-4">
                    <span className="text-sm text-cyan-400 block mb-1">用户名</span>
                    <p className="text-cyan-200 font-medium">{userInfo.username}</p>
                  </div>
                  <div className="mb-4">
                    <span className="text-sm text-cyan-400 block mb-1">邮箱</span>
                    <p className="text-cyan-200 font-medium">{userInfo.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-cyan-400 block mb-1">账户类型</span>
                    <p className="text-cyan-200 font-medium">
                      {userInfo.isAdmin ? (
                        <span className="text-cyan-400 font-medium">管理员</span>
                      ) : (
                        "普通用户"
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="flex items-center mb-4">
                  <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30 mr-3">
                    <div className="text-xl text-cyan-400">🔒</div>
                  </div>
                  <h3 className="text-lg font-medium text-cyan-300">账户安全</h3>
                </div>
                <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-xl border border-cyan-500/30">
                  <motion.button 
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-lg shadow-md shadow-cyan-500/30 mb-4"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    修改密码
                  </motion.button>
                  <motion.button 
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-lg shadow-md shadow-gray-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    更新个人信息
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-6 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30 mr-3">
                <div className="text-xl text-cyan-400">📝</div>
              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-teal-300">最近活动</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-cyan-800/50">
                <thead className="bg-[rgba(10,40,70,0.5)]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      活动
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      时间
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[rgba(10,40,70,0.3)] divide-y divide-cyan-800/30">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-200">
                      登录系统
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300">
                      {new Date().toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/50 text-green-300 border border-green-500/30">
                        成功
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-200">
                      查看水质报告
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300">
                      {new Date(Date.now() - 86400000).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/50 text-green-300 border border-green-500/30">
                        成功
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-200">
                      更新用户设置
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300">
                      {new Date(Date.now() - 172800000).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/50 text-green-300 border border-green-500/30">
                        成功
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
          
          {/* 系统功能卡片 */}
          <motion.div 
            className="mt-6 bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30 mr-3">
                <div className="text-xl text-cyan-400">⚙️</div>
              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-teal-300">系统功能</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-lg border border-cyan-500/30">
                <div className="text-cyan-400 text-lg mb-2">📊 数据分析</div>
                <p className="text-sm text-cyan-200">
                  查看水质趋势、鱼类生长数据等分析报告
                </p>
              </div>
              <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-lg border border-cyan-500/30">
                <div className="text-cyan-400 text-lg mb-2">🔔 预警通知</div>
                <p className="text-sm text-cyan-200">
                  接收水质异常、设备故障等实时预警信息
                </p>
              </div>
              <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-lg border border-cyan-500/30">
                <div className="text-cyan-400 text-lg mb-2">📱 设备管理</div>
                <p className="text-sm text-cyan-200">
                  管理水下传感器、摄像头等监测设备
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* 底部版权信息 */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-cyan-300/50 text-xs z-10">
        智慧海洋牧场 AI 系统 © {new Date().getFullYear()}
      </div>
      
      {showPasswordModal && (
  <div className="fixed inset-0 z-[1000]">
    <PasswordEditModal
      onClose={() => {
        setShowPasswordModal(false);
        setError('');
      }}
      onSave={handlePasswordSave}
    />
  </div>
)}
    </div>
  );
};

export default UserDashboard;