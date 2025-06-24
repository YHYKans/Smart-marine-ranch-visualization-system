import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Spin, message } from 'antd';
import { Bar, Scatter } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

// 导入 Select.Option
const { Option } = Select;

function FishDataVisualization() {
  const [fishData, setFishData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [availableSpecies, setAvailableSpecies] = useState([]);

  // 从后端获取鱼类数据
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

      // 提取可用的鱼种列表
      if (data.bar_chart_data) {
        const species = data.bar_chart_data.map(item => item.Species);
        setAvailableSpecies(species);
      }

    } catch (err) {
      message.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染平均重量柱状图
  const renderWeightBarChart = () => {
    if (!fishData || !fishData.bar_chart_data) return null;

    const { bar_chart_data } = fishData;
    const labels = bar_chart_data.map(item => item.Species);
    const values = bar_chart_data.map(item => item['Weight(g)']);

    return (
      <Card title="每种鱼类的平均重量" bordered={true}>
        <div style={{ height: '350px' }}>
          <Bar
            data={{
              labels: labels,
              datasets: [{
                label: '平均重量 (g)',
                data: values,
                backgroundColor: [
                  'rgba(54, 162, 235, 0.7)',
                  'rgba(255, 99, 132, 0.7)',
                  'rgba(255, 206, 86, 0.7)',
                  'rgba(75, 192, 192, 0.7)',
                  'rgba(153, 102, 255, 0.7)',
                  'rgba(255, 159, 64, 0.7)',
                  'rgba(173, 216, 230, 0.7)'
                ],
                borderColor: [
                  'rgb(54, 162, 235)',
                  'rgb(255, 99, 132)',
                  'rgb(255, 206, 86)',
                  'rgb(75, 192, 192)',
                  'rgb(153, 102, 255)',
                  'rgb(255, 159, 64)',
                  'rgb(173, 216, 230)'
                ],
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: '平均重量 (g)'
                  }
                }
              }
            }}
          />
        </div>
      </Card>
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

    // 为每个鱼种创建数据集
    const datasets = Object.keys(speciesGroups).map(species => ({
      label: species,
      data: speciesGroups[species],
      backgroundColor: getRandomColor(0.7),
      borderColor: getRandomColor(),
      borderWidth: 1,
      pointRadius: 4,
      pointHoverRadius: 6
    }));

    return (
      <Card title="鱼类的长度和宽度关系" bordered={true}>
        <div style={{ height: '350px' }}>
          <Scatter
            data={{
              datasets: datasets
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
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
                    text: '长度 (cm)'
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: '宽度 (cm)'
                  }
                }
              }
            }}
          />
        </div>
      </Card>
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
      <Card
        title={`${species} 的长度和宽度关系 (相关系数: ${stats.correlation.toFixed(2)})`}
        borderColor="#1890ff"
        style={{ borderWidth: 2 }}
      >
        <div style={{ height: '350px' }}>
          <Scatter
            data={{
              datasets: [
                {
                  label: `${species} 样本点`,
                  data: scatterData,
                  backgroundColor: 'rgba(30, 144, 255, 0.5)',
                  borderColor: 'rgba(30, 144, 255, 1)',
                  borderWidth: 1,
                  pointRadius: 4,
                  pointHoverRadius: 6
                },
                {
                  label: '回归线',
                  data: regressionLine,
                  backgroundColor: 'rgba(220, 20, 60, 0)',
                  borderColor: 'rgba(220, 20, 60, 1)',
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
                    text: '长度 (cm)'
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: '宽度 (cm)'
                  }
                }
              }
            }}
          />
        </div>
        <div style={{ padding: '10px', backgroundColor: '#f5f7fa', borderRadius: '4px', marginTop: '10px' }}>
          <p>样本数量: {stats.sample_size} | 平均长度: {stats.avg_length.toFixed(2)} cm | 平均宽度: {stats.avg_width.toFixed(2)} cm</p>
        </div>
      </Card>
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

  // 生成随机颜色
  const getRandomColor = (alpha = 1) => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // 处理鱼种选择
  const handleSpeciesChange = (value) => {
    setSelectedSpecies(value);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{
        textAlign: 'center',
        color: '#1890ff',
        marginBottom: '30px',
        fontSize: '2rem',
        fontWeight: '600'
      }}>
        鱼类数据可视化分析
      </h1>

      <Spin spinning={isLoading} tip="加载鱼类数据...">
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <Select
            value={selectedSpecies}
            onChange={handleSpeciesChange}
            style={{ width: '300px', height: '52px', fontSize: '16px' }}
            placeholder="选择鱼种查看详细分析"
          >
            <Option value="">全部鱼类</Option>
            {availableSpecies.map((species, index) => (
              <Option key={index} value={species}>{species}</Option>
            ))}
          </Select>
        </div>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            {renderWeightBarChart()}
          </Col>
          <Col xs={24} md={12}>
            {renderGeneralScatterChart()}
          </Col>
        </Row>

        {selectedSpecies && renderSingleSpeciesScatterChart()}
      </Spin>
    </div>
  );
}

export default FishDataVisualization;