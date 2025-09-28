import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ChartComponent = ({ type, data, options, className = "" }) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={options} />;
      case 'bar':
        return <Bar data={data} options={options} />;
      case 'pie':
        return <Pie data={data} options={options} />;
      case 'doughnut':
        return <Doughnut data={data} options={options} />;
      default:
        return <Line data={data} options={options} />;
    }
  };

  return (
    <div className={`chart-container ${className}`}>
      {renderChart()}
    </div>
  );
};

// Enhanced chart options for better visibility and responsiveness
export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 14,
          family: 'Inter, sans-serif',
          weight: '600'
        },
        color: '#374151'
      }
    },
    title: {
      display: true,
      font: {
        size: 20,
        weight: 'bold',
        family: 'Inter, sans-serif'
      },
      color: '#111827',
      padding: {
        top: 10,
        bottom: 30
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      cornerRadius: 12,
      displayColors: true,
      padding: 16,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      },
      callbacks: {
        label: function(context) {
          const value = context.parsed.y || context.parsed;
          if (typeof value === 'number') {
            return `${context.dataset.label}: ₦${value.toLocaleString()}`;
          }
          return `${context.dataset.label}: ${value}`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 13,
          family: 'Inter, sans-serif',
          weight: '500'
        },
        color: '#6b7280',
        padding: 10
      },
      border: {
        display: false
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 13,
          family: 'Inter, sans-serif',
          weight: '500'
        },
        color: '#6b7280',
        padding: 10,
        callback: function(value) {
          if (value >= 1000000) {
            return '₦' + (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return '₦' + (value / 1000).toFixed(1) + 'k';
          }
          return '₦' + value.toLocaleString();
        }
      },
      border: {
        display: false
      }
    }
  }
};

// Enhanced color palettes
export const colorPalettes = {
  primary: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a'],
  success: ['#10b981', '#059669', '#047857', '#065f46'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
  danger: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
  purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
  pink: ['#ec4899', '#db2777', '#be185d', '#9d174d'],
  gradient: [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16'
  ]
};

export default ChartComponent;

