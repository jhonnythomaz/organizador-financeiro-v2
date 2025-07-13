// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Container, Typography, Box, CircularProgress, Paper } from '@mui/material';
import GastosPorCategoriaChart from '../components/GastosPorCategoriaChart';
import { IPagamento, IApiResponse } from './PagamentosPage';

const getRandomColor = () => `rgba(${Math.floor(Math.random() * 200) + 55}, ${Math.floor(Math.random() * 200) + 55}, ${Math.floor(Math.random() * 200) + 55}, 0.8)`;

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pagamentos, setPagamentos] = useState<IPagamento[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPagamentos = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get<IApiResponse>('/pagamentos/');
        if (response.data && Array.isArray(response.data.results)) {
            setPagamentos(response.data.results);
        } else {
            setPagamentos([]);
            console.warn("Resposta da API para o dashboard foi malformada.", response.data);
        }
      } catch (err) {
        setError('Não foi possível carregar os dados do dashboard.');
        setPagamentos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPagamentos();
  }, []);

  const chartData = useMemo(() => {
    const gastos: { [key: string]: number } = {};
    pagamentos
      .filter(p => p.status_display === 'Pago')
      .forEach(p => {
        const categoria = p.categoria_nome || 'Sem Categoria';
        const valor = Number(p.valor);
        if (!isNaN(valor)) { gastos[categoria] = (gastos[categoria] || 0) + valor; }
      });

    const labels = Object.keys(gastos);
    const data = Object.values(gastos);
    const backgroundColors = labels.map(() => getRandomColor());
    return {
      labels,
      datasets: [{
          label: 'Gastos em R$', data, backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.8', '1')), borderWidth: 1,
      }],
    };
  }, [pagamentos]);

  const totalGasto = useMemo(() => chartData.datasets[0]?.data.reduce((acc, value) => acc + value, 0) || 0, [chartData]);

  if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Container>;
  if (error) return <Container><Typography color="error" sx={{mt: 4}}>{error}</Typography></Container>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>Dashboard Analítico</Typography>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: '1 1 60%', minWidth: 0 }}>
          <Paper sx={{ p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
            {totalGasto > 0 ? (
              <Box sx={{ position: 'relative', height: '100%' }}><GastosPorCategoriaChart data={chartData} /></Box>
            ) : (
              <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}><Typography color="text.secondary">Nenhum gasto pago para exibir no gráfico.</Typography></Box>
            )}
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 40%' }}>
          <Paper sx={{ p: 2, height: '400px', overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>Resumo de Gastos Pagos</Typography>
            {totalGasto > 0 ? (
              chartData.labels.map((label, index) => {
                const valor = chartData.datasets[0].data[index];
                const percentual = (valor / totalGasto) * 100;
                return (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, borderBottom: '1px solid #eee', pb: 1 }}><Typography variant="body1">{label}</Typography><Typography fontWeight="bold">R$ {valor.toFixed(2)} <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>({percentual.toFixed(1)}%)</Typography></Typography></Box>
                );
              })
            ) : (<Typography color="text.secondary">Nenhum gasto para resumir.</Typography>)}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};
export default DashboardPage;