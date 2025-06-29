import os
import csv
import mysql.connector
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt
import platform

# 设置中文字体支持
def set_chinese_font():
    """根据操作系统设置中文字体"""
    system = platform.system()
    if system == 'Windows':
        plt.rcParams['font.sans-serif'] = ['SimHei']  # Windows使用黑体
    elif system == 'Darwin':
        plt.rcParams['font.sans-serif'] = ['Arial Unicode MS']  # Mac使用苹果字体
    else:
        plt.rcParams['font.sans-serif'] = ['WenQuanYi Micro Hei']  # Linux使用文泉驿
    plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题

# 设置中文字体
set_chinese_font()

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'water_quality_monitoring'
}

# 报告输出目录
REPORT_DIR = 'reports'
os.makedirs(REPORT_DIR, exist_ok=True)

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

def export_to_csv(data, filename, fieldnames=None):
    """将数据导出为CSV文件"""
    filepath = os.path.join(REPORT_DIR, filename)
    
    if not data:
        print(f"警告: {filename} 没有数据可导出")
        return None
    
    try:
        with open(filepath, 'w', newline='', encoding='utf-8-sig') as csvfile:
            if fieldnames is None:
                # 从第一条记录获取字段名
                fieldnames = list(data[0].keys())
            
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        
        print(f"已导出: {filepath}")
        return filepath
    except Exception as e:
        print(f"导出CSV时出错: {str(e)}")
        return None

def generate_water_quality_csv():
    """生成水质数据CSV报告"""
    print("开始生成水质数据报告...")
    
    try:
        # 获取所有水质数据
        water_query = """
        SELECT 
            w.record_id, w.monitoring_date, w.monitoring_time,
            w.province, w.river_basin, w.section_name,
            w.water_grade, w.water_temp, w.ph, w.dissolved_oxygen,
            w.conductivity, w.turbidity, w.cod_mn, w.ammonia_nitrogen,
            w.total_phosphorus, w.total_nitrogen, w.chla, w.algae_density,
            w.site_status, w.original_file,
            s.site_code
        FROM water_quality w
        JOIN monitoring_site s ON w.site_id = s.site_id
        """
        water_data = execute_query(water_query)
        
        # 导出为CSV
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"water_quality_data_{timestamp}.csv"
        csv_path = export_to_csv(water_data, filename)
        
        # 生成水质类别分布图
        if water_data:
            # 统计水质类别分布
            grade_counts = {}
            for record in water_data:
                grade = record['water_grade'] or '未知'
                grade_counts[grade] = grade_counts.get(grade, 0) + 1
            
            # 生成图表
            plt.figure(figsize=(10, 6))
            plt.bar(grade_counts.keys(), grade_counts.values(), color='skyblue')
            plt.title('水质类别分布')
            plt.xlabel('水质类别')
            plt.ylabel('记录数量')
            plt.tight_layout()
            
            # 保存图表
            plot_filename = f"water_grade_distribution_{timestamp}.png"
            plot_path = os.path.join(REPORT_DIR, plot_filename)
            plt.savefig(plot_path)
            plt.close()
            print(f"已生成水质类别分布图: {plot_path}")
        else:
            plot_path = None
        
        return csv_path, plot_path
    
    except Exception as e:
        print(f"生成水质报告时出错: {str(e)}")
        return None, None

def generate_fish_data_csv():
    """生成鱼类数据CSV报告"""
    print("开始生成鱼类数据报告...")
    
    try:
        # 获取所有鱼类物种数据
        species_query = "SELECT * FROM fish_species"
        species_data = execute_query(species_query)
        
        # 导出物种数据
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        species_filename = f"fish_species_{timestamp}.csv"
        species_csv = export_to_csv(species_data, species_filename)
        
        # 获取所有鱼类观测数据
        observations_query = """
        SELECT 
            o.observation_id, 
            o.body_weight, 
            o.body_length1, 
            o.body_length2, 
            o.body_length3, 
            o.body_height, 
            o.body_width, 
            o.created_at,
            s.common_name AS species
        FROM fish_observations o
        JOIN fish_species s ON o.species_id = s.species_id
        """
        observations_data = execute_query(observations_query)
        
        # 导出观测数据
        observations_filename = f"fish_observations_{timestamp}.csv"
        observations_csv = export_to_csv(observations_data, observations_filename)
        
        # 生成物种分布图
        if observations_data:
            # 统计物种分布
            species_counts = {}
            for record in observations_data:
                species = record['species'] or '未知'
                species_counts[species] = species_counts.get(species, 0) + 1
            
            # 生成图表
            plt.figure(figsize=(10, 6))
            plt.bar(species_counts.keys(), species_counts.values(), color='lightgreen')
            plt.title('鱼类物种分布')
            plt.xlabel('物种')
            plt.ylabel('观测数量')
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # 保存图表
            species_plot_filename = f"fish_species_distribution_{timestamp}.png"
            species_plot_path = os.path.join(REPORT_DIR, species_plot_filename)
            plt.savefig(species_plot_path)
            plt.close()
            print(f"已生成鱼类物种分布图: {species_plot_path}")
        else:
            species_plot_path = None
        
        return species_csv, observations_csv, species_plot_path
    
    except Exception as e:
        print(f"生成鱼类报告时出错: {str(e)}")
        return None, None, None

def generate_site_data_csv():
    """生成监测站点数据CSV报告"""
    print("开始生成监测站点报告...")
    
    try:
        # 获取所有监测站点数据
        site_query = "SELECT * FROM monitoring_site"
        site_data = execute_query(site_query)
        
        # 导出为CSV
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"monitoring_sites_{timestamp}.csv"
        csv_path = export_to_csv(site_data, filename)
        
        return csv_path
    
    except Exception as e:
        print(f"生成监测站点报告时出错: {str(e)}")
        return None

def generate_device_data_csv():
    """生成传感器设备数据CSV报告"""
    print("开始生成传感器设备报告...")
    
    try:
        # 获取所有传感器设备数据
        device_query = """
        SELECT 
            d.device_id, d.device_name, d.device_type, d.model, d.manufacturer,
            d.parameters, d.installation_date, d.last_calibration, d.status,
            s.site_code, s.site_name, s.province, s.river_basin, s.section_name
        FROM sensor_device d
        JOIN monitoring_site s ON d.site_id = s.site_id
        """
        device_data = execute_query(device_query)
        
        # 导出为CSV
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"sensor_devices_{timestamp}.csv"
        csv_path = export_to_csv(device_data, filename)
        
        return csv_path
    
    except Exception as e:
        print(f"生成传感器设备报告时出错: {str(e)}")
        return None

def generate_video_data_csv():
    """生成视频记录数据CSV报告"""
    print("开始生成视频记录报告...")
    
    try:
        # 获取所有视频记录数据
        video_query = """
        SELECT 
            v.record_id, v.record_datetime, v.duration, v.resolution,
            v.file_path, v.file_size, v.description,
            s.site_code, s.site_name, s.province, s.river_basin, s.section_name,
            d.device_name, d.device_type
        FROM video_record v
        JOIN monitoring_site s ON v.site_id = s.site_id
        LEFT JOIN sensor_device d ON v.device_id = d.device_id
        """
        video_data = execute_query(video_query)
        
        # 导出为CSV
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"video_records_{timestamp}.csv"
        csv_path = export_to_csv(video_data, filename)
        
        return csv_path
    
    except Exception as e:
        print(f"生成视频记录报告时出错: {str(e)}")
        return None

def generate_all_reports():
    """生成所有数据报告"""
    print("=" * 50)
    print(f"开始生成数据报告 - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)
    
    # 生成水质报告
    water_csv, water_plot = generate_water_quality_csv()
    
    # 生成鱼类报告
    species_csv, obs_csv, species_plot = generate_fish_data_csv()
    
    # 生成站点报告
    site_csv = generate_site_data_csv()
    
    # 生成设备报告
    device_csv = generate_device_data_csv()
    
    # 生成视频报告
    video_csv = generate_video_data_csv()
    
    print("\n报告生成完成:")
    if water_csv: print(f"- 水质数据: {water_csv}")
    if water_plot: print(f"- 水质类别分布图: {water_plot}")
    if species_csv: print(f"- 鱼类物种数据: {species_csv}")
    if obs_csv: print(f"- 鱼类观测数据: {obs_csv}")
    if species_plot: print(f"- 鱼类物种分布图: {species_plot}")
    if site_csv: print(f"- 监测站点数据: {site_csv}")
    if device_csv: print(f"- 传感器设备数据: {device_csv}")
    if video_csv: print(f"- 视频记录数据: {video_csv}")

if __name__ == '__main__':
    generate_all_reports()