"""
主服务器文件
负责设置Flask应用、中间件和路由，包含水质数据异常检测功能
"""

# 导入必要的依赖
from flask import Flask, jsonify, request, Response, send_from_directory,current_app
from flask_cors import CORS
from dotenv import load_dotenv
import config.DataVisualization as DataVisualization
from datetime import datetime
import os
import joblib
import mysql.connector
from mysql.connector import pooling
import json
import time
import requests
import sys
import io
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import pkg_resources
import subprocess
import platform
import socket
import logging
from logging.handlers import RotatingFileHandler


# 加载环境变量
load_dotenv()

# 创建Flask应用实例
# app = Flask(__name__)
app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
PORT = int(os.environ.get('PORT', 3001))  # 设置端口，优先使用环境变量中的PORT，否则默认为3001
# 立即初始化模型
try:
    model = joblib.load('fish_length_model.pkl')
except Exception as e:
    print(f"模型加载失败: {e}")
    model = None


    
# 在创建 app 后添加日志配置
if not app.debug:
    # 生产环境日志配置
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    file_handler = RotatingFileHandler(
        'logs/app.log', 
        maxBytes=1024 * 1024 * 10,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Application startup')

# 配置中间件
# 配置更宽松的CORS规则
CORS(app, 
     origins=["http://localhost:3000"],  
     allow_headers=["Content-Type", "x-auth-token", "Access-Control-Allow-Origin"],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     expose_headers=["Content-Type", "x-auth-token"]
    )

# MySQL 连接池配置
DB_CONFIG = {
    'host': os.environ.get('MYSQL_HOST', 'localhost'),
    'user': os.environ.get('MYSQL_USER', 'root'),
    'password': os.environ.get('MYSQL_PASSWORD', '123456'),
    'database': os.environ.get('MYSQL_DATABASE', 'water_quality_monitoring')
}

# 初始化连接池
connection_pool = pooling.MySQLConnectionPool(
    pool_name="main_pool",
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

# 初始化数据库引擎用于 pandas 操作
def get_db_engine():
    conn_str = f"mysql+mysqlconnector://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}/{DB_CONFIG['database']}"
    return create_engine(conn_str)

# 导入鱼类识别模块
# 注册鱼类识别蓝图
from routes.fish_recognition import fish_recognition_bp
app.register_blueprint(fish_recognition_bp, url_prefix='/fish')

# 导入路由和初始化函数
from routes.auth import auth_bp  # 改为MySQL版本的认证路由

# 注册蓝图(Blueprint)路由
app.register_blueprint(auth_bp, url_prefix='/api')  # 所有认证相关的路由都以/api为前缀

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

# 智能问答API功能
def ai_communicate(message, max_retries=3, timeout=300):
    url = "https://api.siliconflow.cn/v1/chat/completions"

    headers = {
        "Authorization": "Bearer sk-nlcqvwkkrzdmsunawrxjfrgetbcecntzjqdzcnixuddzmejf",
        "Content-Type": "application/json"
    }

    payload = {
        "model" : "Qwen/Qwen3-8B",
        "messages" : [{
            "role" : "user",
            "content" : f"你是一个智慧海洋牧场的AI助手，拥有丰富的相应各领域的知识。接下来用户将会询问你相关问题，请你耐心、全面、认真地回答:\n{message}"
        }],
        "stream": True,
        "max_tokens": 4096,
        "enable_thinking" : False,
        "stop": None,
        "temperature": 0.7,
        "top_p": 0.95,
        "top_k": 50,
        "frequency_penalty": 0.0,
        "n": 1,
        "response_format": {"type": "text"},
    }
    
    for attempt in range(max_retries):
        try:
            print(f"尝试请求 {attempt + 1}/{max_retries}...")
            response = requests.post(url, json=payload, headers=headers, timeout=timeout, stream=True)
            response.raise_for_status()
            
            return response
            
        except requests.exceptions.Timeout:
            print(f"请求超时，尝试 {attempt + 1}/{max_retries}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                print("超过最大重试次数，请求失败")
                raise
        except requests.exceptions.RequestException as e:
            print(f"网络请求异常: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                raise
        except Exception as e:
            print(f"未处理异常: {str(e)}")
            raise

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '')
        
        if not message:
            return jsonify({"error": "请提供消息内容"}), 400
        
        response = ai_communicate(message)
        
        def generate():
            try:
                for line in response.iter_lines():
                    if line:
                        line_text = line.decode('utf-8')
                        if line_text.startswith("data: "):
                            line_text = line_text[6:]
                        if line_text == "" or line_text == "[DONE]":
                            continue
                        try:
                            data = json.loads(line_text)
                            if "choices" in data and len(data["choices"]) > 0:
                                choice = data["choices"][0]
                                if "delta" in choice and "content" in choice["delta"]:
                                    content = choice["delta"]["content"]
                                    if content:
                                        yield f"data: {json.dumps({'content': content})}\n\n"
                                elif "message" in choice and "content" in choice["message"]:
                                    content = choice["message"]["content"]
                                    if content:
                                        yield f"data: {json.dumps({'content': content})}\n\n"
                        except json.JSONDecodeError:
                            print(f"无法解析响应行: {line_text}")
                
                yield f"data: {json.dumps({'content': '', 'finished': True})}\n\n"
            except Exception as e:
                print(f"流处理中发生错误: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return Response(generate(), mimetype='text/event-stream')
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/visualize-water', methods=['POST'])
def handle_water_visualization():
    try:
        file_path = request.json.get('file_path')
        target_column = request.json.get('target_column')
        if not file_path:
            return jsonify({"error": "未提供文件路径"}), 400

        line_chart_data, pie_chart_data = DataVisualization.visualize_water_quality(file_path, target_column)
        # 添加日志输出
        print("后端返回的折线图数据:", line_chart_data)
        print("后端返回的饼图数据:", pie_chart_data)

        return jsonify({
            "line_chart_data": line_chart_data,
            "pie_chart_data": pie_chart_data
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 添加鱼类数据路由
@app.route('/visualize-fish', methods=['POST'])
def handle_fish_visualization():
    try:
        fixed_path = 'config/软件工程大作业数据/Fish.csv'

        # 读取数据
        df = DataVisualization.read_fish_data(fixed_path)
        if df is None:
            return jsonify({"error": "数据文件不存在"}), 404

        # 处理单个鱼种请求
        species_name = request.form.get('species')
        single_species_data = None
        if species_name:
            # 筛选特定鱼种数据
            species_df = df[df['Species'] == species_name]
            if species_df.empty:
                return jsonify({"error": f"未找到鱼种 '{species_name}' 的数据"}), 400

            # 计算相关系数和统计信息
            correlation = species_df['Length1(cm)'].corr(species_df['Width(cm)'])
            stats = {
                'sample_size': len(species_df),
                'avg_length': species_df['Length1(cm)'].mean(),
                'avg_width': species_df['Width(cm)'].mean(),
                'correlation': correlation
            }

            # 准备散点图数据
            single_species_data = {
                'species': species_name,
                'data': species_df[['Length1(cm)', 'Width(cm)']].to_dict('records'),
                'stats': stats
            }

        # 准备柱状图数据：每种鱼类的平均重量
        bar_chart_data = df.groupby('Species')['Weight(g)'].mean().reset_index()

        # 准备散点图数据：所有鱼类的长度和宽度关系
        scatter_chart_data = df[['Species', 'Length1(cm)', 'Width(cm)']].to_dict('records')

        return jsonify({
            "bar_chart_data": bar_chart_data.to_dict('records'),
            "scatter_chart_data": scatter_chart_data,
            "single_species_data": single_species_data
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict-fish-length', methods=['POST'])
def handle_fish_length_prediction():
    try:
        if model is None:
            raise Exception("模型未初始化")

        # 从请求中获取体重、高度和宽度
        weight = float(request.json.get('weight'))
        height = float(request.json.get('height'))
        width = float(request.json.get('width'))

        # 进行体长预测
        length_prediction = model.predict([[weight, height, width]])[0]

        return jsonify({
            "length_prediction": length_prediction
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


VIDEO_FOLDER = os.path.join(os.path.dirname(__file__), 'config', 'videos')
print("当前工作目录:", os.getcwd())
print("视频目录绝对路径:", os.path.abspath(VIDEO_FOLDER))
print("视频目录是否存在:", os.path.exists(VIDEO_FOLDER))
@app.route('/api/videos', methods=['GET'])
def get_video_list():
    try:
        videos = [f for f in os.listdir(VIDEO_FOLDER) if f.endswith('.mp4')]
        return jsonify({'videos': videos})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/video/<filename>', methods=['GET'])
def stream_video(filename):
    video_path = os.path.join(VIDEO_FOLDER, filename)
    
    if not os.path.exists(video_path):
        return jsonify({'error': 'Video not found'}), 404

    # 获取文件基本信息
    file_size = os.path.getsize(video_path)
    mtime = os.path.getmtime(video_path)
    etag = f"{mtime}-{file_size}"

    # 处理ETag验证
    if_match = request.headers.get('If-Match')
    if if_match and if_match != etag:
        return Response(status=412)  # Precondition Failed

    # 处理范围请求
    range_header = request.headers.get('Range')
    start, end = 0, None
    status_code = 200
    
    if range_header:
        # 解析范围请求 (示例处理第一个字节范围)
        ranges = range_header.replace('bytes=', '').split('-')
        start = int(ranges[0])
        end = int(ranges[1]) if ranges[1] else file_size - 1
        length = end - start + 1
        status_code = 206
        
        # 检查范围有效性
        if start >= file_size or end >= file_size:
            return Response(
                status=416,
                headers={
                    'Content-Range': f'bytes */{file_size}',
                    'Access-Control-Expose-Headers': 'Content-Range'
                }
            )

    # 构建响应
    def generate():
        with open(video_path, 'rb') as f:
            f.seek(start)
            remaining = length if status_code == 206 else file_size
            while remaining > 0:
                bytes_to_read = min(4096, remaining)
                data = f.read(bytes_to_read)
                if not data:
                    break
                remaining -= len(data)
                yield data

    response = Response(
        generate(),
        status=status_code,
        mimetype='video/mp4',
        direct_passthrough=True
    )

    # 设置响应头
    response.headers.add('Accept-Ranges', 'bytes')
    response.headers.add('ETag', etag)
    response.headers.add('Cache-Control', 'no-store')
    
    if status_code == 206:
        response.headers.add('Content-Range', 
                           f'bytes {start}-{end}/{file_size}')
        response.headers.add('Content-Length', str(end - start + 1))
    else:
        response.headers.add('Content-Length', str(file_size))
    
    # CORS关键头
    response.headers.add('Access-Control-Expose-Headers', 
                        'Content-Range, Content-Length, ETag')
    
    return response

# === 水质数据异常检测相关接口（基于数据库读取）===

@app.route('/api/water-quality/thresholds', methods=['GET'])
def get_anomaly_thresholds():
    """获取所有水质指标的异常阈值"""
    try:
        query = "SELECT * FROM anomaly_thresholds"
        thresholds = execute_query(query)
        return jsonify(thresholds)
    except Exception as e:
        return jsonify({"error": f"获取阈值失败: {str(e)}"}), 500

@app.route('/api/water-quality/thresholds', methods=['PUT'])
def update_anomaly_thresholds():
    """更新水质指标的异常阈值"""
    try:
        data = request.json
        if not data or not isinstance(data, list):
            return jsonify({"error": "请提供有效的阈值数据"}), 400
        
        engine = get_db_engine()
        for threshold in data:
            parameter = threshold.get('parameter')
            if not parameter:
                continue
                
            lower_threshold = threshold.get('lower_threshold')
            upper_threshold = threshold.get('upper_threshold')
            
            # 检查参数是否存在
            check_query = "SELECT id FROM anomaly_thresholds WHERE parameter = %s"
            result = execute_query(check_query, (parameter,))
            if not result:
                return jsonify({"error": f"未找到参数: {parameter} 的阈值"}), 404
                
            # 更新阈值
            update_query = """
            UPDATE anomaly_thresholds 
            SET lower_threshold = %s, upper_threshold = %s 
            WHERE parameter = %s
            """
            execute_query(update_query, (lower_threshold, upper_threshold, parameter), fetch=False)
        
        return jsonify({"message": "阈值更新成功"})
    except Exception as e:
        return jsonify({"error": f"更新阈值失败: {str(e)}"}), 500

@app.route('/api/water-quality/detect-anomalies', methods=['GET'])
def detect_water_quality_anomalies():
    """从数据库读取水质数据并检测异常（优化数据格式）"""
    try:
        print("===== 开始处理水质异常检测请求 =====")
        
        # 获取查询参数
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        site_id = request.args.get('site_id')
        
        print(f"请求参数 - start_date: {start_date}, end_date: {end_date}, site_id: {site_id}")
        
        # 构建查询语句
        query = "SELECT * FROM water_quality"
        params = []
        conditions = []
        
        if start_date:
            conditions.append("monitoring_date >= %s")
            params.append(start_date)
        if end_date:
            conditions.append("monitoring_date <= %s")
            params.append(end_date)
        if site_id:
            conditions.append("site_id = %s")
            params.append(site_id)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        print(f"执行查询: {query}, 参数: {params}")
        
        # 读取数据库数据
        water_quality_data = execute_query(query, params)
        print(f"数据库查询结果 - 数据条数: {len(water_quality_data)}")
        
        if not water_quality_data:
            print("未找到水质数据，返回空结果")
            return jsonify({
                "message": "未找到水质数据",
                "anomalies": [],
                "total_records": 0,
                "anomaly_count": 0
            })
        
        # 加载阈值
        thresholds = execute_query("SELECT * FROM anomaly_thresholds")
        threshold_map = {t['parameter']: t for t in thresholds}
        print(f"加载阈值 - 阈值数量: {len(thresholds)}")
        
        # 定义参数映射（数据库字段到前端显示名称的映射）
        param_mapping = {
            'water_temp': 'water_temp',
            'ph': 'ph',
            'dissolved_oxygen': 'dissolved_oxygen',
            'conductivity': 'conductivity',
            'turbidity': 'turbidity',
            'cod_mn': 'cod_mn',
            'ammonia_nitrogen': 'ammonia_nitrogen',
            'total_phosphorus': 'total_phosphorus',
            'total_nitrogen': 'total_nitrogen',
            'chla': 'chla',
            'algae_density': 'algae_density'
        }
        
        # 检测异常
        anomalies = []
        anomaly_count = 0
        
        for record in water_quality_data:
            is_anomalous = False
            anomaly_reasons = []
            parameters = {}  # 用于存储格式化后的参数值
            
            # 检查每个参数是否超出阈值
            for db_param, threshold_param in param_mapping.items():
                if threshold_param in threshold_map:
                    threshold = threshold_map[threshold_param]
                    lower = threshold['lower_threshold']
                    upper = threshold['upper_threshold']
                    value = record.get(db_param)
                    
                    # 格式化参数值并存储到parameters对象
                    formatted_value = format_water_quality_value(value)
                    parameters[db_param] = formatted_value
                    
                    if formatted_value is not None:
                        try:
                            float_value = float(formatted_value)
                            if float_value < lower or float_value > upper:
                                is_anomalous = True
                                anomaly_reasons.append(f"{threshold_param}值{float_value}超出阈值[{lower}, {upper}]")
                                print(f"检测到异常 - 记录ID: {record['record_id']}, 参数: {threshold_param}, 值: {float_value}, 阈值: [{lower}, {upper}]")
                        except (ValueError, TypeError) as e:
                            print(f"参数转换错误 - 参数: {threshold_param}, 值: {value}, 错误: {str(e)}")
            
            # 记录异常数据
            if is_anomalous:
                anomaly_count += 1
                anomalies.append({
                    "record_id": record["record_id"],
                    "site_id": record["site_id"],
                    "monitoring_date": str(record["monitoring_date"]),
                    "monitoring_time": str(record["monitoring_time"]) if record["monitoring_time"] else "",
                    "section_name": record["section_name"],
                    "anomaly_reasons": anomaly_reasons,
                    "parameters": parameters  # 使用格式化后的参数值
                })
        
        print(f"异常检测完成 - 总数据量: {len(water_quality_data)}, 异常数量: {anomaly_count}")
        
        # 打印第一条异常数据的parameters（用于调试）
        if anomalies:
            print(f"第一条异常数据的parameters: {anomalies[0]['parameters']}")
        
        response_data = {
            "message": f"检测完成，共{len(water_quality_data)}条数据，{anomaly_count}条异常",
            "anomalies": anomalies,
            "total_records": len(water_quality_data),
            "anomaly_count": anomaly_count
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"数据检测异常: {str(e)}", exc_info=True)
        return jsonify({"error": f"数据检测失败: {str(e)}"}), 500
    finally:
        print("===== 水质异常检测请求处理完成 =====")

def format_water_quality_value(value):
    """优化后的水质参数值格式化函数"""
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            return float(stripped)
        except ValueError:
            return stripped  # 保留原始字符串（如"异常"等描述）
    return float(value) if not isinstance(value, bool) else None

def collect_environment():
    """收集测试环境信息"""
    env_info = {
        "timestamp": datetime.now().isoformat(),
        "system": {
            "platform": platform.platform(),
            "processor": platform.processor(),
            "architecture": platform.architecture()[0],
            "hostname": socket.gethostname(),
            "ip_address": socket.gethostbyname(socket.gethostname()) if hasattr(socket, 'gethostbyname') else "N/A",
            "cpu_cores": os.cpu_count(),
        },
        "software": {
            "python": sys.version,
            "packages": {}
        },
        "database": {
            "type": "MySQL",
            "version": get_mysql_version()
        },
        "app_config": {
            "debug": current_app.config.get('DEBUG', False) if current_app else False,
            "testing": current_app.config.get('TESTING', False) if current_app else False,
            "environment": current_app.config.get('ENV', 'production') if current_app else 'unknown'
        }
    }
    
    # 使用 psutil 获取跨平台内存信息
    try:
        import psutil
        mem = psutil.virtual_memory()
        env_info["system"]["memory_total_gb"] = round(mem.total / (1024**3), 2)
        env_info["system"]["memory_available_gb"] = round(mem.available / (1024**3), 2)
        env_info["system"]["memory_used_percent"] = mem.percent
    except ImportError:
        # 如果 psutil 不可用，提供默认值
        env_info["system"]["memory_total_gb"] = "N/A (install psutil)"
        env_info["system"]["memory_available_gb"] = "N/A"
        env_info["system"]["memory_used_percent"] = "N/A"
    except Exception as e:
        env_info["system"]["memory_total_gb"] = f"Error: {str(e)}"
    
    # 获取包版本 - 更健壮的实现
    packages_to_collect = {
        "flask": "Flask",
        "mysql-connector-python": "mysql.connector",
        "flask-cors": "flask_cors",
        "python-dotenv": "dotenv",
        "waitress": "waitress",
        "psutil": "psutil"
    }
    
    installed_packages = {pkg.key.lower(): pkg for pkg in pkg_resources.working_set}
    
    for display_name, module_name in packages_to_collect.items():
        # 尝试通过显示名称匹配
        if display_name.lower() in installed_packages:
            env_info["software"]["packages"][display_name] = installed_packages[display_name.lower()].version
        # 尝试通过模块名称匹配
        elif module_name.lower() in installed_packages:
            env_info["software"]["packages"][display_name] = installed_packages[module_name.lower()].version
        else:
            # 尝试直接导入模块获取版本
            try:
                module = __import__(module_name)
                version = getattr(module, "__version__", "unknown")
                env_info["software"]["packages"][display_name] = version
            except ImportError:
                env_info["software"]["packages"][display_name] = "未安装"
    
    return env_info

def get_mysql_version():
    """获取MySQL版本"""
    try:
        conn = mysql.connector.connect(
            host=os.environ.get('MYSQL_HOST', 'localhost'),
            user=os.environ.get('MYSQL_USER', 'root'),
            password=os.environ.get('MYSQL_PASSWORD', '')
        )
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return version
    except Exception as e:
        return f"Error: {str(e)}"

def generate_environment_report(format="markdown"):
    """生成环境报告"""
    env_data = collect_environment()
    
    if format == "markdown":
        return generate_markdown_report(env_data)
    elif format == "json":
        return json.dumps(env_data, indent=2)
    else:
        return "Unsupported format"

def generate_markdown_report(env_data):
    """生成Markdown格式报告"""
    report = f"# 智慧海洋牧场系统 - 测试环境报告\n\n"
    report += f"**生成时间**: {env_data['timestamp']}\n\n"
    
    report += "## 系统环境\n"
    report += f"- **平台**: {env_data['system']['platform']}\n"
    report += f"- **处理器**: {env_data['system']['processor']}\n"
    report += f"- **架构**: {env_data['system']['architecture']}\n"
    report += f"- **主机名**: {env_data['system']['hostname']}\n"
    report += f"- **IP地址**: {env_data['system']['ip_address']}\n"
    report += f"- **CPU核心**: {env_data['system']['cpu_cores']}\n"
    report += f"- **内存(GB)**: {env_data['system']['memory_total_gb']}\n\n"
    
    report += "## 软件环境\n"
    report += f"- **Python**: {env_data['software']['python']}\n"

    
    report += "\n### Python包版本\n"
    for pkg, version in env_data['software']['packages'].items():
        report += f"- **{pkg}**: {version}\n"
    report += "\n"
    
    report += "## 数据库\n"
    report += f"- **类型**: {env_data['database']['type']}\n"
    report += f"- **版本**: {env_data['database']['version']}\n\n"
    
    report += "## 应用配置\n"
    report += f"- **调试模式**: {'开启' if env_data['app_config']['debug'] else '关闭'}\n"
    report += f"- **测试模式**: {'开启' if env_data['app_config']['testing'] else '关闭'}\n"
    report += f"- **环境**: {env_data['app_config']['environment']}\n"
    
    return report

# 添加API端点
@app.route('/api/test-environment', methods=['GET'])
def get_test_environment():
    format = request.args.get('format', 'markdown')
    try:
        report = generate_environment_report(format)
        
        if format == 'markdown':
            return Response(report, mimetype='text/markdown')
        elif format == 'json':
            return jsonify(json.loads(report))
        else:
            return jsonify({"error": "不支持的格式"}), 400
            
    except Exception as e:
        current_app.logger.error(f"生成环境报告失败: {str(e)}")
        return jsonify({"error": str(e)}), 500

# 当直接运行此文件时执行
# if __name__ == "__main__":
#     app.run(host='0.0.0.0', port=3001, debug=True)