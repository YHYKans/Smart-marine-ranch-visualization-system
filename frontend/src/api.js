const API_BASE_URL = 'http://localhost:3001';

// 通用请求函数
async function apiRequest(endpoint, method = 'GET', data = null) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  };

  // 添加认证令牌（如果存在）
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }

  // 添加请求体（如果有）
  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // 处理非JSON响应
    const text = await response.text();
    let result;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('响应解析错误:', e, '原始响应:', text);
      throw new Error(`无法解析响应: ${text.substring(0, 100)}...`);
    }

    if (!response.ok) {
      throw new Error(result.message || '请求失败');
    }

    return result;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

// API函数
export const authAPI = {
  register: (userData) => apiRequest('/api/register', 'POST', userData),
  login: (credentials) => apiRequest('/api/login', 'POST', credentials),
  logout: () => apiRequest('/api/logout', 'POST'),
  getCurrentUser: () => apiRequest('/api/user'),
  getUsers: () => apiRequest('/api/users'),
  getLogs: () => apiRequest('/api/logs')
};

export default apiRequest;