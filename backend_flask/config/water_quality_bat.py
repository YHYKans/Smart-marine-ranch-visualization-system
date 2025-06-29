import os
import json
import re
import mysql.connector
from datetime import datetime, timedelta
import traceback

def import_water_quality_data():
    # 数据库配置
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '123456',
        'database': 'water_quality_monitoring'
    }
    
    # 水质数据文件夹路径
    data_dir = r"软件工程大作业数据\水质数据"
    
    try:
        # 连接数据库
        print("连接数据库...")
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print("数据库连接成功")
        
        # 检查monitoring_site表是否存在
        cursor.execute("SHOW TABLES LIKE 'monitoring_site'")
        if not cursor.fetchone():
            print("错误: monitoring_site表不存在，请先创建表结构")
            return
        
        # 创建站点缓存 (province, river_basin, section_name) -> site_id
        site_cache = {}
        cursor.execute("SELECT site_id, province, river_basin, section_name FROM monitoring_site")
        for row in cursor.fetchall():
            site_id, province, river_basin, section_name = row
            key = (province, river_basin, section_name)
            site_cache[key] = site_id
        
        # 统计变量
        total_months = 0
        total_files = 0
        total_records = 0
        new_sites_created = 0
        
        print(f"开始处理水质数据目录: {data_dir}")
        
        # 1. 遍历所有月份文件夹 (格式: YYYY-MM)
        for month_folder in os.listdir(data_dir):
            month_path = os.path.join(data_dir, month_folder)
            if not os.path.isdir(month_path):
                continue
                
            # 尝试解析月份文件夹名称 (如 "2020-05")
            if not re.match(r"\d{4}-\d{2}", month_folder):
                print(f"跳过无效月份的文件夹: {month_folder}")
                continue
            
            try:
                year, month = map(int, month_folder.split('-'))
                base_date = datetime(year, month, 1).date()
                total_months += 1
                print(f"\n处理月份: {year}-{month:02d} ({base_date})")
            except (ValueError, IndexError):
                print(f"跳过无效月份的文件夹: {month_folder}")
                continue
            
            # 2. 遍历当前月份文件夹下的所有JSON文件
            for json_file in os.listdir(month_path):
                if not json_file.endswith('.json'):
                    continue
                    
                file_path = os.path.join(month_path, json_file)
                total_files += 1
                
                try:
                    # 3. 读取并解析JSON文件
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # 验证JSON结构
                    if 'tbody' not in data or not isinstance(data['tbody'], list):
                        print(f"文件 {json_file} 格式无效: 缺少有效的tbody数据")
                        continue
                    
                    tbody = data['tbody']
                    print(f"文件 {json_file}: 找到 {len(tbody)} 条记录")
                    
                    # 4. 处理文件中的所有记录
                    records_to_insert = []
                    skipped_records = 0
                    
                    for record_index, record in enumerate(tbody):
                        # 验证记录格式
                        if len(record) < 14:  # 至少14个字段
                            skipped_records += 1
                            continue
                        
                        try:
                            # 解析记录字段
                            province = record[0].strip() if record[0] is not None else "未知省份"
                            river_basin = record[1].strip() if record[1] is not None else "未知流域"
                            section_name = record[2].strip() if record[2] is not None else "未知断面"
                            
                            # 修复: 安全处理时间字段
                            date_time_str = record[3]
                            monitoring_date = base_date
                            monitoring_time = None
                            
                            if date_time_str is not None:
                                # 检查是否是字符串类型
                                if isinstance(date_time_str, str):
                                    # 处理带空格的时间格式
                                    if " " in date_time_str:
                                        date_str, time_str = date_time_str.split(" ", 1)
                                        monitoring_time = time_str
                                        
                                        # 尝试解析日期部分 (月-日)
                                        if "-" in date_str:
                                            try:
                                                month_part, day_part = date_str.split("-")
                                                month_part = int(month_part)
                                                day_part = int(day_part)
                                                monitoring_date = datetime(year, month_part, day_part).date()
                                            except:
                                                pass
                                    else:
                                        # 没有空格，尝试直接作为时间处理
                                        monitoring_time = date_time_str
                            
                            water_grade = record[4].strip() if record[4] is not None else ""
                            
                            # 解析HTML值中的原始值
                            def extract_value(html_str):
                                """从HTML中提取原始值"""
                                if html_str is None or html_str in ["", "--", "NA"]:
                                    return None
                                
                                # 如果是数字，直接返回
                                if isinstance(html_str, (int, float)):
                                    return float(html_str)
                                
                                # 如果是字符串，尝试提取原始值
                                if isinstance(html_str, str):
                                    # 尝试提取原始值
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
                                return None
                            
                            # 提取各参数值（添加安全索引检查）
                            values = {
                                'water_temp': extract_value(record[5]) if len(record) > 5 else None,
                                'ph': extract_value(record[6]) if len(record) > 6 else None,
                                'dissolved_oxygen': extract_value(record[7]) if len(record) > 7 else None,
                                'conductivity': extract_value(record[8]) if len(record) > 8 else None,
                                'turbidity': extract_value(record[9]) if len(record) > 9 else None,
                                'cod_mn': extract_value(record[10]) if len(record) > 10 else None,
                                'ammonia_nitrogen': extract_value(record[11]) if len(record) > 11 else None,
                                'total_phosphorus': extract_value(record[12]) if len(record) > 12 else None,
                                'total_nitrogen': extract_value(record[13]) if len(record) > 13 else None,
                                'chla': extract_value(record[14]) if len(record) > 14 else None,
                                'algae_density': extract_value(record[15]) if len(record) > 15 else None,
                                'site_status': record[16].strip() if len(record) > 16 and record[16] is not None else "正常",
                            }
                            
                            # 5. 处理监测点
                            site_key = (province, river_basin, section_name)
                            site_id = None
                            
                            if site_key in site_cache:
                                site_id = site_cache[site_key]
                            else:
                                # 创建新监测点
                                site_code = f"{province[:2]}{river_basin[:2]}{section_name[:2]}{len(site_cache)}"
                                cursor.execute(
                                    "INSERT INTO monitoring_site (site_code, site_name, province, river_basin, section_name, established_date) "
                                    "VALUES (%s, %s, %s, %s, %s, %s)",
                                    (site_code, section_name, province, river_basin, section_name, base_date)
                                )
                                site_id = cursor.lastrowid
                                site_cache[site_key] = site_id
                                new_sites_created += 1
                                print(f"创建新监测点: {province}-{river_basin}-{section_name} (ID: {site_id})")
                            
                            # 6. 准备水质记录
                            records_to_insert.append((
                                site_id,
                                monitoring_date,
                                monitoring_time,
                                province,
                                river_basin,
                                section_name,
                                water_grade,
                                values['water_temp'],
                                values['ph'],
                                values['dissolved_oxygen'],
                                values['conductivity'],
                                values['turbidity'],
                                values['cod_mn'],
                                values['ammonia_nitrogen'],
                                values['total_phosphorus'],
                                values['total_nitrogen'],
                                values['chla'],
                                values['algae_density'],
                                values['site_status'],
                                file_path
                            ))
                            
                        except Exception as record_error:
                            # 记录处理错误，但不中断整个文件
                            print(f"  记录 {record_index} 处理出错: {str(record_error)}")
                            skipped_records += 1
                            continue
                    
                    # 7. 批量插入水质数据
                    if records_to_insert:
                        insert_query = """
                        INSERT INTO water_quality (
                            site_id, monitoring_date, monitoring_time, 
                            province, river_basin, section_name, water_grade,
                            water_temp, ph, dissolved_oxygen, conductivity, turbidity,
                            cod_mn, ammonia_nitrogen, total_phosphorus, total_nitrogen,
                            chla, algae_density, site_status, original_file
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """
                        
                        # 分批插入，每批次500条记录
                        batch_size = 500
                        for i in range(0, len(records_to_insert), batch_size):
                            batch = records_to_insert[i:i + batch_size]
                            cursor.executemany(insert_query, batch)
                        
                        inserted_count = len(records_to_insert)
                        total_records += inserted_count
                        print(f"  - 插入 {inserted_count} 条记录 ({skipped_records} 条记录被跳过)")
                    else:
                        print(f"  - 没有有效记录可导入")
                    
                    # 提交当前文件的事务
                    conn.commit()
                
                except Exception as file_error:
                    print(f"处理文件 {json_file} 时出错: {str(file_error)}")
                    traceback.print_exc()
                    conn.rollback()  # 回滚当前文件的事务
        
        # 最终统计
        print("\n导入完成!")
        print(f"处理月份文件夹数: {total_months}")
        print(f"处理JSON文件数: {total_files}")
        print(f"创建新监测点: {new_sites_created} 个")
        print(f"导入水质记录总数: {total_records}")
        
    except mysql.connector.Error as err:
        if err.errno == mysql.connector.errorcode.ER_TABLE_EXISTS_ERROR:
            print("表已存在，继续执行...")
        else:
            print(f"MySQL错误: {err}")
    except Exception as e:
        print(f"处理过程中出错: {str(e)}")
        traceback.print_exc()
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("数据库连接已关闭")

if __name__ == "__main__":
    print("="*60)
    print(f"水质数据导入程序 - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("="*60)
    import_water_quality_data()