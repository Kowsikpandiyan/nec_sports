import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS elements
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ data, options, title = '' }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(156, 163, 175, 0.9)', // Gray text for dark theme compatibility
          font: { family: 'Outfit, sans-serif' }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: 'rgba(156, 163, 175, 0.9)',
        font: { family: 'Outfit, sans-serif', size: 16 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { color: 'rgba(156, 163, 175, 0.8)', font: { family: 'Outfit' } }
      },
      y: {
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { color: 'rgba(156, 163, 175, 0.8)', font: { family: 'Outfit' } }
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[250px]">
      <Bar data={data} options={options || defaultOptions} />
    </div>
  );
};

export default BarChart;
