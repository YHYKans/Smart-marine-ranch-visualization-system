import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserEditModal from '../components/UserEditModal';

const AdminDashboard = () => {
  const { userInfo, logout, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const navigate = useNavigate(); // 添加导航钩子

  useEffect(() => {
    console.log('AdminDashboard - 当前用户:', userInfo);
    
    // 立即检查用户权限
    if (!userInfo || !userInfo.isAdmin) {
      console.log('AdminDashboard - 非管理员访问，重定向到用户仪表板');
      navigate('/user-dashboard');
      return;
    }
    
    fetchData(activeTab);
  }, [activeTab, navigate, userInfo]);

  const fetchData = async (tab) => {
    setLoading(true);
    setError(null);
    
    try {
      if (tab === 'users') {
        await fetchUsers();
      } else if (tab === 'logs') {
        await fetchLogs();
      }
    } catch (err) {
      console.error('获取数据失败:', err);
      setError(err.message || '获取数据失败');
      
      // 检查是否是权限问题(403)
      if (err.message.includes('权限') || err.message.includes('访问被拒绝')) {
        console.log('权限被拒绝，重定向到用户仪表板');
        navigate('/user-dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const response = await authFetch('/api/users');
    if (!response.ok) {
      const data = await response.json();
      
      // 特别处理403错误
      if (response.status === 403) {
        console.log('管理员API访问被拒绝，重定向到用户仪表板');
        navigate('/user-dashboard');
      }
      
      throw new Error(data.message || '获取用户列表失败');
    }
    const data = await response.json();
    setUsers(data);
  };

  const fetchLogs = async () => {
    const response = await authFetch('/api/logs');
    if (!response.ok) {
      const data = await response.json();
      
      // 特别处理403错误
      if (response.status === 403) {
        console.log('管理员API访问被拒绝，重定向到用户仪表板');
        navigate('/user-dashboard');
      }
      
      throw new Error(data.message || '获取日志失败');
    }
    const data = await response.json();
    setLogs(data);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const handleSaveUser = async (updatedData) => {
    try {
      const response = await authFetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
  
      // 防御性检查
      if (!response || !response.json) {
        throw new Error('无效的服务器响应');
      }
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || `请求失败 (${response.status})`);
      }
  
      await fetchUsers();
      setEditingUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">管理员控制面板</h1>
            </div>
            <div className="flex items-center">
              <span className="text-white mr-4">管理员：{userInfo.username}</span>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('users')}
              >
                用户管理
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === 'logs'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('logs')}
              >
                系统日志
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          ) : (
            <>
              {activeTab === 'users' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户名
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          邮箱
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          角色
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          注册时间
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          最后登录
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        
                        <tr 
                        key={user._id}
                        onClick={() => setEditingUser(user)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.isAdmin ? '管理员' : '普通用户'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 
                              user.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.status === 'active' ? '活跃' : 
                               user.status === 'suspended' ? '已停用' : '未激活'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLogin ? formatDate(user.lastLogin) : '从未登录'}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            没有用户数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {activeTab === 'logs' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户名
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户类型
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP地址
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          时间
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.action === 'login' ? '登录' : 
                             log.action === 'register' ? '注册' : 
                             log.action === 'logout' ? '登出' : '密码重置'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.userType === 'admin' ? '管理员' : '普通用户'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.successful ? '成功' : '失败'}
                            </span>
                            {!log.successful && log.failureReason && (
                              <span className="ml-2 text-xs text-red-600">
                                ({log.failureReason})
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.ipAddress || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.timestamp)}
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            没有日志数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      {editingUser && (
      <UserEditModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
      />
    )}
    </div>
  );
};

export default AdminDashboard;