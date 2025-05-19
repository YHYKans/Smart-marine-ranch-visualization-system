import React, { useState } from 'react';

function FishVisualization() {
  // 状态管理
  const [barChart, setBarChart] = useState(null);
  const [scatterChart, setScatterChart] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [singleSpeciesChart, setSingleSpeciesChart] = useState(null);
  const [speciesName, setSpeciesName] = useState('');

  // 样式对象（与示例保持一致）
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    header: {
      textAlign: 'center',
      color: '#2c3e50',
      marginBottom: '2rem',
      fontSize: '2.5rem',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
    },
    controlPanel: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '2rem'
    },
    submitButton: {
      padding: '0.8rem 2rem',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.1rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ':hover': {
        backgroundColor: '#2980b9',
        transform: 'translateY(-1px)'
      },
      ':disabled': {
        backgroundColor: '#bdc3c7',
        cursor: 'not-allowed',
        transform: 'none'
      }
    },
    error: {
      backgroundColor: '#ffe6e6',
      color: '#e74c3c',
      padding: '1rem',
      borderRadius: '8px',
      margin: '1rem auto',
      maxWidth: '600px',
      textAlign: 'center',
      border: '1px solid #e74c3c'
    },
    chartContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '2rem',
      marginTop: '2rem'
    },
    chartCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s ease',
      ':hover': {
        transform: 'translateY(-5px)'
      }
    },
    chartTitle: {
      color: '#2c3e50',
      marginBottom: '1rem',
      textAlign: 'center'
    },
    chartImage: {
      width: '100%',
      height: 'auto',
      borderRadius: '8px'
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    spinner: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      animation: 'spin 1s linear infinite'
    }
  };

  // 提交处理函数增强版
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setSingleSpeciesChart(null); // 清空上次结果

    try {
      const formData = new FormData();
      formData.append('species', speciesName.trim()); // 传递鱼种参数

      const response = await fetch('http://localhost:3001/visualize-fish', {
        method: 'POST',
        body: formData // 直接传递FormData，自动处理Content-Type为multipart/form-data
      });

      if (!response.ok) throw new Error(`HTTP错误！状态码：${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setBarChart(data.bar_chart);
      setScatterChart(data.scatter_chart);
      setSingleSpeciesChart(data.single_species_scatter); // 存储单个鱼种图表数据
    } catch (err) {
      setError(err.message || '获取数据失败，请检查网络连接或重试');
      setBarChart(null);
      setScatterChart(null);
      setSingleSpeciesChart(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>水产数据可视化系统</h1>

      {/* 新增鱼种选择控件 */}
      <div style={{ ...styles.controlPanel, marginBottom: '3rem', gap: '1rem' }}>
        <input
          type="text"
          placeholder="请输入鱼类种类（如：Perch）"
          value={speciesName}
          onChange={(e) => setSpeciesName(e.target.value)}
          style={{
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '1.1rem',
            flexGrow: 1,
            maxWidth: '400px'
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            ...styles.submitButton,
            ...(isLoading && { backgroundColor: '#bdc3c7', cursor: 'not-allowed' })
          }}
          disabled={isLoading}
        >
          {isLoading ? '数据加载中...' : '生成可视化图表'}
        </button>
      </div>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: '1rem', color: '#3498db' }}>正在生成图表...</p>
        </div>
      )}

      <div style={styles.chartContainer}>
        {/* 原有图表 */}
        {barChart && (
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>每种鱼类的平均重量</h2>
            <img
              src={`data:image/png;base64,${barChart}`}
              alt="鱼类平均重量柱状图"
              style={styles.chartImage}
            />
          </div>
        )}

        {scatterChart && (
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>鱼类长度和宽度关系</h2>
            <img
              src={`data:image/png;base64,${scatterChart}`}
              alt="长度宽度散点图"
              style={styles.chartImage}
            />
          </div>
        )}

        {/* 新增单个鱼种图表 */}
        {singleSpeciesChart && (
          <div style={{ ...styles.chartCard, borderLeft: '4px solid #2ecc71' }}>
            <h2 style={styles.chartTitle}>
              {speciesName} 的长度与宽度关系
            </h2>
            <img
              src={`data:image/png;base64,${singleSpeciesChart}`}
              alt={`${speciesName} 长度宽度关系`}
              style={{ ...styles.chartImage, height: '350px' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FishVisualization;