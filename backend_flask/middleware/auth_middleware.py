
"""
认证中间件
提供用于验证用户身份和权限的中间件函数
"""

from functools import wraps
from flask import request, jsonify, g
import jwt
import os
from dotenv import load_dotenv
from models.user_model import User

# 加载环境变量
load_dotenv()

def auth_required(f):
    """
    通用认证中间件
    验证请求头中的JWT令牌并将用户信息添加到flask.g对象
    用于保护需要登录才能访问的路由
    
    Args:
        f (function): 被装饰的视图函数
    
    Returns:
        function: 装饰器函数
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # 从请求头中获取令牌
        token = request.headers.get('x-auth-token')
        
        # 检查令牌是否存在
        if not token:
            return jsonify({'message': '无访问权限，未提供令牌'}), 401
        
        try:
            # 验证令牌
            jwt_secret = os.environ.get('JWT_SECRET')
            decoded = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            
            # 将解码后的用户信息添加到g对象
            g.user = decoded['user']
            
            # 继续执行视图函数
            return f(*args, **kwargs)
        
        except jwt.ExpiredSignatureError:
            return jsonify({'message': '令牌已过期'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': '令牌无效'}), 401
    
    return decorated

def admin_required(f):
    """
    管理员认证中间件
    在通用认证的基础上，额外验证用户是否具有管理员权限
    用于保护仅管理员可访问的路由
    
    Args:
        f (function): 被装饰的视图函数
    
    Returns:
        function: 装饰器函数
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # 先执行通用认证中间件
        auth_result = auth_required(lambda: None)()
        
        # 如果认证失败，直接返回错误响应
        if isinstance(auth_result, tuple) and auth_result[1] != 200:
            return auth_result
        
        # 检查用户是否存在且是否为管理员
        if g.user and g.user.get('isAdmin'):
            # 用户是管理员，继续执行视图函数
            return f(*args, **kwargs)
        else:
            # 用户不是管理员，拒绝访问
            return jsonify({'message': '访问被拒绝，需要管理员权限'}), 403
    
    return decorated