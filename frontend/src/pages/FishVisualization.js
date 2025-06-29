import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Select, Spin, Button } from 'antd';
import { Bar, Scatter } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { DownloadOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Option } = Select;

function FishDataVisualization() {
  const [fishData, setFishData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [availableSpecies, setAvailableSpecies] = useState([]);
  
  const barChartRef = useRef(null);
  const generalScatterRef = useRef(null);
  const singleScatterRef = useRef(null);

  useEffect(() => {
    fetchFishData();
  }, [selectedSpecies]);

  const fetchFishData = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (selectedSpecies) {
        formData.append('species', selectedSpecies);
      }

      const response = await fetch('http://localhost:3001/visualize-fish', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      setFishData(data);

      if (data.bar_chart_data) {
        const species = data.bar_chart_data.map(item => item.Species);
        setAvailableSpecies(species);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
    }
  };

  // 渲染平均重量柱状图
  const renderWeightBarChart = () => {
    if (!fishData || !fishData.bar_chart_data) return null;

    const { bar_chart_data } = fishData;
    const labels = bar_chart_data.map(item => item.Species);
    const values = bar_chart_data.map(item => item['Weight(g)']);

    // 海洋主题的蓝色系颜色
    const oceanColors = [
      'rgba(0, 191, 255, 0.7)',   // DeepSkyBlue
      'rgba(30, 144, 255, 0.7)',  // DodgerBlue
      'rgba(70, 130, 180, 0.7)',  // SteelBlue
      'rgba(0, 139, 139, 0.7)',   // DarkCyan
      'rgba(32, 178, 170, 0.7)',  // LightSeaGreen
      'rgba(72, 209, 204, 0.7)',  // MediumTurquoise
      'rgba(95, 158, 160, 0.7)'   // CadetBlue
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card 
          title="每种鱼类的平均重量" 
          bordered={false}
          className="glass-card"
          extra={
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              className="download-btn"
              onClick={() => downloadChart(barChartRef, '平均重量柱状图.png')}
            >
              下载图表
            </Button>
          }
        >
          <div style={{ height: '350px' }}>
            <Bar
              ref={barChartRef}
              data={{
                labels: labels,
                datasets: [{
                  label: '平均重量 (g)',
                  data: values,
                  backgroundColor: oceanColors,
                  borderColor: oceanColors.map(color => color.replace('0.7', '1')),
                  borderWidth: 1
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: '#e6f7ff'
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: '平均重量 (g)',
                      color: '#91d5ff'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: '#91d5ff'
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: '#91d5ff'
                    }
                  }
                }
              }}
            />
          </div>
        </Card>
      </motion.div>
    );
  };

  // 渲染所有鱼类长度和宽度关系散点图
  const renderGeneralScatterChart = () => {
    if (!fishData || !fishData.scatter_chart_data) return null;

    // 按鱼种分组数据
    const speciesGroups = {};
    fishData.scatter_chart_data.forEach(item => {
      if (!speciesGroups[item.Species]) {
        speciesGroups[item.Species] = [];
      }
      speciesGroups[item.Species].push({
        x: item['Length1(cm)'],
        y: item['Width(cm)']
      });
    });

    // 海洋主题颜色
    const oceanColors = [
      'rgba(0, 191, 255, 0.7)',   // DeepSkyBlue
      'rgba(30, 144, 255, 0.7)',  // DodgerBlue
      'rgba(70, 130, 180, 0.7)',  // SteelBlue
      'rgba(0, 139, 139, 0.7)',   // DarkCyan
      'rgba(32, 178, 170, 0.7)',  // LightSeaGreen
      'rgba(72, 209, 204, 0.7)',  // MediumTurquoise
      'rgba(95, 158, 160, 0.7)'   // CadetBlue
    ];

    // 为每个鱼种创建数据集
    const datasets = Object.keys(speciesGroups).map((species, index) => ({
      label: species,
      data: speciesGroups[species],
      backgroundColor: oceanColors[index % oceanColors.length],
      borderColor: oceanColors[index % oceanColors.length].replace('0.7', '1'),
      borderWidth: 1,
      pointRadius: 5,
      pointHoverRadius: 7
    }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card 
          title="鱼类的长度和宽度关系" 
          bordered={false}
          className="glass-card"
          extra={
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              className="download-btn"
              onClick={() => downloadChart(generalScatterRef, '长度宽度关系散点图.png')}
            >
              下载图表
            </Button>
          }
        >
          <div style={{ height: '350px' }}>
            <Scatter
              ref={generalScatterRef}
              data={{
                datasets: datasets
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: '#e6f7ff'
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const point = context.parsed;
                        return [`长度: ${point.x} cm`, `宽度: ${point.y} cm`];
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                      display: true,
                      text: '长度 (cm)',
                      color: '#91d5ff'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: '#91d5ff'
                    }
                  },
                  y: {
                    title: {
                      display: true,
                      text: '宽度 (cm)',
                      color: '#91d5ff'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: '#91d5ff'
                    }
                  }
                }
              }}
            />
          </div>
        </Card>
      </motion.div>
    );
  };

  // 渲染特定鱼种的散点图（带回归线）
  const renderSingleSpeciesScatterChart = () => {
    if (!fishData || !fishData.single_species_data) return null;

    const { single_species_data } = fishData;
    const { species, data, stats } = single_species_data;

    // 准备散点数据
    const scatterData = data.map(item => ({
      x: item['Length1(cm)'],
      y: item['Width(cm)']
    }));

    // 计算回归线数据
    const regressionLine = calculateRegressionLine(scatterData);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card
          title={`${species} 的长度和宽度关系 (相关系数: ${stats.correlation.toFixed(2)})`}
          bordered={false}
          className="glass-card"
          extra={
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              className="download-btn"
              onClick={() => downloadChart(singleScatterRef, `${species}长度宽度关系.png`)}
            >
              下载图表
            </Button>
          }
        >
          <div style={{ height: '350px' }}>
            <Scatter
              ref={singleScatterRef}
              data={{
                datasets: [
                  {
                    label: `${species} 样本点`,
                    data: scatterData,
                    backgroundColor: 'rgba(30, 144, 255, 0.5)',
                    borderColor: 'rgba(30, 144, 255, 1)',
                    borderWidth: 1,
                    pointRadius: 5,
                    pointHoverRadius: 7
                  },
                  {
                    label: '回归线',
                    data: regressionLine.data,
                    backgroundColor: 'rgba(220, 20, 60, 0)',
                    borderColor: 'rgba(255, 215, 0, 1)', // 金色回归线
                    borderWidth: 2,
                    pointRadius: 0,
                    showLine: true,
                    fill: false
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: '#e6f7ff'
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        if (context.dataset.label === '回归线') {
                          return [`回归线: y = ${regressionLine.slope.toFixed(4)}x + ${regressionLine.intercept.toFixed(4)}`];
                        }
                        const point = context.parsed;
                        return [`长度: ${point.x} cm`, `宽度: ${point.y} cm`];
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                      display: true,
                      text: '长度 (cm)',
                      color: '#91d5ff'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: '#91d5ff'
                    }
                  },
                  y: {
                    title: {
                      display: true,
                      text: '宽度 (cm)',
                      color: '#91d5ff'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: '#91d5ff'
                    }
                  }
                }
              }}
            />
          </div>
          <div className="stats-info">
            <p>样本数量: <span className="highlight">{stats.sample_size}</span></p>
            <p>平均长度: <span className="highlight">{stats.avg_length.toFixed(2)} cm</span></p>
            <p>平均宽度: <span className="highlight">{stats.avg_width.toFixed(2)} cm</span></p>
          </div>
        </Card>
      </motion.div>
    );
  };

  // 计算回归线
  const calculateRegressionLine = (dataPoints) => {
    const xValues = dataPoints.map(p => p.x);
    const yValues = dataPoints.map(p => p.y);

    const n = xValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += xValues[i];
      sumY += yValues[i];
      sumXY += xValues[i] * yValues[i];
      sumX2 += xValues[i] * xValues[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 生成回归线上的点
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const regressionPoints = [
      { x: xMin, y: slope * xMin + intercept },
      { x: xMax, y: slope * xMax + intercept }
    ];

    return {
      data: regressionPoints,
      slope: slope,
      intercept: intercept
    };
  };

  // 处理鱼种选择
  const handleSpeciesChange = (value) => {
    setSelectedSpecies(value);
  };

  // 海洋背景动画元素
  const renderOceanElements = () => {
    return (
      <>
        {[...Array(20)].map((_, i) => (
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
              zIndex: 0
            }}
          />
        ))}
        
        <div className="absolute bottom-0 left-0 w-full overflow-hidden z-0">
          <svg 
            className="relative block w-[calc(100%+1.3px)] h-[80px]"
            data-name="Layer 1" 
            xmlns="http://www.w3.org/2000/svg" 
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
      </>
    );
  };

  return (
    <div className="fish-data-visualization-container">
      {/* 海洋背景装饰 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {renderOceanElements()}
      </div>
      
      {/* 顶部标题 */}
      <motion.div
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center mb-2">
          <div className="bg-cyan-500/10 p-3 rounded-full border border-cyan-400/30 mr-3">
            <div className="text-3xl text-cyan-400">🐠</div>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-teal-300">
            海洋鱼类数据分析平台
          </h1>
        </div>
        <p className="text-cyan-300 text-center max-w-2xl mx-auto">
          基于人工智能的海洋鱼类数据分析与可视化系统
        </p>
      </motion.div>

      <Spin 
        spinning={isLoading} 
        tip="加载鱼类数据中..."
        indicator={
          <div className="flex space-x-2 justify-center">
            <div className="h-3 w-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '-0.32s'}}></div>
            <div className="h-3 w-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '-0.16s'}}></div>
            <div className="h-3 w-3 bg-cyan-400 rounded-full animate-bounce"></div>
          </div>
        }
        className="z-10"
      >
        <div className="species-selector">
          <Select
            value={selectedSpecies}
            onChange={handleSpeciesChange}
            placeholder="选择鱼种查看详细分析"
            className="species-select"
          >
            <Option value="">全部鱼类</Option>
            {availableSpecies.map((species, index) => (
              <Option key={index} value={species}>{species}</Option>
            ))}
          </Select>
          <div className="select-hint">
            选择特定鱼类查看详细统计数据和回归分析
          </div>
        </div>

        <Row gutter={[24, 24]} className="chart-row">
          <Col xs={24} md={12}>
            {renderWeightBarChart()}
          </Col>
          <Col xs={24} md={12}>
            {renderGeneralScatterChart()}
          </Col>
        </Row>

        <div className="single-species-chart">
          {selectedSpecies && renderSingleSpeciesScatterChart()}
        </div>
      </Spin>

      {/* 底部信息 */}
      <div className="footer">
        <p>智慧海洋牧场 AI 系统 · 数据分析平台 © {new Date().getFullYear()}</p>
      </div>

      {/* 全局样式 */}
      <style jsx>{`
        .fish-data-visualization-container {
          min-height: 100vh;
          padding: 40px 20px;
          position: relative;
          background: linear-gradient(135deg, #0a192f, #0c2a4a, #0a3d62);
          overflow-x: hidden;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          position: relative;
          z-index: 10;
        }
        
        .glass-card {
          background: rgba(10, 25, 47, 0.7) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 229, 255, 0.3) !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 32px rgba(0, 229, 255, 0.1);
          color: #e6f7ff;
        }
        
        .glass-card :global(.ant-card-head) {
          color: #91d5ff;
          border-bottom: 1px solid rgba(0, 229, 255, 0.2) !important;
        }
        
        .glass-card :global(.ant-card-body) {
          padding: 24px;
        }
        
        .download-btn {
          background: linear-gradient(to right, #36d1dc, #5b86e5);
          border: none;
          border-radius: 8px;
          font-weight: 500;
        }
        
        .download-btn:hover {
          background: linear-gradient(to right, #2bc0e4, #4a7de0);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);
        }
        
        .species-selector {
          max-width: 600px;
          margin: 0 auto 40px;
          text-align: center;
        }
        
        .species-select {
          width: 100%;
          height: 50px;
          background: rgba(10, 40, 70, 0.5);
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: 12px;
          color: #e6f7ff;
          font-size: 16px;
        }
        
        .species-select :global(.ant-select-selector) {
          background: transparent !important;
          border: none !important;
          height: 50px !important;
          color: #e6f7ff !important;
        }
        
        .species-select :global(.ant-select-selection-placeholder) {
          color: #91d5ff !important;
        }
        
        .species-select :global(.ant-select-arrow) {
          color: #91d5ff;
        }
        
        .select-hint {
          color: #69c0ff;
          margin-top: 10px;
          font-size: 14px;
        }
        
        .chart-row {
          margin-bottom: 30px;
        }
        
        .single-species-chart {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .stats-info {
          display: flex;
          justify-content: space-around;
          padding: 15px;
          background: rgba(10, 40, 70, 0.4);
          border-radius: 10px;
          margin-top: 20px;
          color: #91d5ff;
          font-size: 15px;
        }
        
        .stats-info p {
          margin: 0;
        }
        
        .highlight {
          color: #36cfc9;
          font-weight: 600;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          color: #69c0ff;
          font-size: 14px;
          position: relative;
          z-index: 10;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .animate-bounce {
          animation: bounce 1.5s infinite;
        }
      `}</style>
    </div>
  );
}

export default FishDataVisualization;