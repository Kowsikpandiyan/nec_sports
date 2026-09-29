import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS elements
ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ data, options, title = '' }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(156, 163, 175, 0.9)',
          font: { family: 'Outfit, sans-serif' }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: 'rgba(156, 163, 175, 0.9)',
        font: { family: 'Outfit, sans-serif', size: 16 }
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[250px]">
      <Doughnut data={data} options={options || defaultOptions} />
    </div>
  );
};

export default DoughnutChart;
