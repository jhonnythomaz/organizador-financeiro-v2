// src/components/GastosPorCategoriaChart.tsx

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registra os elementos necessários do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Define o formato dos dados que o gráfico espera
interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

interface GastosPorCategoriaChartProps {
  data: ChartData;
}

const GastosPorCategoriaChart: React.FC<GastosPorCategoriaChartProps> = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Essencial para o gráfico se ajustar ao container
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Distribuição de Gastos por Categoria (Pagos)',
        font: {
          size: 16
        }
      },
    },
  };

  return <Doughnut data={data} options={options} />;
};

export default GastosPorCategoriaChart;