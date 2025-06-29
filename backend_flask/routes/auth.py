from flask import Blueprint, request, jsonify, g
import jwt
import bcrypt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import pooling
from functools import wraps

# 加载环境变量
load_dotenv()

# 创建蓝图
auth_bp = Blueprint('auth', __name__)

# MySQL 连接池配置
DB_CONFIG = {
    'host': os.environ.get('MYSQL_HOST', 'localhost'),
    'user': os.environ.get('MYSQL_USER', 'root'),
    'password': os.environ.get('MYSQL_PASSWORD', '123456'),
    'database': os.environ.get('MYSQL_DATABASE', 'water_quality_monitoring')
}

# 初始化连接池
connection_pool = pooling.MySQLConnectionPool(
    pool_name="auth_pool",
    pool_size=5,
    **DB_CONFIG
)

def get_db_connection():
    """从连接池获取数据库连接"""
    return connection_pool.get_connection()

def execute_query(query, params=None, fetch=True):
    """执行SQL查询并返回结果"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(query, params or ())
        if fetch:
            result = cursor.fetchall()
        else:
            result = cursor.rowcount
        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

# ======================
# 认证中间件
# ======================

def auth_required(f):
    """JWT认证装饰器（适配x-auth-token头）"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # 从 x-auth-token 头获取令牌
        if 'x-auth-token' in request.headers:
            token = request.headers['x-auth-token']
        
        if not token:
            return jsonify({"message": "缺少认证令牌"}), 401
        
        try:
            jwt_secret = os.environ.get('JWT_SECRET', 'default_secret_key')
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            user_id = payload['user']['id']
            
            # 从数据库获取用户信息
            user = execute_query(
                "SELECT user_id, username, email, is_admin FROM users WHERE user_id = %s",
                (user_id,)
            )
            
            if not user:
                return jsonify({"message": "用户不存在"}), 404
            
            g.user = {
                "id": user[0]['user_id'],
                "username": user[0]['username'],
                "email": user[0]['email'],
                "isAdmin": user[0]['is_admin']
            }
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "令牌已过期"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "无效令牌"}), 401
        except Exception as e:
            return jsonify({"message": f"认证错误: {str(e)}"}), 500
    return decorated

def admin_required(f):
    """管理员权限认证装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # 先调用auth_required验证登录
        result = auth_required(f)(*args, **kwargs)
        if isinstance(result, tuple) and result[1] in (401, 400):
            return result
        
        # 验证管理员权限
        if not g.user.get('isAdmin'):
            return jsonify({"message": "需要管理员权限"}), 403
        
        return f(*args, **kwargs)
    return decorated

# ======================
# 认证路由
# ======================

@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册路由"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        is_admin = data.get('isAdmin', False)
        admin_code = data.get('adminCode')
        
        # 检查用户名或邮箱是否已存在
        existing_user = execute_query(
            "SELECT user_id FROM users WHERE username = %s OR email = %s",
            (username, email)
        )
        
        if existing_user:
            return jsonify({"message": "用户名或邮箱已被使用"}), 400
        
        # 验证管理员注册码
        if is_admin:
            admin_registration_code = os.environ.get('ADMIN_REGISTRATION_CODE', "123456")
            if admin_code != admin_registration_code:
                return jsonify({"message": "管理员注册码无效"}), 400
        
        # 加密密码
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # 执行注册
        execute_query(
            "INSERT INTO users (username, password_hash, email, is_admin) VALUES (%s, %s, %s, %s)",
            (username, password_hash, email, is_admin),
            fetch=False,
        )
        
        # 获取用户ID
        user = execute_query(
            "SELECT user_id FROM users WHERE username = %s",
            (username,),
        )
        user_id = user[0]['user_id']
        
        # 记录注册日志
        execute_query(
            "INSERT INTO auth_logs (user_id, username, action, user_type, successful, ip_address, user_agent) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (user_id, username, "register", "admin" if is_admin else "user", True, 
             request.remote_addr, request.headers.get('User-Agent')),
            fetch=False,
        )
        
        return jsonify({
            "message": "注册成功",
            "user": {
                "username": username,
                "email": email,
                "isAdmin": is_admin
            }
        }), 201
        
    except Exception as e:
        print(f"注册错误: {str(e)}")
        return jsonify({"message": f"服务器错误: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录路由"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('isAdmin', False)
        
        # 查询用户
        users = execute_query(
            "SELECT user_id, username, password_hash, is_admin FROM users WHERE username = %s",
            (username,)
        )
        
        if not users:
            # 检查系统保留用户
            system_user = execute_query(
                "SELECT user_id FROM users WHERE user_id = 1",
                fetch=True
            )
            
            if not system_user:
                raise Exception("系统保留用户不存在，请检查数据库")
            
            # 记录登录失败日志
            execute_query(
                "INSERT INTO auth_logs (user_id, username, action, user_type, successful, ip_address, user_agent, failure_reason) "
                "VALUES (1, %s, %s, %s, %s, %s, %s, %s)",
                (username, "login", "admin" if is_admin else "user", False, 
                 request.remote_addr, request.headers.get('User-Agent'), "用户名或密码错误"),
                fetch=False
            )
            return jsonify({"message": "用户名或密码错误"}), 400
        
        user = users[0]
        
        # 验证用户类型
        if user['is_admin'] != is_admin:
            # 记录登录失败日志
            execute_query(
                "INSERT INTO auth_logs (user_id, username, action, user_type, successful, ip_address, user_agent, failure_reason) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (user['user_id'], username, "login", "admin" if is_admin else "user", False, 
                 request.remote_addr, request.headers.get('User-Agent'), "用户类型错误"),
                fetch=False
            )
            return jsonify({"message": "用户名或密码错误"}), 400
        
        # 验证密码
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            # 记录登录失败日志
            execute_query(
                "INSERT INTO auth_logs (user_id, username, action, user_type, successful, ip_address, user_agent, failure_reason) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (user['user_id'], username, "login", "admin" if is_admin else "user", False, 
                 request.remote_addr, request.headers.get('User-Agent'), "密码错误"),
                fetch=False
            )
            return jsonify({"message": "用户名或密码错误"}), 400
        
        user_id = user['user_id']
        # 更新最后登录时间
        execute_query(
            "UPDATE users SET last_login = %s WHERE user_id = %s",
            (datetime.utcnow(), user_id),
            fetch=False
        )
        
        # 生成JWT令牌
        jwt_secret = os.environ.get('JWT_SECRET', 'default_secret_key')
        token = jwt.encode({
            "user": {
                "id": user_id,
                "username": user['username'],
                "isAdmin": user['is_admin']
            },
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, jwt_secret, algorithm="HS256")
        
        # 记录登录成功日志
        execute_query(
            "INSERT INTO auth_logs (user_id, username, action, user_type, successful, ip_address, user_agent) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (user_id, username, "login", "admin" if is_admin else "user", True, 
             request.remote_addr, request.headers.get('User-Agent')),
            fetch=False
        )
        
        # 获取用户邮箱
        user_email = execute_query(
            "SELECT email FROM users WHERE user_id = %s",
            (user_id,)
        )[0]['email']
        
        return jsonify({
            "message": "登录成功",
            "token": token,
            "user": {
                "id": user_id,
                "username": user['username'],
                "email": user_email,
                "isAdmin": user['is_admin']
            }
        })
        
    except Exception as e:
        print(f"登录错误: {str(e)}")
        return jsonify({"message": "服务器错误"}), 500

@auth_bp.route('/user', methods=['GET'])
@auth_required
def get_user():
    """获取当前用户信息"""
    try:
        user_id = g.user['id']
        # 查询用户信息（使用created_at字段）
        user = execute_query(
            "SELECT user_id, username, email, is_admin, created_at, last_login FROM users WHERE user_id = %s",
            (user_id,)
        )
        
        if not user:
            return jsonify({"message": "用户不存在"}), 404
        
        # 格式化时间
        user_data = user[0]
        if user_data['created_at']:
            user_data['createTime'] = str(user_data['created_at'])  # 前端使用createTime
        if user_data['last_login']:
            user_data['lastLogin'] = str(user_data['last_login'])
        user_data.pop('user_id')  # 重命名为id
        user_data['id'] = user_id
        
        return jsonify(user_data)
        
    except Exception as e:
        print(f"获取用户信息错误: {str(e)}")
        return jsonify({"message": "服务器错误"}), 500

@auth_bp.route('/logs', methods=['GET'])
@admin_required
def get_logs():
    """获取认证日志列表"""
    try:
        logs = execute_query(
            "SELECT log_id, user_id, username, action, user_type, successful, ip_address, "
            "user_agent, failure_reason, timestamp FROM auth_logs "
            "ORDER BY timestamp DESC LIMIT 100"
        )
        
        # 格式化时间
        for log in logs:
            log['timestamp'] = str(log['timestamp'])
        
        return jsonify(logs)
        
    except Exception as e:
        print(f"获取日志错误: {str(e)}")
        return jsonify({"message": "服务器错误"}), 500

@auth_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """获取所有用户列表"""
    try:
        # 查询用户列表（使用created_at字段）
        users = execute_query(
            "SELECT user_id, username, email, is_admin, created_at, last_login FROM users"
        )
        
        # 格式化时间和数据
        result = []
        for user in users:
            formatted_user = {
                "id": user['user_id'],
                "username": user['username'],
                "email": user['email'],
                "isAdmin": user['is_admin'],
                "createTime": str(user['created_at']),  # 前端使用createTime
                "lastLogin": str(user['last_login']) if user['last_login'] else None
            }
            result.append(formatted_user)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"获取用户列表错误: {str(e)}")
        return jsonify({"message": "服务器错误"}), 500

@auth_bp.route('/logout', methods=['POST'])
@auth_required
def logout():
    """用户登出路由"""
    try:
        user_id = g.user['id']  # 从g.user获取user_id
        
        # 记录登出日志
        execute_query(
            "INSERT INTO auth_logs (user_id, username, action, user_type, successful, ip_address, user_agent) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (user_id, g.user['username'], "logout", "admin" if g.user['isAdmin'] else "user", 
             True, request.remote_addr, request.headers.get('User-Agent')),
            fetch=False
        )
        
        return jsonify({"message": "登出成功"})
        
    except Exception as e:
        print(f"登出错误: {str(e)}")
        return jsonify({"message": "服务器错误"}), 500

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """更新用户信息"""
    try:
        data = request.json
        if not data:
            return jsonify({"message": "缺少请求体参数"}), 400
        
        # 检查用户是否存在
        user = execute_query(
            "SELECT user_id FROM users WHERE user_id = %s",
            (user_id,)
        )
        
        if not user:
            return jsonify({"message": "用户不存在"}), 404
        
        updates = {}
        # 处理用户名更新
        if 'username' in data:
            new_username = data['username'].strip()
            existing_username = execute_query(
                "SELECT user_id FROM users WHERE username = %s AND user_id != %s",
                (new_username, user_id)
            )
            if existing_username:
                return jsonify({"message": "用户名已被使用"}), 400
            updates['username'] = new_username
        
        # 处理密码更新
        if 'password' in data and data['password']:
            if len(data['password']) < 6:
                return jsonify({"message": "密码长度至少6位"}), 400
            salt = bcrypt.gensalt()
            updates['password_hash'] = bcrypt.hashpw(data['password'].encode(), salt).decode()
        
        # 处理管理员权限更新
        if 'isAdmin' in data:
            updates['is_admin'] = bool(data['isAdmin'])
        
        # 执行更新
        if updates:
            execute_query(
                "UPDATE users SET " + ", ".join([f"{k} = %s" for k in updates.keys()]) + " WHERE user_id = %s",
                tuple(updates.values()) + (user_id,)
            )
        
        # 返回更新后的用户信息
        updated_user = execute_query(
            "SELECT user_id, username, email, is_admin FROM users WHERE user_id = %s",
            (user_id,)
        )[0]
        
        return jsonify({
            "message": "用户信息更新成功",
            "user": {
                "id": updated_user['user_id'],
                "username": updated_user['username'],
                "email": updated_user['email'],
                "isAdmin": updated_user['is_admin']
            }
        })
        
    except Exception as e:
        print(f"更新用户错误: {str(e)}")
        return jsonify({"message": f"服务器错误: {str(e)}"}), 500

@auth_bp.route('/users/<int:user_id>/password', methods=['PUT'])
@auth_required
def update_password(user_id):
    """修改用户密码"""
    try:
        # 验证权限
        if g.user['id'] != user_id and not g.user['isAdmin']:
            return jsonify({"message": "无权执行此操作"}), 403
        
        data = request.json
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({"message": "缺少必要参数"}), 400
        
        # 获取用户当前密码
        user = execute_query(
            "SELECT user_id, password_hash FROM users WHERE user_id = %s",
            (user_id,)
        )
        
        if not user:
            return jsonify({"message": "用户不存在"}), 404
        
        # 验证当前密码
        if not bcrypt.checkpw(current_password.encode('utf-8'), user[0]['password_hash'].encode('utf-8')):
            return jsonify({"message": "当前密码不正确"}), 401
        
        # 加密新密码
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
        
        # 更新密码
        execute_query(
            "UPDATE users SET password_hash = %s WHERE user_id = %s",
            (password_hash, user_id),
            fetch=False
        )
        
        return jsonify({"message": "密码更新成功"})
        
    except Exception as e:
        print(f"密码修改错误: {str(e)}")
        return jsonify({"message": f"服务器错误: {str(e)}"}), 500