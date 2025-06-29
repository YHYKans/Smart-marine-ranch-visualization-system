// src/pages/Underwater.js
import React, { useState, useRef, useEffect } from 'react';
import { Select, Button, Spin, message } from 'antd';
import { Line, Pie } from 'react-chartjs-2';
import moment from 'moment';
import Chart from 'chart.js/auto';
import { DownloadOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Option } = Select;

const transformChartData = (backendData, chartType) => {
  if (!backendData) return null;

  if (chartType === 'line') {
    return {
      labels: backendData.x || [],
      datasets: (backendData.datasets || []).map(dataset => ({
        ...dataset,
        data: dataset.data || [],
        borderColor: dataset.borderColor || '#36A2EB',
        backgroundColor: dataset.backgroundColor || 'rgba(54, 162, 235, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#36A2EB',
        pointHoverRadius: 6,
      }))
    };
  }

  if (chartType === 'pie') {
    return {
      labels: backendData.labels || [],
      datasets: [{
        data: backendData.values || [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1
      }]
    };
  }

  return null;
};

function Underwater() {
  const minDate = '2020-05-08';
  const maxDate = '2021-04-05';
  const [selectedDate, setSelectedDate] = useState(minDate);
  const [lineChartData, setLineChartData] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('');
  const [availableMetrics, setAvailableMetrics] = useState([
    '断面名称', '水温(℃)', 'pH(无量纲)', '溶解氧(mg/L)',
    '电导率(μS/cm)', '浊度(NTU)', '高锰酸盐指数(mg/L)',
    '氨氮(mg/L)', '总磷(mg/L)', '总氮(mg/L)', '叶绿素α(mg/L)', '藻密度(cells/L)'
  ]);

  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineCanvasRef = useRef(null);
  const pieCanvasRef = useRef(null);

  const generateFilePath = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `config/软件工程大作业数据/水质数据/${year}-${month}/${year}-${month}-${day}.json`;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);
    setLineChartData(null);
    setPieChartData(null);

    try {
      const filePath = generateFilePath(selectedDate);
      const response = await fetch('http://localhost:3001/visualize-water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath, target_column: selectedMetric })
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setLineChartData(transformChartData(data.line_chart_data, 'line'));
      setPieChartData(transformChartData(data.pie_chart_data, 'pie'));
      setAvailableMetrics(data.available_metrics || availableMetrics);

    } catch (err) {
      setError(err.message);
      message.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('YYYY年MM月DD日');
  };

  const downloadChart = (chartRef, filename) => {
    if (chartRef && chartRef.current) {
      const base64Image = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.href = base64Image;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      message.warning('图表尚未生成');
    }
  };

  useEffect(() => {
    return () => {
      if (lineChartRef.current) lineChartRef.current.destroy();
      if (pieChartRef.current) pieChartRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (lineChartData && lineCanvasRef.current) {
      if (lineChartRef.current) lineChartRef.current.destroy();
      
      lineChartRef.current = new Chart(lineCanvasRef.current, {
        type: 'line',
        data: lineChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { 
              position: 'top',
              labels: { color: '#e6f7ff' }
            },
            tooltip: {
              backgroundColor: 'rgba(10, 25, 47, 0.85)',
              titleColor: '#36A2EB',
              bodyColor: '#e6f7ff',
              borderColor: 'rgba(54, 162, 235, 0.5)',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.parsed.y}`
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: '时间', color: '#7ec8e3' },
              grid: { color: 'rgba(126, 200, 227, 0.1)' },
              ticks: { color: '#7ec8e3' }
            },
            y: {
              title: { display: true, text: '数值', color: '#7ec8e3' },
              grid: { color: 'rgba(126, 200, 227, 0.1)' },
              ticks: { color: '#7ec8e3' }
            }
          }
        }
      });
    }

    if (pieChartData && pieCanvasRef.current) {
      if (pieChartRef.current) pieChartRef.current.destroy();
      
      pieChartRef.current = new Chart(pieCanvasRef.current, {
        type: 'pie',
        data: pieChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 20, bottom: 20, left: 20, right: 20 } },
          plugins: {
            legend: {
              position: 'right',
              labels: { 
                color: '#e6f7ff',
                font: { size: 12 },
                padding: 16
              }
            },
            tooltip: {
              backgroundColor: 'rgba(10, 25, 47, 0.85)',
              bodyColor: '#e6f7ff',
              borderColor: 'rgba(54, 162, 235, 0.5)',
              borderWidth: 1,
              padding: 12,
            }
          }
        }
      });
    }
  }, [lineChartData, pieChartData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a192f] via-[#0c2a4a] to-[#0a3d62] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* 海洋背景装饰 */}
      <div className="absolute inset-0 z-0">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 2}px`,
              height: `${Math.random() * 10 + 2}px`,
              backgroundColor: i % 3 === 0 
                ? '#00FFFF' 
                : i % 3 === 1 
                  ? '#00BFFF' 
                  : '#1E90FF',
              opacity: Math.random() * 0.5 + 0.2,
              animationDuration: `${Math.random() * 5 + 3}s`,
            }}
          />
        ))}
        
        {/* 波浪效果 */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg 
            className="relative block w-[calc(100%+1.3px)] h-[80px]"
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              className="fill-current text-blue-500 opacity-30" 
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              className="fill-current text-teal-400 opacity-40" 
            ></path>
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              className="fill-current text-cyan-300 opacity-30" 
            ></path>
          </svg>
        </div>
      </div>
      
      {/* 海洋生物装饰 */}
      <div className="absolute top-10 right-10 z-10">
        <motion.div 
          className="text-4xl text-cyan-300"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🦑
        </motion.div>
      </div>
      
      <div className="absolute bottom-20 left-10 z-10">
        <motion.div 
          className="text-5xl text-teal-300"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          🦐
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-teal-300 mb-4">
            智慧海洋牧场 - 水下环境监测系统
          </h1>
          <p className="text-cyan-200 text-lg max-w-2xl mx-auto">
            实时监测与分析水下环境参数，可视化展示水质趋势与分布，助力海洋生态保护
          </p>
        </motion.div>

        <motion.div
          className="bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center mb-6">
            <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30 mr-3">
              <div className="text-xl text-cyan-400">📅</div>
            </div>
            <h2 className="text-xl font-semibold text-cyan-300">监测数据查询</h2>
          </div>

          <Spin spinning={isLoading} tip="正在分析水质数据...">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-cyan-300 mb-2">选择日期</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    className="w-full bg-[rgba(10,40,70,0.5)] border border-cyan-500/30 rounded-lg py-3 px-4 text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="block mt-2 text-cyan-400 text-sm">
                    选择日期: {formatDate(selectedDate)}
                  </span>
                </div>

                <div>
                  <label className="block text-cyan-300 mb-2">监测指标</label>
                  <Select
                    value={selectedMetric}
                    onChange={(value) => setSelectedMetric(value)}
                    className="w-full"
                    dropdownClassName="bg-[#0a192f] border border-cyan-500/30"
                    placeholder="选择监测指标"
                  >
                    <Option value="">显示全部指标</Option>
                    {availableMetrics.map((metric, index) => (
                      <Option 
                        key={index} 
                        value={metric}
                        className="text-cyan-200 hover:bg-[#0c2a4a]"
                      >
                        {metric}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div className="flex items-end">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full"
                  >
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleSubmit}
                      loading={isLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 border-0 h-14 text-lg font-medium rounded-lg shadow-lg shadow-cyan-500/30"
                    >
                      {isLoading ? '数据生成中...' : '开始可视化分析'}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </form>
          </Spin>
        </motion.div>

        {error && (
          <motion.div 
            className="mb-8 bg-red-900/50 border border-red-500/30 rounded-xl p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="text-red-300 font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              错误提示
            </h3>
            <p className="text-red-200 mt-2">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30 mr-3">
                    <div className="text-xl text-cyan-400">📈</div>
                  </div>
                  <h2 className="text-xl font-semibold text-cyan-300">水质参数趋势分析</h2>
                </div>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => downloadChart(lineChartRef, `水质参数趋势分析_${selectedMetric || '全部指标'}.png`)}
                  disabled={!lineChartData}
                  className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                >
                  下载图表
                </Button>
              </div>
              
              <div className="h-96">
                <canvas ref={lineCanvasRef} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30 mr-3">
                    <div className="text-xl text-cyan-400">📊</div>
                  </div>
                  <h2 className="text-xl font-semibold text-cyan-300">水质类别分布统计</h2>
                </div>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => downloadChart(pieChartRef, `水质类别分布统计_${formatDate(selectedDate)}.png`)}
                  disabled={!pieChartData}
                  className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                >
                  下载图表
                </Button>
              </div>
              
              <div className="h-96">
                <canvas ref={pieCanvasRef} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* 系统说明卡片 */}
        <motion.div
          className="mt-8 bg-[rgba(10,25,47,0.8)] backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold text-cyan-300 mb-4 flex items-center">
            <div className="w-3 h-3 bg-cyan-500 rounded-full mr-2"></div>
            系统说明
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-lg border border-cyan-500/30">
              <div className="text-cyan-400 text-lg mb-2">🌊 实时监测</div>
              <p className="text-sm text-cyan-200">
                24小时不间断监测水下环境参数，确保海洋牧场水质安全
              </p>
            </div>
            <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-lg border border-cyan-500/30">
              <div className="text-cyan-400 text-lg mb-2">📊 数据分析</div>
              <p className="text-sm text-cyan-200">
                基于大数据分析水质变化趋势，预测潜在环境风险
              </p>
            </div>
            <div className="bg-[rgba(10,40,70,0.5)] p-4 rounded-lg border border-cyan-500/30">
              <div className="text-cyan-400 text-lg mb-2">🔔 智能预警</div>
              <p className="text-sm text-cyan-200">
                异常数据实时报警，助力海洋牧场及时采取保护措施
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 底部版权信息 */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-cyan-300/50 text-xs z-10">
        智慧海洋牧场 AI 系统 © {new Date().getFullYear()}
      </div>
    </div>
  );
}

export default Underwater;