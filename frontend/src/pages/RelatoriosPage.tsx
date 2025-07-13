// src/pages/RelatoriosPage.tsx

import React, { useState } from 'react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { 
  Container, Typography, Paper, Box, Button, TextField, 
  CircularProgress, FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';

const RelatoriosPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: ''
  });
  const { showNotification } = useNotification();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleExport = async (formato: 'excel' | 'pdf') => {
    if (!filtros.data_inicio || !filtros.data_fim) {
      showNotification('Por favor, selecione as datas de início e fim.', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams(filtros as any);
      params.append('formato', formato);

      const response = await api.get(`/pagamentos/exportar/?${params.toString()}`, {
          responseType: 'blob',
      });

      const extensao = formato === 'excel' ? 'xlsx' : 'pdf';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_pagamentos.${extensao}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showNotification(`Relatório em .${extensao} gerado com sucesso!`, 'success');

    } catch (error) {
      showNotification('Erro ao gerar o relatório.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Central de Relatórios e Exportação
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Exportar Pagamentos por Período
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
          Selecione o intervalo de datas (baseado na data de competência) para gerar seu relatório em PDF ou Excel.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2, flexWrap: 'wrap' }}>
          <TextField
            name="data_inicio"
            label="Data de Início"
            type="date"
            fullWidth
            sx={{ minWidth: '180px', flex: 1 }}
            value={filtros.data_inicio}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            name="data_fim"
            label="Data de Fim"
            type="date"
            fullWidth
            sx={{ minWidth: '180px', flex: 1 }}
            value={filtros.data_fim}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => handleExport('pdf')} 
            disabled={loading || !filtros.data_inicio || !filtros.data_fim}
          >
            {loading ? <CircularProgress size={24} /> : 'Gerar PDF'}
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={() => handleExport('excel')} 
            disabled={loading || !filtros.data_inicio || !filtros.data_fim}
          >
            {loading ? <CircularProgress size={24} /> : 'Gerar Excel'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default RelatoriosPage;