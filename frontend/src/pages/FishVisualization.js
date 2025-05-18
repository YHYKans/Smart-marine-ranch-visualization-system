import React, { useState } from 'react';

function FishVisualization() {
  // 状态管理
  const [barChart, setBarChart] = useState(null);
  const [scatterChart, setScatterChart] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  // 提交处理
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/visualize-fish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(await response.text());
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setBarChart(data.bar_chart);
      setScatterChart(data.scatter_chart);
    } catch (err) {
      setError(err.message);
      setBarChart(null);
      setScatterChart(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>水产数据可视化系统</h1>

      <div style={styles.controlPanel}>
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            ...styles.submitButton,
            ...(isLoading && styles.submitButton[':disabled'])
          }}
          disabled={isLoading}
        >
          {isLoading ? '数据加载中...' : '加载水产数据'}
        </button>
      </div>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: '1rem', color: '#3498db' }}>正在分析水产数据...</p>
        </div>
      )}

      <div style={styles.chartContainer}>
        {barChart && (
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>鱼类平均重量分析</h2>
            <img 
              src={`data:image/png;base64,${barChart}`} 
              alt="鱼类平均重量"
              style={styles.chartImage}
            />
          </div>
        )}

        {scatterChart && (
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>体型特征分布</h2>
            <img
              src={`data:image/png;base64,${scatterChart}`}
              alt="体型特征分布"
              style={styles.chartImage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FishVisualization;