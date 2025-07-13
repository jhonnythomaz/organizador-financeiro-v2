// src/pages/PagamentosPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import PagamentoModal from '../components/PagamentoModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, Box, Button, TextField, 
  FormControl, InputLabel, Select, MenuItem, TableSortLabel
} from '@mui/material';

// --- Interfaces ---
export interface IPagamento {
  id: number;
  descricao: string;
  valor: string;
  data_competencia: string;
  data_vencimento: string | null;
  categoria: number | '';
  categoria_nome: string | 'N/A';
  status: 'Pendente' | 'Pago';
  status_display: 'Pendente' | 'Pago' | 'Atrasado';
  numero_nota_fiscal: string | null;
}
export interface ICategoria { 
  id: number; 
  nome: string; 
}
export interface ITotais { 
  pago: number; 
  pendente: number; 
  atrasado: number; 
}
export interface IApiResponse { 
  results: IPagamento[]; 
  totais: ITotais; 
  count: number;
  next: string | null;
  previous: string | null;
}

const PagamentosPage: React.FC = () => {
  const [pagamentos, setPagamentos] = useState<IPagamento[]>([]);
  const [categorias, setCategorias] = useState<ICategoria[]>([]);
  const [totais, setTotais] = useState<ITotais>({ pago: 0, pendente: 0, atrasado: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [pagamentoAtual, setPagamentoAtual] = useState<IPagamento | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pagamentoParaDeletar, setPagamentoParaDeletar] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  
  const { showNotification } = useNotification();
  
  const [filtros, setFiltros] = useState({
    descricao: '', status: '', categoria: '',
    data_competencia_inicio: '', data_competencia_fim: '',
  });
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState('data_competencia');

  const fetchPagamentos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filtros.descricao) params.append('descricao', filtros.descricao);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.data_competencia_inicio) params.append('data_competencia_inicio', filtros.data_competencia_inicio);
      if (filtros.data_competencia_fim) params.append('data_competencia_fim', filtros.data_competencia_fim);
      
      const orderingDirection = ordem === 'desc' ? '-' : '';
      params.append('ordering', `${orderingDirection}${orderBy}`);

      const response = await api.get<IApiResponse>(`/pagamentos/?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data.results) && response.data.totais) {
        setPagamentos(response.data.results);
        setTotais(response.data.totais);
      }
    } catch (err) {
      setError('Não foi possível carregar os pagamentos.');
    } finally {
      setLoading(false);
    }
  }, [filtros, ordem, orderBy]);

  useEffect(() => {
    fetchPagamentos();
  }, [fetchPagamentos]);
  
  useEffect(() => {
    api.get<ICategoria[]>('/categorias/').then(res => setCategorias(res.data));
  }, []);

  const handleFiltroChange = (e: any) => {
    setFiltros(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRequestSort = (property: string) => {
    setOrderBy(property);
    setOrdem(orderBy === property && ordem === 'asc' ? 'desc' : 'asc');
  };
  
  const handleOpenCreateModal = () => { setPagamentoAtual(null); setModalOpen(true); };
  const handleOpenEditModal = (pagamento: IPagamento) => { setPagamentoAtual(pagamento); setModalOpen(true); };
  const handleDeleteClick = (id: number) => { setPagamentoParaDeletar(id); setConfirmDialogOpen(true); };

  const handleSaveSuccess = () => {
    setModalOpen(false);
    fetchPagamentos();
  };

  const confirmDelete = async () => {
    if (pagamentoParaDeletar) {
      try {
        await api.delete(`/pagamentos/${pagamentoParaDeletar}/`);
        showNotification('Pagamento excluído!', 'info');
        fetchPagamentos();
      } catch (error) {
        showNotification('Não foi possível excluir o pagamento.', 'error');
      } finally {
        setConfirmDialogOpen(false);
        setPagamentoParaDeletar(null);
      }
    }
  };
  
  const handleExport = async (formato: 'excel' | 'pdf') => {
    setExporting(true);
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
        link.setAttribute('download', `pagamentos.${extensao}`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    } catch (error) {
        showNotification('Erro ao exportar os dados.', 'error');
    } finally {
        setExporting(false);
    }
  };

  const saldoFiltrado = useMemo(() => 
    (totais.pago || 0) - ((totais.pendente || 0) + (totais.atrasado || 0)), 
    [totais]
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">Painel de Pagamentos</Typography>
        <Button variant="contained" color="primary" onClick={handleOpenCreateModal}>Adicionar Pagamento</Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Paper elevation={2} sx={{ p: 2, flex: '1 1 200px', bgcolor: 'success.light', color: 'white' }}><Typography>Total Pago</Typography><Typography variant="h5" sx={{fontWeight: 'bold'}}>R$ {(totais.pago || 0).toFixed(2)}</Typography></Paper>
        <Paper elevation={2} sx={{ p: 2, flex: '1 1 200px', bgcolor: 'warning.light' }}><Typography>A Pagar (Pendente)</Typography><Typography variant="h5" sx={{fontWeight: 'bold'}}>R$ {(totais.pendente || 0).toFixed(2)}</Typography></Paper>
        <Paper elevation={2} sx={{ p: 2, flex: '1 1 200px', bgcolor: 'error.light', color: 'white' }}><Typography>Atrasado</Typography><Typography variant="h5" sx={{fontWeight: 'bold'}}>R$ {(totais.atrasado || 0).toFixed(2)}</Typography></Paper>
        <Paper elevation={2} sx={{ p: 2, flex: '1 1 200px', bgcolor: saldoFiltrado >= 0 ? 'info.light' : 'secondary.main', color: 'white' }}><Typography>Saldo</Typography><Typography variant="h5" sx={{fontWeight: 'bold'}}>R$ {saldoFiltrado.toFixed(2)}</Typography></Paper>
      </Box>
      
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField name="descricao" label="Buscar..." sx={{flex: '1 1 250px'}} size="small" value={filtros.descricao} onChange={handleFiltroChange} />
          <FormControl sx={{flex: '1 1 150px'}} size="small"><InputLabel>Categoria</InputLabel><Select name="categoria" value={filtros.categoria} label="Categoria" onChange={handleFiltroChange}><MenuItem value=""><em>Todas</em></MenuItem>{categorias.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}</Select></FormControl>
          <FormControl sx={{flex: '1 1 150px'}} size="small"><InputLabel>Status</InputLabel><Select name="status" value={filtros.status} label="Status" onChange={handleFiltroChange}><MenuItem value=""><em>Todos</em></MenuItem><MenuItem value="Pendente">Pendente</MenuItem><MenuItem value="Pago">Pago</MenuItem><MenuItem value="Atrasado">Atrasado</MenuItem></Select></FormControl>
          <TextField name="data_competencia_inicio" label="De:" type="date" sx={{flex: '1 1 150px'}} size="small" value={filtros.data_competencia_inicio} onChange={handleFiltroChange} InputLabelProps={{ shrink: true }} />
          <TextField name="data_competencia_fim" label="Até:" type="date" sx={{flex: '1 1 150px'}} size="small" value={filtros.data_competencia_fim} onChange={handleFiltroChange} InputLabelProps={{ shrink: true }} />
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" onClick={() => handleExport('excel')} disabled={exporting}>{exporting ? <CircularProgress size={20}/> : 'Excel'}</Button>
            <Button variant="outlined" size="small" onClick={() => handleExport('pdf')} disabled={exporting}>{exporting ? <CircularProgress size={20}/> : 'PDF'}</Button>
          </Box>
        </Box>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><TableSortLabel active={orderBy === 'descricao'} direction={ordem} onClick={() => handleRequestSort('descricao')}>Descrição</TableSortLabel></TableCell>
              <TableCell align="center"><TableSortLabel active={orderBy === 'data_competencia'} direction={ordem} onClick={() => handleRequestSort('data_competencia')}>Competência</TableSortLabel></TableCell>
              <TableCell align="center"><TableSortLabel active={orderBy === 'data_vencimento'} direction={ordem} onClick={() => handleRequestSort('data_vencimento')}>Vencimento</TableSortLabel></TableCell>
              <TableCell align="right"><TableSortLabel active={orderBy === 'valor'} direction={ordem} onClick={() => handleRequestSort('valor')}>Valor (R$)</TableSortLabel></TableCell>
              <TableCell align="center">Categoria</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Nota Fiscal</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? ( <TableRow><TableCell colSpan={8} align="center" sx={{py: 4}}><CircularProgress /></TableCell></TableRow> )
            : error ? ( <TableRow><TableCell colSpan={8} align="center" sx={{py: 4}}><Typography color="error">{error}</Typography></TableCell></TableRow> )
            : pagamentos.length === 0 ? ( <TableRow><TableCell colSpan={8} align="center" sx={{py: 4}}>Nenhum pagamento encontrado.</TableCell></TableRow> )
            : ( pagamentos.map((pagamento) => (
              <TableRow key={pagamento.id} hover>
                <TableCell>{pagamento.descricao}</TableCell>
                <TableCell align="center">{new Date(pagamento.data_competencia + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                <TableCell align="center">{pagamento.data_vencimento ? new Date(pagamento.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                <TableCell align="right">{parseFloat(pagamento.valor).toFixed(2)}</TableCell>
                <TableCell align="center">{pagamento.categoria_nome}</TableCell>
                <TableCell align="center">{pagamento.status_display}</TableCell>
                <TableCell align="center">{pagamento.numero_nota_fiscal || 'Pendente'}</TableCell>
                <TableCell align="center">
                    <Button size="small" onClick={() => handleOpenEditModal(pagamento)}>Editar</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteClick(pagamento.id)}>Excluir</Button>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </TableContainer>

      <PagamentoModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSaveSuccess={fetchPagamentos} // Passando a função de refetch diretamente
        pagamentoParaEditar={pagamentoAtual}
      />
      <ConfirmDialog 
        open={confirmDialogOpen} 
        onClose={() => setConfirmDialogOpen(false)} 
        onConfirm={confirmDelete} 
        title="Confirmar Exclusão" 
        message="Tem certeza que deseja excluir este pagamento?"
      />
    </Container>
  );
};

export default PagamentosPage;