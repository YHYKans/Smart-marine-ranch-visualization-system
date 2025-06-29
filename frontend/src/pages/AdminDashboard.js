import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserEditModal from '../components/UserEditModal';
import { 
  Layout, Card, Tabs, Table, Tag, Spin, Alert, Avatar, 
  Button, Space, Typography, Statistic, Badge
} from 'antd';
import { 
  UserOutlined, TeamOutlined, HistoryOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, 
  EditOutlined, LockOutlined, LineChartOutlined,
  DashboardOutlined, CloudServerOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const AdminDashboard = () => {
  const { userInfo, logout, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [stats, setStats] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/user-dashboard');
      return;
    }
    
    fetchData(activeTab);
    fetchDashboardStats();
  }, [activeTab, navigate, userInfo]);

  const fetchDashboardStats = async () => {
    try {
      const response = await authFetch('/api/stats');
      if (!response.ok) throw new Error('获取统计数据失败');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('获取统计数据失败:', err);
    }
  };

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
      setError(err.message || '获取数据失败');
      if (err.message.includes('权限') || err.message.includes('访问被拒绝')) {
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
      if (response.status === 403) {
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
      if (response.status === 403) {
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

  const userColumns = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <Avatar 
            size="small" 
            src={record.avatar} 
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'isAdmin',
      key: 'role',
      render: (isAdmin) => (
        <Tag color={isAdmin ? 'geekblue' : 'green'} icon={isAdmin ? <CloudServerOutlined /> : <UserOutlined />}>
          {isAdmin ? '管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color, icon, text;
        if (status === 'active') {
          color = 'success';
          icon = <CheckCircleOutlined />;
          text = '活跃';
        } else if (status === 'suspended') {
          color = 'error';
          icon = <CloseCircleOutlined />;
          text = '已停用';
        } else {
          color = 'default';
          text = '未激活';
        }
        return <Tag color={color} icon={icon}>{text}</Tag>;
      }
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date)
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date) => date ? formatDate(date) : '从未登录'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EditOutlined />} 
          onClick={(e) => {
            e.stopPropagation();
            setEditingUser(record);
          }}
        >
          编辑
        </Button>
      ),
    },
  ];

  const logColumns = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <Avatar 
            size="small" 
            icon={<UserOutlined />}
            style={{ backgroundColor: record.successful ? '#52c41a' : '#f5222d' }}
          />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        let text, icon;
        switch(action) {
          case 'login': 
            text = '登录'; 
            icon = <LockOutlined />;
            break;
          case 'register': 
            text = '注册'; 
            icon = <UserOutlined />;
            break;
          case 'logout': 
            text = '登出'; 
            icon = <LockOutlined />;
            break;
          default: 
            text = '密码重置';
            icon = <LockOutlined />;
        }
        return <Tag icon={icon}>{text}</Tag>;
      }
    },
    {
      title: '用户类型',
      dataIndex: 'userType',
      key: 'userType',
      render: (userType) => (
        <Tag color={userType === 'admin' ? 'geekblue' : 'green'}>
          {userType === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'successful',
      key: 'status',
      render: (successful, record) => (
        <Space>
          <Badge 
            status={successful ? "success" : "error"} 
            text={successful ? '成功' : '失败'} 
          />
          {!successful && record.failureReason && (
            <Text type="secondary">({record.failureReason})</Text>
          )}
        </Space>
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip) => ip || '-'
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => formatDate(date)
    }
  ];

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-[#001529] to-[#003366]">
      <Header className="flex items-center justify-between bg-transparent border-b border-blue-800 px-6">
        <div className="flex items-center">
          <div className="flex items-center mr-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mr-3">
              <DashboardOutlined className="text-white text-xl" />
            </div>
            <Title level={3} className="mb-0 text-white">智能海洋养殖管理平台</Title>
          </div>
          
          <div className="flex space-x-6">
            <Button 
              type="text" 
              icon={<LineChartOutlined className="text-blue-300" />}
              className="text-blue-200 hover:text-white"
            >
              系统监控
            </Button>
            <Button 
              type="text" 
              icon={<CloudServerOutlined className="text-blue-300" />}
              className="text-blue-200 hover:text-white"
            >
              服务器状态
            </Button>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="mr-4 text-right">
            <Text className="text-blue-200 block">管理员</Text>
            <Text strong className="text-white">{userInfo.username}</Text>
          </div>
          <Avatar 
            size="large" 
            src={userInfo.avatar} 
            icon={<UserOutlined />}
            className="bg-gradient-to-r from-cyan-500 to-blue-500"
          />
        </div>
      </Header>
      
      <Content className="p-6">
        {/* 数据统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-blue-900/50 border border-blue-700/50 backdrop-blur-sm">
            <Statistic
              title={<span className="text-blue-300">用户总数</span>}
              value={stats.totalUsers || 0}
              valueStyle={{ color: '#fff' }}
              prefix={<TeamOutlined className="text-blue-300" />}
            />
          </Card>
          
          <Card className="bg-blue-900/50 border border-blue-700/50 backdrop-blur-sm">
            <Statistic
              title={<span className="text-blue-300">活跃用户</span>}
              value={stats.activeUsers || 0}
              valueStyle={{ color: '#fff' }}
              prefix={<CheckCircleOutlined className="text-green-400" />}
            />
          </Card>
          
          <Card className="bg-blue-900/50 border border-blue-700/50 backdrop-blur-sm">
            <Statistic
              title={<span className="text-blue-300">今日登录</span>}
              value={stats.todayLogins || 0}
              valueStyle={{ color: '#fff' }}
              prefix={<HistoryOutlined className="text-blue-300" />}
            />
          </Card>
          
          <Card className="bg-blue-900/50 border border-blue-700/50 backdrop-blur-sm">
            <Statistic
              title={<span className="text-blue-300">系统状态</span>}
              value="运行中"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined className="text-green-400" />}
            />
          </Card>
        </div>
        
        <Card 
          className="bg-blue-900/30 border border-blue-700/30 backdrop-blur-sm"
          bodyStyle={{ padding: 0 }}
        >
          <Tabs 
            activeKey={activeTab}
            onChange={setActiveTab}
            className="custom-admin-tabs"
            tabBarStyle={{ 
              padding: '0 24px', 
              background: 'linear-gradient(90deg, rgba(0,21,41,0.8) 0%, rgba(0,33,64,0.8) 100%)',
              margin: 0
            }}
          >
            <TabPane 
              tab={
                <span className="text-blue-200 flex items-center">
                  <TeamOutlined className="mr-2" /> 用户管理
                </span>
              } 
              key="users"
            >
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Spin size="large" tip="加载用户数据..." />
                  </div>
                ) : error ? (
                  <Alert message={error} type="error" showIcon />
                ) : (
                  <Table 
                    columns={userColumns}
                    dataSource={users}
                    rowKey="_id"
                    rowClassName="cursor-pointer hover:bg-blue-800/20"
                    onRow={(record) => ({
                      onClick: () => setEditingUser(record),
                    })}
                    pagination={{ 
                      pageSize: 8, 
                      showSizeChanger: false,
                      className: 'custom-pagination'
                    }}
                    locale={{
                      emptyText: (
                        <div className="py-12 text-center">
                          <div className="text-blue-300 mb-2">没有用户数据</div>
                          <Button type="primary">添加新用户</Button>
                        </div>
                      )
                    }}
                  />
                )}
              </div>
            </TabPane>
            
            <TabPane 
              tab={
                <span className="text-blue-200 flex items-center">
                  <HistoryOutlined className="mr-2" /> 系统日志
                </span>
              } 
              key="logs"
            >
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Spin size="large" tip="加载日志数据..." />
                  </div>
                ) : error ? (
                  <Alert message={error} type="error" showIcon />
                ) : (
                  <Table 
                    columns={logColumns}
                    dataSource={logs}
                    rowKey="_id"
                    pagination={{ 
                      pageSize: 8, 
                      showSizeChanger: false,
                      className: 'custom-pagination'
                    }}
                    locale={{
                      emptyText: (
                        <div className="py-12 text-center">
                          <div className="text-blue-300 mb-2">没有日志数据</div>
                          <Text type="secondary">系统运行日志将显示在这里</Text>
                        </div>
                      )
                    }}
                  />
                )}
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </Content>
      
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}
      
      <style jsx global>{`
        .custom-admin-tabs .ant-tabs-nav::before {
          border-bottom: 1px solid rgba(24, 144, 255, 0.3) !important;
        }
        
        .custom-admin-tabs .ant-tabs-tab {
          padding: 16px 0 !important;
          margin: 0 20px !important;
          color: rgba(255, 255, 255, 0.65) !important;
        }
        
        .custom-admin-tabs .ant-tabs-tab-active {
          color: #1890ff !important;
        }
        
        .custom-admin-tabs .ant-tabs-ink-bar {
          background: #1890ff;
          height: 3px !important;
        }
        
        .custom-admin-tabs .ant-tabs-tab:hover {
          color: #1890ff !important;
        }
        
        .ant-table {
          background: transparent !important;
          color: rgba(255, 255, 255, 0.85) !important;
        }
        
        .ant-table-thead > tr > th {
          background: rgba(0, 33, 64, 0.5) !important;
          border-bottom: 1px solid rgba(24, 144, 255, 0.3) !important;
          color: #8dc6ff !important;
        }
        
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(24, 144, 255, 0.15) !important;
          background: rgba(0, 33, 64, 0.2) !important;
        }
        
        .ant-table-tbody > tr.ant-table-row:hover > td {
          background: rgba(24, 144, 255, 0.1) !important;
        }
        
        .custom-pagination .ant-pagination-item,
        .custom-pagination .ant-pagination-prev,
        .custom-pagination .ant-pagination-next {
          background: rgba(0, 33, 64, 0.3) !important;
          border: 1px solid rgba(24, 144, 255, 0.2) !important;
          color: #8dc6ff !important;
        }
        
        .custom-pagination .ant-pagination-item a {
          color: #8dc6ff !important;
        }
        
        .custom-pagination .ant-pagination-item-active {
          background: #1890ff !important;
          border-color: #1890ff !important;
        }
        
        .custom-pagination .ant-pagination-item-active a {
          color: white !important;
        }
        
        .ant-tag {
          background: rgba(24, 144, 255, 0.15) !important;
          color: #8dc6ff !important;
          border: none !important;
          border-radius: 4px !important;
          padding: 2px 8px !important;
        }
        
        .ant-statistic-title {
          color: #8dc6ff !important;
        }
        
        .ant-statistic-content {
          color: white !important;
        }
      `}</style>
    </Layout>
  );
};

export default AdminDashboard;