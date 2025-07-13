// src/pages/CategoriasPage.tsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface ICategoria { id: number; nome: string; descricao: string; }

const CategoriasPage: React.FC = () => {
  const [categorias, setCategorias] = useState<ICategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoriaAtual, setCategoriaAtual] = useState<Partial<ICategoria>>({});
  const { showNotification } = useNotification();

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const response = await api.get<ICategoria[]>('/categorias/');
      setCategorias(response.data);
    } catch (err) {
      showNotification('Não foi possível carregar as categorias.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // O useEffect agora chama a função e tem um array de dependências vazio,
  // garantindo que ele só roda uma vez.
  useEffect(() => {
    fetchCategorias();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Adicionamos o comentário para o ESLint não reclamar da dependência faltante,
  // pois sabemos que queremos que este efeito rode apenas uma vez.

  const handleOpenModal = (categoria: Partial<ICategoria> = {}) => { setCategoriaAtual(categoria); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setCategoriaAtual({}); };

  const handleSave = async () => {
    if (!categoriaAtual.nome) {
        showNotification('O nome da categoria é obrigatório.', 'warning');
        return;
    }
    try {
      if (categoriaAtual.id) {
        await api.put(`/categorias/${categoriaAtual.id}/`, categoriaAtual);
        showNotification('Categoria atualizada!', 'success');
      } else {
        await api.post('/categorias/', categoriaAtual);
        showNotification('Categoria criada!', 'success');
      }
      handleCloseModal();
      fetchCategorias();
    } catch (error) { showNotification('Erro ao salvar categoria.', 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza? Pagamentos associados perderão esta categoria.')) {
        try {
            await api.delete(`/categorias/${id}/`);
            showNotification('Categoria excluída.', 'info');
            fetchCategorias();
        } catch (error) { showNotification('Erro ao excluir.', 'error'); }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">Gestão de Categorias</Typography>
        <Button variant="contained" onClick={() => handleOpenModal()}>Adicionar Categoria</Button>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Descrição</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead>
          <TableBody>
            {loading ? ( <TableRow><TableCell colSpan={3} align="center"><CircularProgress /></TableCell></TableRow> ) 
            : ( categorias.map((cat) => (
                <TableRow key={cat.id} hover>
                  <TableCell>{cat.nome}</TableCell>
                  <TableCell>{cat.descricao}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => handleOpenModal(cat)}>Editar</Button><Button size="small" color="error" onClick={() => handleDelete(cat.id)}>Excluir</Button></TableCell>
                </TableRow>))
            )}
          </TableBody>
      </Table></TableContainer>
      <Dialog open={modalOpen} onClose={handleCloseModal}><DialogTitle>{categoriaAtual.id ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Nome da Categoria" type="text" fullWidth variant="standard" value={categoriaAtual.nome || ''} onChange={(e) => setCategoriaAtual({ ...categoriaAtual, nome: e.target.value })}/>
          <TextField margin="dense" label="Descrição (opcional)" type="text" fullWidth variant="standard" value={categoriaAtual.descricao || ''} onChange={(e) => setCategoriaAtual({ ...categoriaAtual, descricao: e.target.value })} />
        </DialogContent>
        <DialogActions><Button onClick={handleCloseModal}>Cancelar</Button><Button onClick={handleSave}>Salvar</Button></DialogActions>
      </Dialog>
    </Container>
  );
};
export default CategoriasPage;