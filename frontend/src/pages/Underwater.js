import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Select, Button, Spin, message } from 'antd';
import { Line, Pie } from 'react-chartjs-2';
import moment from 'moment';
import Chart from 'chart.js/auto'; // 自动注册所有组件

const { Option } = Select;

const transformChartData = (backendData, chartType) => {
  if (!backendData) return null;

  if (chartType === 'line') {
    return {
      labels: backendData.x || [],
      datasets: (backendData.datasets || []).map(dataset => ({
        ...dataset,
        data: dataset.data || []
      }))
    };
  }

  if (chartType === 'pie') {
    return {
      labels: backendData.labels || [],
      datasets: [{
        data: backendData.values || [],
        backgroundColor: backendData.backgroundColor || [],
        borderColor: backendData.borderColor || [],
        borderWidth: backendData.borderWidth || 1
      }]
    };
  }

  return null;
};

function Underwater() {
  // 定义日期范围常量
  const minDate = '2020-05-08';
  const maxDate = '2021-04-05';

  const [selectedDate, setSelectedDate] = useState(minDate); // 使用minDate初始化
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

  // 用于存储Chart实例的引用
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);

  const generateFilePath = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `config/软件工程大作业数据/水质数据/${year}-${month}/${year}-${month}-${day}.json`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const filePath = generateFilePath(selectedDate);

      const response = await fetch('http://localhost:3001/visualize-water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath, target_column: selectedMetric })
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      console.log('后端数据:', data);

      if (data.error) throw new Error(data.error);

      // 转换数据格式
      setLineChartData(transformChartData(data.line_chart_data, 'line'));
      setPieChartData(transformChartData(data.pie_chart_data, 'pie'));
      setAvailableMetrics(data.available_metrics || availableMetrics);

    } catch (err) {
      setError(err.message);
      message.error(err.message);
      setLineChartData(null);
      setPieChartData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('YYYY年MM月DD日');
  };

  // 组件卸载时销毁Chart实例
  useEffect(() => {
    return () => {
      if (lineChartRef.current) {
        lineChartRef.current.destroy();
      }
      if (pieChartRef.current) {
        pieChartRef.current.destroy();
      }
    };
  }, []);

  // 数据更新时更新Chart实例
  useEffect(() => {
    if (lineChartData && lineChartRef.current) {
      lineChartRef.current.data = lineChartData;
      lineChartRef.current.update();
    }

    if (pieChartData && pieChartRef.current) {
      pieChartRef.current.data = pieChartData;
      pieChartRef.current.update();
    }
  }, [lineChartData, pieChartData]);

return (
  <div style={{ padding: '30px', backgroundColor: '#f0f2f5' }}>
    {/* 优化后的标题样式 */}
    <h1 style={{
      textAlign: 'center',
      color: '#1890ff',
      marginBottom: '40px',
      fontSize: '2.5rem',
      fontWeight: '600',
      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      水下环境监测可视化系统
    </h1>

    <Spin spinning={isLoading} tip="正在分析水质数据...">
      <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
        <Row gutter={24} justify="center">
          <Col xs={24} sm={12} md={8}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate}
              max={maxDate}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                fontSize: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              placeholder="选择日期"
            />
            <span style={{
              display: 'block',
              marginTop: '12px',
              color: '#666',
              fontSize: '14px'
            }}>
              选择日期: {formatDate(selectedDate)}
            </span>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              value={selectedMetric}
              onChange={(value) => setSelectedMetric(value)}
              style={{
                width: '100%',
                height: '52px',
                fontSize: '16px'
              }}
              placeholder="选择监测指标"
            >
              <Option value="">显示全部指标</Option>
              {availableMetrics.map((metric, index) => (
                <Option key={index} value={metric}>{metric}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} style={{ textAlign: 'center', marginTop: '32px' }}>
            {/* 优化后的按钮样式 */}
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={isLoading}
              style={{
                width: '200px',
                height: '56px',
                fontSize: '18px',
                fontWeight: '500',
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              hoverStyle={{
                backgroundColor: '#0d75aa',
                borderColor: '#0d75aa',
                boxShadow: '0 6px 16px rgba(24, 144, 255, 0.4)'
              }}
            >
              {isLoading ? '数据生成中...' : '开始可视化分析'}
            </Button>
          </Col>
        </Row>
      </form>

        {error && (
          <Card
            style={{ marginBottom: '20px', borderColor: '#f5222d' }}
            title={<span style={{ color: '#f5222d' }}>⚠️ 错误提示</span>}
          >
            <p style={{ color: '#f5222d' }}>{error}</p>
          </Card>
        )}

        <Row gutter={16}>
            {lineChartData && (
              <Col xs={24} md={12}>
                <Card title="水质参数趋势分析" bordered={true}>
                  <div style={{ height: '400px' }}>
                    <canvas ref={(el) => {
                      if (!el || !lineChartData) return;

                      if (lineChartRef.current) {
                        lineChartRef.current.destroy();
                      }

                      lineChartRef.current = new Chart(el, {
                        type: 'line',
                        data: lineChartData,
                        options: {
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: {
                            intersect: false,
                            mode: 'index',
                          },
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  return `${context.dataset.label}: ${context.parsed.y}`;
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: '时间'
                              }
                            },
                            y: {
                              title: {
                                display: true,
                                text: '数值'
                              }
                            }
                          }
                        }
                      });
                    }} />
                  </div>
                </Card>
              </Col>
            )}

            {pieChartData && (
              <Col xs={24} md={12}>
                <Card title="水质类别分布统计" bordered={true}>
                  <div style={{ height: '400px', position: 'relative' }}>
                    <canvas
                      ref={(el) => {
                        if (!el || !pieChartData) return; // 确保元素和数据存在

                        // 销毁旧图表实例
                        if (pieChartRef.current) {
                          pieChartRef.current.destroy();
                        }

                        // 创建新图表实例（添加你提供的配置）
                        pieChartRef.current = new Chart(el.getContext('2d'), {
                          type: 'pie',
                          data: { // 确保数据格式正确
                            labels: pieChartData.labels,
                            datasets: [{
                              data: pieChartData.values,
                              backgroundColor: pieChartData.backgroundColor,
                              borderColor: pieChartData.borderColor,
                              borderWidth: pieChartData.borderWidth
                            }]
                          },
                          options: { // 这是你要添加的配置
                            responsive: true,
                            maintainAspectRatio: false,
                            layout: {
                              padding: {
                                top: 20,
                                bottom: 20,
                                left: 20,
                                right: 20
                              }
                            },
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: {
                                  font: {
                                    size: 12
                                  }
                                }
                              }
                            }
                          }
                        });
                      }}
                    />
                  </div>
                </Card>
              </Col>
            )}
        </Row>
      </Spin>
    </div>
  );
}

export default Underwater;