"""
主服务器文件
负责设置Flask应用、中间件和路由
"""

# 导入必要的依赖
from flask import Flask, jsonify, request, send_file, Response,send_from_directory  # 确保包含Response
from flask_cors import CORS
from dotenv import load_dotenv
import config.DataVisualization as DataVisualization
from datetime import datetime
import os
from flask import Flask, request, jsonify
import joblib

# 加载环境变量
load_dotenv()


# 创建Flask应用实例

#生产环境使用下面
# app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
#测试使用下面
app = Flask(__name__)
PORT = int(os.environ.get('PORT', 3001))  # 设置端口，优先使用环境变量中的PORT，否则默认为3001

# 立即初始化模型
model = joblib.load('fish_length_model.pkl')

# 配置中间件
# 配置更宽松的CORS规则
CORS(app, 
     origins=["http://localhost:3000"],  
     allow_headers=["Content-Type", "x-auth-token", "Access-Control-Allow-Origin"],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     expose_headers=["Content-Type", "x-auth-token"]
    )

# 连接到MongoDB数据库
from config.database import init_db
# 初始化数据库连接
db = init_db()

# 导入路由和初始化函数
from routes.auth import auth_bp, init_indexes

# 注册蓝图(Blueprint)路由
app.register_blueprint(auth_bp, url_prefix='/api')  # 所有认证相关的路由都以/api为前缀

# 调试的时候注释掉下面三行
# 生产环境的时候使用下面三行
# @app.route('/')
# def serve():
#     return send_from_directory(app.static_folder, 'index.html')

# 健康检查路由
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "API服务器运行正常"})

# 测试路由，返回简单的JSON数据
@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({"message": "测试成功", "success": True})

# 初始化数据库索引
init_indexes()

# 404错误处理 - 处理未匹配的路由
@app.errorhandler(404)
def not_found(e):
    return jsonify({"message": "路由不存在"}), 404

# 全局错误处理 - 捕获并处理应用程序中的错误
@app.errorhandler(500)
def server_error(e):
    app.logger.error(str(e))  # 在应用日志中记录错误
    return jsonify({"message": "服务器错误", "error": str(e)}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    """全局异常处理器，确保所有错误都返回JSON格式"""
    app.logger.error(f"未捕获的异常: {str(e)}")
    return jsonify({
        "message": "服务器内部错误",
        "error": str(e)
    }), 500

@app.route('/visualize-water', methods=['POST'])
def handle_water_visualization():
    try:
        file_path = request.json.get('file_path')
        target_column = request.json.get('target_column')
        if not file_path:
            return jsonify({"error": "未提供文件路径"}), 400

##########################
        line_chart_data, pie_chart_data = DataVisualization.visualize_water_quality(file_path, target_column)
        # 添加日志输出
        print("后端返回的折线图数据:", line_chart_data)
        print("后端返回的饼图数据:", pie_chart_data)

        return jsonify({
            "line_chart_data": line_chart_data,
            "pie_chart_data": pie_chart_data
        })



###########################
        # 调用现有可视化函数
        line_chart, pie_chart = DataVisualization.visualize_water_quality(file_path, target_column)

        response = {
            "line_chart": line_chart if line_chart else None,
            "pie_chart": pie_chart if pie_chart else None
        }
        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 添加鱼类数据路由
@app.route('/visualize-fish', methods=['POST'])
def handle_fish_visualization():
    try:
        # 固定文件路径
        fixed_path = 'config/软件工程大作业数据/Fish.csv'
        
        # 读取数据
        df = DataVisualization.read_fish_data(fixed_path)
        if df is None:
            return jsonify({"error": "数据文件不存在"}), 404
        # 处理单个鱼种请求（新增逻辑）
        species_name = request.form.get('species')  # 从POST表单获取鱼种名称
        single_scatter = None
        if species_name:
            single_scatter = DataVisualization.generate_single_species_scatter(df, species_name)
            if not single_scatter:
                return jsonify({"error": f"未找到鱼种 '{species_name}' 的数据"}), 400
        # 生成图表
        bar_chart = DataVisualization.generate_bar_chart(df)
        scatter_chart = DataVisualization.generate_scatter_chart(df)
        
        return jsonify({
            "bar_chart": bar_chart,
            "scatter_chart": scatter_chart,
            "single_species_scatter": single_scatter  # 新增返回字段
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
# 当直接运行此文件时执行
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3001, debug=True)