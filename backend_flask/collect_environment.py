import platform
import socket
import os
import subprocess
import sys
import datetime
import pkg_resources
import json
import mysql.connector
from flask import current_app

def get_system_info():
    """获取系统硬件信息"""
    return {
        "platform": platform.platform(),
        "processor": platform.processor(),
        "architecture": platform.architecture()[0],
        "hostname": socket.gethostname(),
        "ip_address": socket.gethostbyname(socket.gethostname()),
        "cpu_cores": os.cpu_count(),
        "memory_gb": round(os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES') / (1024.**3), 1)
    }

def get_software_versions():
    """获取软件版本信息"""
    versions = {
        "python": sys.version,
        "flask": current_app.config.get("VERSION", "unknown"),
        "mysql": get_mysql_version(),
        "redis": get_redis_version(),
        "nginx": get_nginx_version(),
        "packages": {}
    }
    
    # 获取Python包版本
    packages = ["flask", "mysql-connector-python", "redis", "gunicorn", "pandas"]
    for pkg in pkg_resources.working_set:
        if pkg.key in packages:
            versions["packages"][pkg.key] = pkg.version
    
    return versions

def get_mysql_version():
    """获取MySQL版本"""
    try:
        conn = mysql.connector.connect(
            host=current_app.config['MYSQL_HOST'],
            user=current_app.config['MYSQL_USER'],
            password=current_app.config['MYSQL_PASSWORD']
        )
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return version
    except Exception:
        return "Not available"

def get_redis_version():
    """获取Redis版本（简化版）"""
    try:
        import redis
        r = redis.Redis(
            host=current_app.config.get('REDIS_HOST', 'localhost'),
            port=current_app.config.get('REDIS_PORT', 6379)
        )
        return r.info()['redis_version']
    except Exception:
        return "Not available"

def get_nginx_version():
    """获取Nginx版本"""
    try:
        result = subprocess.run(['nginx', '-v'], stderr=subprocess.PIPE, text=True)
        return result.stderr.split('/')[-1].strip()
    except Exception:
        return "Not available"

def get_network_info():
    """获取网络信息"""
    return {
        "bandwidth": current_app.config.get('NETWORK_BANDWIDTH', "1Gbps"),
        "latency": current_app.config.get('NETWORK_LATENCY', "< 50ms"),
        "topology": "Client → Firewall → Load Balancer → Web Server → App Server → DB Cluster"
    }

def get_test_data_info():
    """获取测试数据信息"""
    return {
        "water_quality_records": 250000,
        "device_status_records": 120000,
        "users": 5000,
        "data_distribution": {
            "normal": "85%",
            "boundary": "10%",
            "anomaly": "5%"
        }
    }

def collect_environment():
    """收集所有环境信息"""
    return {
        "timestamp": datetime.datetime.now().isoformat(),
        "system": get_system_info(),
        "software": get_software_versions(),
        "network": get_network_info(),
        "test_data": get_test_data_info(),
        "test_tools": {
            "functional": "Selenium 4.7.0, Pytest 7.2.0",
            "performance": "Locust 2.15.1, JMeter 5.5",
            "security": "OWASP ZAP 2.12.0",
            "api": "Postman 10.10.0, Requests 2.28.1"
        }
    }

def generate_environment_report(format="markdown"):
    """生成环境报告"""
    env_data = collect_environment()
    
    if format == "markdown":
        return generate_markdown_report(env_data)
    elif format == "html":
        return generate_html_report(env_data)
    elif format == "json":
        return json.dumps(env_data, indent=2)
    else:
        return "Unsupported format"

def generate_markdown_report(env_data):
    """生成Markdown格式报告"""
    report = f"# 测试环境报告\n\n"
    report += f"**生成时间**: {env_data['timestamp']}\n\n"
    
    report += "## 系统环境\n"
    report += f"- **平台**: {env_data['system']['platform']}\n"
    report += f"- **处理器**: {env_data['system']['processor']}\n"
    report += f"- **架构**: {env_data['system']['architecture']}\n"
    report += f"- **主机名**: {env_data['system']['hostname']}\n"
    report += f"- **IP地址**: {env_data['system']['ip_address']}\n"
    report += f"- **CPU核心**: {env_data['system']['cpu_cores']}\n"
    report += f"- **内存(GB)**: {env_data['system']['memory_gb']}\n\n"
    
    report += "## 软件环境\n"
    report += f"- **Python**: {env_data['software']['python']}\n"
    report += f"- **Flask**: {env_data['software']['flask']}\n"
    report += f"- **MySQL**: {env_data['software']['mysql']}\n"
    report += f"- **Redis**: {env_data['software']['redis']}\n"
    report += f"- **Nginx**: {env_data['software']['nginx']}\n"
    
    report += "\n### Python包版本\n"
    for pkg, version in env_data['software']['packages'].items():
        report += f"- **{pkg}**: {version}\n"
    report += "\n"
    
    report += "## 网络环境\n"
    report += f"- **带宽**: {env_data['network']['bandwidth']}\n"
    report += f"- **延迟**: {env_data['network']['latency']}\n"
    report += f"- **拓扑**: \n```\n{env_data['network']['topology']}\n```\n\n"
    
    report += "## 测试数据\n"
    report += f"- **水质记录**: {env_data['test_data']['water_quality_records']:,}\n"
    report += f"- **设备状态记录**: {env_data['test_data']['device_status_records']:,}\n"
    report += f"- **用户数据**: {env_data['test_data']['users']:,}\n"
    report += "- **数据分布**:\n"
    for category, percent in env_data['test_data']['data_distribution'].items():
        report += f"  - {category.capitalize()}: {percent}\n"
    report += "\n"
    
    report += "## 测试工具\n"
    for category, tools in env_data['test_tools'].items():
        report += f"- **{category.capitalize()}测试**: {tools}\n"
    
    return report

def generate_html_report(env_data):
    """生成HTML格式报告"""
    # 简化的HTML报告生成，实际应用中可更完善
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>测试环境报告</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1 {{ color: #2c3e50; }}
            h2 {{ color: #3498db; border-bottom: 1px solid #eee; padding-bottom: 5px; }}
            .card {{ background: #f9f9f9; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 20px; }}
            .section {{ margin-bottom: 30px; }}
            .timestamp {{ color: #7f8c8d; font-size: 0.9em; margin-bottom: 20px; }}
        </style>
    </head>
    <body>
        <h1>测试环境报告</h1>
        <div class="timestamp">生成时间: {env_data['timestamp']}</div>
        
        <div class="section">
            <h2>系统环境</h2>
            <div class="card">
                <p><strong>平台</strong>: {env_data['system']['platform']}</p>
                <p><strong>处理器</strong>: {env_data['system']['processor']}</p>
                <p><strong>架构</strong>: {env_data['system']['architecture']}</p>
                <p><strong>主机名</strong>: {env_data['system']['hostname']}</p>
                <p><strong>IP地址</strong>: {env_data['system']['ip_address']}</p>
                <p><strong>CPU核心</strong>: {env_data['system']['cpu_cores']}</p>
                <p><strong>内存(GB)</strong>: {env_data['system']['memory_gb']}</p>
            </div>
        </div>
        
        <!-- 其他部分类似，为简洁省略 -->
        
    </body>
    </html>
    """
    return html