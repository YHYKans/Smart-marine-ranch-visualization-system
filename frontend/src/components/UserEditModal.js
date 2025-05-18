import React, { useState } from 'react';

const UserEditModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    password: '',
    isAdmin: user.isAdmin
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      // 只有当密码字段有值时才发送
      password: formData.password || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">编辑用户</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">用户名</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">新密码</label>
            <input
              type="password"
              placeholder="留空则不修改"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              checked={formData.isAdmin}
              onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})}
              className="mr-2"
              id="isAdmin"
            />
            <label htmlFor="isAdmin" className="text-sm">管理员权限</label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存更改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;