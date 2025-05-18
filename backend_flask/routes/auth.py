
"""
认证路由模块
处理用户注册、登录、登出以及用户信息获取等认证相关功能
"""

from flask import Blueprint, request, jsonify, g
import jwt
import bcrypt
import os
from datetime import datetime, timedelta
from bson import ObjectId
from dotenv import load_dotenv

# 导入自定义模块
from models.user_model import User
from models.auth_log_model import AuthLog
from middleware.auth_middleware import auth_required, admin_required

# 加载环境变量
load_dotenv()

# 创建蓝图
auth_bp = Blueprint('auth', __name__)

# 初始化索引的函数，会在蓝图注册到应用时被调用
def init_indexes():
    try:
        User.create_indexes()
        AuthLog.create_indexes()
        print("数据库索引已创建")
    except Exception as e:
        print(f"创建索引时出错: {str(e)}")

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    用户注册路由
    POST /api/register
    处理新用户注册请求，支持普通用户和管理员注册
    """
    try:
        # 从请求体中获取数据
        print("请求数据:", request.data)
        data = request.json
        print("解析后的数据:", data)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        is_admin = data.get('isAdmin', False)
        admin_code = data.get('adminCode')
        
        # 检查用户名或邮箱是否已存在
        existing_user = User.find_by_username_or_email(username, email)
        
        # 如果用户已存在，记录失败日志并返回错误
        if existing_user:
            # 创建并保存认证失败日志
            AuthLog.create(
                username=username,
                action='register',
                user_type='admin' if is_admin else 'user',
                successful=False,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                failure_reason='用户名或邮箱已被使用'
            )
            
            return jsonify({'message': '用户名或邮箱已被使用'}), 400
        
        # 验证管理员注册码（如果尝试注册为管理员）
        if is_admin:
            # admin_registration_code = os.environ.get('ADMIN_REGISTRATION_CODE')
            admin_registration_code = "123456"
            if admin_code != admin_registration_code:
                # 创建并保存管理员注册码无效的失败日志
                AuthLog.create(
                    username=username,
                    action='register',
                    user_type='admin',
                    successful=False,
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent'),
                    failure_reason='管理员注册码无效'
                )
                
                return jsonify({'message': '管理员注册码无效'}), 400
        
        # 对密码进行加密
        salt = bcrypt.gensalt()  # 生成盐值
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')  # 使用盐值哈希密码
        
        # 创建新用户
        user = User.create(
            username=username,
            password=hashed_password,
            email=email,
            is_admin=is_admin
        )
        
        # 创建并保存注册成功日志
        AuthLog.create(
            username=username,
            action='register',
            user_type='admin' if is_admin else 'user',
            successful=True,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        # 返回成功响应（不包含密码）
        return jsonify({
            'message': '注册成功',
            'user': {
                'username': username,
                'email': email,
                'isAdmin': is_admin
            }
        }), 201
        
    except Exception as e:
        print(f"注册错误(详细): {type(e).__name__} - {str(e)}")
        import traceback
        traceback.print_exc()  # 打印完整的错误堆栈
        return jsonify({'message': f'服务器错误: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    用户登录路由
    POST /api/login
    验证用户凭据并生成JWT令牌
    """
    try:
        # 从请求体中获取数据
        data = request.json
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('isAdmin', False)
        
        # 查找用户
        user = User.find_by_username(username)
        
        # 检查用户是否存在且用户类型是否匹配
        if not user or user.get('isAdmin') != is_admin:
            # 创建并保存登录失败日志
            AuthLog.create(
                username=username,
                action='login',
                user_type='admin' if is_admin else 'user',
                successful=False,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                failure_reason='用户名或密码错误'
            )
            
            return jsonify({'message': '用户名或密码错误'}), 400
        
        # 验证密码
        is_match = bcrypt.checkpw(password.encode('utf-8'), user.get('password').encode('utf-8'))
        
        # 如果密码不匹配
        if not is_match:
            # 创建并保存密码错误的登录失败日志
            AuthLog.create(
                username=username,
                action='login',
                user_type='admin' if is_admin else 'user',
                successful=False,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                failure_reason='用户名或密码错误'
            )
            
            return jsonify({'message': '用户名或密码错误'}), 400
        
        # 更新用户最后登录时间
        User.update_last_login(user['_id'])
        
        # 准备JWT载荷
        payload = {
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'isAdmin': user['isAdmin']
            },
            'exp': datetime.utcnow() + timedelta(hours=24)  # 令牌有效期为24小时
        }
        
        # 生成JWT令牌
        jwt_secret = os.environ.get('JWT_SECRET')
        token = jwt.encode(
            payload,
            jwt_secret,
            algorithm='HS256'
        )
        
        # 创建并保存登录成功日志
        AuthLog.create(
            username=username,
            action='login',
            user_type='admin' if is_admin else 'user',
            successful=True,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        # 返回成功响应（包含令牌和用户信息，但不包含密码）
        return jsonify({
            'message': '登录成功',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'isAdmin': user['isAdmin']
            }
        })
        
    except Exception as e:
        # 错误处理
        print(f'登录错误: {str(e)}')
        return jsonify({'message': '服务器错误'}), 500

@auth_bp.route('/user', methods=['GET'])
@auth_required
def get_user():
    """
    获取当前登录用户信息
    GET /api/user
    需要认证中间件 - 仅登录用户可访问
    """
    try:
        # 从g对象获取用户ID
        user_id = g.user.get('id')
        
        # 查找用户（不返回密码字段）
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({'message': '用户不存在'}), 404
        
        # 移除密码字段
        user.pop('password', None)
        
        # 转换ObjectId为字符串
        user['_id'] = str(user['_id'])
        
        return jsonify(user)
        
    except Exception as e:
        # 错误处理
        print(f'获取用户信息错误: {str(e)}')
        return jsonify({'message': '服务器错误'}), 500

@auth_bp.route('/logs', methods=['GET'])
@admin_required
def get_logs():
    """
    获取认证日志列表
    GET /api/logs
    需要管理员认证中间件 - 仅管理员可访问
    """
    try:
        # 查询最近100条日志并按时间降序排序
        logs = AuthLog.get_recent_logs(limit=100)
        
        return jsonify(logs)
        
    except Exception as e:
        # 错误处理
        print(f'获取日志错误: {str(e)}')
        return jsonify({'message': '服务器错误'}), 500

@auth_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """
    获取所有用户列表
    GET /api/users
    需要管理员认证中间件 - 仅管理员可访问
    """
    try:
        # 查询所有用户（不返回密码字段）
        users = User.find_all(exclude_password=True)
        
        return jsonify(users)
        
    except Exception as e:
        # 错误处理
        print(f'获取用户列表错误: {str(e)}')
        return jsonify({'message': '服务器错误'}), 500

@auth_bp.route('/logout', methods=['POST'])
@auth_required
def logout():
    """
    用户登出路由
    POST /api/logout
    需要认证中间件 - 仅登录用户可访问
    """
    try:
        # 创建并保存登出成功日志
        AuthLog.create(
            username=g.user.get('username'),
            action='logout',
            user_type='admin' if g.user.get('isAdmin') else 'user',
            successful=True,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        # 返回成功响应（客户端应该移除令牌）
        return jsonify({'message': '登出成功'})
        
    except Exception as e:
        # 错误处理
        print(f'登出错误: {str(e)}')
        return jsonify({'message': '服务器错误'}), 500

#用户管理    
@auth_bp.route('/users/<user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """
    更新用户信息
    PUT /api/users/<user_id>
    需要管理员权限
    """
    try:
        data = request.json
        
        # 验证必需参数
        if not data:
            return jsonify({'message': '缺少请求体参数'}), 400

        # 获取要修改的用户
        user = User.find_by_id(ObjectId(user_id))
        if not user:
            return jsonify({'message': '用户不存在'}), 404

        updates = {}
        
        # 用户名更新处理
        if 'username' in data:
            new_username = data['username'].strip()
            if new_username == user['username']:
                pass  # 用户名未改变
            elif User.username_exists(new_username):
                return jsonify({'message': '用户名已被使用'}), 400
            else:
                updates['username'] = new_username

        # 密码更新处理
        if 'password' in data and data['password']:
            if len(data['password']) < 6:
                return jsonify({'message': '密码长度至少6位'}), 400
            salt = bcrypt.gensalt()
            updates['password'] = bcrypt.hashpw(data['password'].encode(), salt).decode()

        # 管理员权限更新
        if 'isAdmin' in data:
            updates['isAdmin'] = bool(data['isAdmin'])

        # 执行更新
        if updates:
            if not User.update_user(ObjectId(user_id), updates):
                return jsonify({'message': '用户信息未更改'}), 400

        # 获取更新后的用户信息
        updated_user = User.find_by_id(ObjectId(user_id))
        updated_user['_id'] = str(updated_user['_id'])
        updated_user.pop('password', None)

        return jsonify({
            'message': '用户信息更新成功',
            'user': updated_user
        })

    except Exception as e:
        print(f'更新用户错误: {str(e)}')
        return jsonify({'message': f'服务器错误: {str(e)}'}), 500
    

@auth_bp.route('/users/<user_id>/password', methods=['PUT'])
@auth_required
def update_password(user_id):
    """
    修改用户密码
    PUT /api/users/<user_id>/password
    需要用户本人或管理员权限
    """
    try:
        # 验证权限
        if g.user['id'] != user_id and not g.user['isAdmin']:
            return jsonify({'message': '无权执行此操作'}), 403

        data = request.json
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')

        # 参数验证
        if not current_password or not new_password:
            return jsonify({'message': '缺少必要参数'}), 400

        # 获取用户
        user = User.find_by_id(ObjectId(user_id))
        if not user:
            return jsonify({'message': '用户不存在'}), 404

        # 验证当前密码
        if not bcrypt.checkpw(current_password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': '当前密码不正确'}), 401

        # 更新密码
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
        User.update_user(ObjectId(user_id), {'password': hashed_password})

        return jsonify({'message': '密码更新成功'})

    except Exception as e:
        print(f'密码修改错误: {str(e)}')
        return jsonify({'message': f'服务器错误: {str(e)}'}), 500