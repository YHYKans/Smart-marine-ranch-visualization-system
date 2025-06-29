import os
import csv
import json
import re
import mysql.connector
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import jwt
from functools import wraps

app = Flask(__name__)

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'water_quality_monitoring'
}

# JWT 配置
app.config['JWT_SECRET_KEY'] = 'your-very-secret-key'  
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # 1小时过期

# 文件上传配置
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'json'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_db_connection():
    """创建并返回数据库连接"""
    return mysql.connector.connect(**DB_CONFIG)

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

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ======================
# 用户认证功能
# ======================

def token_required(f):
    """JWT认证装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # 从请求头获取token
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"error": "缺少认证令牌"}), 401
        
        try:
            # 解码JWT令牌
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = {
                "user_id": data["user_id"],
                "username": data["username"],
                "role": data["role"]
            }
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "令牌已过期"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "无效令牌"}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 401
        
        # 将用户信息附加到请求对象
        request.current_user = current_user
        return f(*args, **kwargs)
    
    return decorated

@app.route('/api/auth/register', methods=['POST'])
def register():
    """用户注册"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'user')  # 默认为普通用户
        
        # 验证输入
        if not username or not password:
            return jsonify({"error": "用户名和密码不能为空"}), 400
        
        # 检查用户名是否已存在
        existing_user = execute_query(
            "SELECT user_id FROM user WHERE username = %s", 
            (username,)
        )
        if existing_user:
            return jsonify({"error": "用户名已存在"}), 400
        
        # 生成密码哈希
        password_hash = generate_password_hash(password)
        
        # 创建用户
        execute_query(
            "INSERT INTO user (username, password_hash, role) VALUES (%s, %s, %s)",
            (username, password_hash, role),
            fetch=False
        )
        
        return jsonify({"message": "用户注册成功"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "用户名和密码不能为空"}), 400
        
        # 查询用户
        user = execute_query(
            "SELECT user_id, username, password_hash, role FROM user WHERE username = %s", 
            (username,)
        )
        
        if not user:
            return jsonify({"error": "用户名或密码错误"}), 401
        
        user = user[0]
        
        # 验证密码
        if not check_password_hash(user['password_hash'], password):
            return jsonify({"error": "用户名或密码错误"}), 401
        
        # 生成JWT令牌
        token = jwt.encode({
            "user_id": user['user_id'],
            "username": user['username'],
            "role": user['role'],
            "exp": datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }, app.config['JWT_SECRET_KEY'])
        
        return jsonify({
            "access_token": token,
            "user_id": user['user_id'],
            "username": user['username'],
            "role": user['role']
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def log_action(user_id, action, details):
    """记录用户操作日志"""
    try:
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent')
        
        execute_query(
            "INSERT INTO user_log (user_id, action, details, ip_address, user_agent) "
            "VALUES (%s, %s, %s, %s, %s)",
            (user_id, action, details, ip_address, user_agent),
            fetch=False
        )
    except Exception as e:
        app.logger.error(f"日志记录失败: {str(e)}")

# ======================
# 地区数据处理功能
# ======================

@app.route('/api/regions', methods=['GET'])
@token_required
def get_regions():
    """获取地区可选列表"""
    try:
        # 获取所有省份
        provinces = execute_query("SELECT DISTINCT province FROM monitoring_site")
        province_list = [p['province'] for p in provinces]
        
        # 获取各省份的流域
        river_basins = {}
        for province in province_list:
            basins = execute_query(
                "SELECT DISTINCT river_basin FROM monitoring_site WHERE province = %s",
                (province,)
            )
            river_basins[province] = [b['river_basin'] for b in basins]
        
        # 获取各流域的断面
        sections = {}
        for province, basins in river_basins.items():
            for basin in basins:
                key = f"{province}-{basin}"
                sites = execute_query(
                    "SELECT DISTINCT section_name FROM monitoring_site WHERE province = %s AND river_basin = %s",
                    (province, basin)
                )
                sections[key] = [s['section_name'] for s in sites]
        
        # 记录操作日志
        log_action(
            request.current_user['user_id'],
            "get_regions",
            "获取地区数据"
        )
        
        return jsonify({
            "provinces": province_list,
            "river_basins": river_basins,
            "sections": sections
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ======================
# 水质数据上传功能
# ======================

@app.route('/api/upload/water', methods=['POST'])
@token_required
def upload_water_data():
    """处理前端上传的水质数据"""
    try:
        # 检查权限
        if request.current_user['role'] != 'admin':
            return jsonify({
                "status": "error", 
                "message": "权限不足，需要管理员权限"
            }), 403
        
        # 检查文件是否存在
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "未上传文件"}), 400
        
        file = request.files['file']
        data_type = request.form.get('data_type', 'water_quality')
        
        # 检查数据类型
        if data_type != 'water_quality':
            return jsonify({"status": "error", "message": "无效的数据类型"}), 400
        
        # 检查文件名
        if file.filename == '':
            return jsonify({"status": "error", "message": "未选择文件"}), 400
        
        # 检查文件类型
        if not allowed_file(file.filename):
            return jsonify({
                "status": "error",
                "message": f"不支持的文件类型，只支持 {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400
        
        # 保存文件
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # 处理水质数据
        inserted_count = process_water_upload(filepath)
        
        # 记录操作日志
        log_action(
            request.current_user['user_id'],
            "upload_water_data",
            f"上传水质数据文件: {filename}, 导入记录数: {inserted_count}"
        )
        
        return jsonify({
            "status": "success",
            "message": "水质数据上传成功",
            "inserted_count": inserted_count
        })
    except Exception as e:
        # 记录错误日志
        log_action(
            request.current_user['user_id'],
            "upload_error",
            f"水质数据上传失败: {str(e)}"
        )
        return jsonify({"status": "error", "message": str(e)}), 500

def process_water_upload(filepath):
    """处理上传的水质数据文件"""
    try:
        # 读取JSON文件
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 验证JSON结构
        if 'tbody' not in data or not isinstance(data['tbody'], list):
            raise ValueError("文件格式无效: 缺少有效的tbody数据")
        
        tbody = data['tbody']
        inserted_count = 0
        
        # 处理每条记录
        for record in tbody:
            # 验证记录格式
            if len(record) < 17:
                continue
            
            # 解析记录字段
            province = record[0].strip()
            river_basin = record[1].strip()
            section_name = record[2].strip()
            
            # 解析时间
            date_time_str = record[3]
            if " " in date_time_str:
                date_part, time_part = date_time_str.split()
                monitoring_date = date_part
                monitoring_time = time_part
            else:
                monitoring_date = date_time_str
                monitoring_time = None
            
            water_grade = record[4].strip()
            
            # 解析HTML值中的原始值
            def extract_value(html_str):
                """从HTML中提取原始值"""
                if not html_str or html_str in ["", "--", "NA"]:
                    return None
                
                # 尝试提取原始值
                if 'title=' in html_str:
                    match = re.search(r"原始值[：:]([\d.]+)", html_str)
                    if match:
                        return float(match.group(1))
                
                # 尝试直接转换
                try:
                    # 去除HTML标签
                    clean_str = re.sub(r'<[^>]+>', '', html_str)
                    return float(clean_str)
                except:
                    return None
            
            # 提取各参数值
            values = {
                'water_temp': extract_value(record[5]),
                'ph': extract_value(record[6]),
                'dissolved_oxygen': extract_value(record[7]),
                'conductivity': extract_value(record[8]),
                'turbidity': extract_value(record[9]),
                'cod_mn': extract_value(record[10]),
                'ammonia_nitrogen': extract_value(record[11]),
                'total_phosphorus': extract_value(record[12]),
                'total_nitrogen': extract_value(record[13]),
                'chla': extract_value(record[14]) if len(record) > 14 else None,
                'algae_density': extract_value(record[15]) if len(record) > 15 else None,
                'site_status': record[16].strip() if len(record) > 16 else "正常",
            }
            
            # 处理监测点
            site_key = (province, river_basin, section_name)
            
            # 查找或创建监测点
            site_query = """
            SELECT site_id FROM monitoring_site 
            WHERE province = %s AND river_basin = %s AND section_name = %s
            """
            site_result = execute_query(site_query, (province, river_basin, section_name))
            
            if site_result:
                site_id = site_result[0]['site_id']
            else:
                # 创建新站点
                site_code = f"{province[:2]}{river_basin[:2]}{section_name[:2]}"
                execute_query(
                    "INSERT INTO monitoring_site (site_code, site_name, province, river_basin, section_name) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (site_code, section_name, province, river_basin, section_name),
                    fetch=False
                )
                site_id = execute_query("SELECT LAST_INSERT_ID()")[0]['LAST_INSERT_ID()']
            
            # 插入水质数据
            execute_query(
                "INSERT INTO water_quality (site_id, monitoring_date, monitoring_time, "
                "province, river_basin, section_name, water_grade, water_temp, ph, "
                "dissolved_oxygen, conductivity, turbidity, cod_mn, ammonia_nitrogen, "
                "total_phosphorus, total_nitrogen, chla, algae_density, site_status, original_file) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    site_id, monitoring_date, monitoring_time,
                    province, river_basin, section_name, water_grade,
                    values['water_temp'], values['ph'], values['dissolved_oxygen'],
                    values['conductivity'], values['turbidity'], values['cod_mn'],
                    values['ammonia_nitrogen'], values['total_phosphorus'], 
                    values['total_nitrogen'], values['chla'], values['algae_density'],
                    values['site_status'], filepath
                ),
                fetch=False
            )
            inserted_count += 1
        
        return inserted_count
    
    except Exception as e:
        raise e

# ======================
# 鱼类数据上传功能
# ======================

@app.route('/api/upload/fish', methods=['POST'])
@token_required
def upload_fish_data():
    """处理前端上传的鱼类数据"""
    try:
        # 检查权限
        if request.current_user['role'] != 'admin':
            return jsonify({
                "status": "error", 
                "message": "权限不足，需要管理员权限"
            }), 403
        
        # 检查文件是否存在
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "未上传文件"}), 400
        
        file = request.files['file']
        data_type = request.form.get('data_type', 'fish')
        
        # 检查数据类型
        if data_type != 'fish':
            return jsonify({"status": "error", "message": "无效的数据类型"}), 400
        
        # 检查文件名
        if file.filename == '':
            return jsonify({"status": "error", "message": "未选择文件"}), 400
        
        # 检查文件类型
        if not allowed_file(file.filename):
            return jsonify({
                "status": "error",
                "message": f"不支持的文件类型，只支持 {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400
        
        # 保存文件
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # 处理鱼类数据
        inserted_count = process_fish_upload(filepath)
        
        # 记录操作日志
        log_action(
            request.current_user['user_id'],
            "upload_fish_data",
            f"上传鱼类数据文件: {filename}, 导入记录数: {inserted_count}"
        )
        
        return jsonify({
            "status": "success",
            "message": "鱼类数据上传成功",
            "inserted_count": inserted_count
        })
    except Exception as e:
        # 记录错误日志
        log_action(
            request.current_user['user_id'],
            "upload_error",
            f"鱼类数据上传失败: {str(e)}"
        )
        return jsonify({"status": "error", "message": str(e)}), 500

def process_fish_upload(filepath):
    """处理上传的鱼类数据文件"""
    try:
        # 读取CSV文件
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        # 验证CSV结构
        required_columns = ['Species', 'Weight', 'Length1', 'Length2', 'Length3', 'Height', 'Width']
        if not all(col in reader.fieldnames for col in required_columns):
            missing = [col for col in required_columns if col not in reader.fieldnames]
            raise ValueError(f"CSV文件缺少必需列: {', '.join(missing)}")
        
        inserted_count = 0
        
        # 处理每条记录
        for row in rows:
            species = row['Species'].strip()
            
            # 查找物种ID
            species_query = "SELECT species_id FROM fish_species WHERE common_name = %s"
            species_result = execute_query(species_query, (species,))
            
            if species_result:
                species_id = species_result[0]['species_id']
            else:
                # 创建新物种
                execute_query(
                    "INSERT INTO fish_species (common_name) VALUES (%s)",
                    (species,),
                    fetch=False
                )
                species_id = execute_query("SELECT LAST_INSERT_ID()")[0]['LAST_INSERT_ID()']
            
            # 处理空值或无效值
            weight = row['Weight'].strip() or None
            length1 = row['Length1'].strip() or None
            length2 = row['Length2'].strip() or None
            length3 = row['Length3'].strip() or None
            height = row['Height'].strip() or None
            width = row['Width'].strip() or None
            
            # 插入观测数据
            execute_query(
                "INSERT INTO fish_observations (species_id, body_weight, body_length1, "
                "body_length2, body_length3, body_height, body_width) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (
                    species_id, 
                    float(weight) if weight else None, 
                    float(length1) if length1 else None, 
                    float(length2) if length2 else None, 
                    float(length3) if length3 else None, 
                    float(height) if height else None, 
                    float(width) if width else None
                ),
                fetch=False
            )
            inserted_count += 1
        
        return inserted_count
    
    except Exception as e:
        raise e

# ======================
# 主程序入口
# ======================

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)