// src/pages/AdminClientesPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Container, Typography, Paper, List, ListItem, ListItemText, 
  Button, CircularProgress, Box, Divider, Alert 
} from '@mui/material';

// Interface para os dados do cliente que vêm da API
interface ICliente {
  id: number;
  nome_empresa: string;
}

const AdminClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<ICliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Busca a lista de todos os clientes do endpoint de admin
  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get<ICliente[]>('/admin/clientes/');
        setClientes(response.data);
      } catch (err) {
        setError('Você não tem permissão para acessar esta página ou ocorreu um erro no servidor.');
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  // Função para "personificar" um cliente
  const handleGerenciarCliente = (clienteId: number) => {
    localStorage.setItem('cliente_gerenciado_id', clienteId.toString());
    // Navega para o dashboard. O AuthContext e o Interceptor do Axios
    // cuidarão do resto, enviando o header customizado nas próximas requisições.
    navigate('/dashboard'); 
  };

  // Função para parar a personificação e voltar a ser o admin
  const handlePararDeGerenciar = () => {
    localStorage.removeItem('cliente_gerenciado_id');
    navigate('/dashboard');
    // Forçar um recarregamento aqui é uma forma simples de garantir que o estado
    // de todos os componentes seja resetado e os dados do admin sejam buscados.
    window.location.reload(); 
  };

  // Verifica se já estamos gerenciando um cliente
  const clienteGerenciadoId = localStorage.getItem('cliente_gerenciado_id');

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Painel de Administração - Clientes
      </Typography>

      {/* Mostra um alerta se o admin estiver personificando um cliente */}
      {clienteGerenciadoId && (
        <Alert severity="info" action={
          <Button color="inherit" size="small" onClick={handlePararDeGerenciar}>
            PARAR DE GERENCIAR
          </Button>
        } sx={{ mb: 2 }}>
          Você está atualmente gerenciando o cliente com ID: {clienteGerenciadoId}.
        </Alert>
      )}

      <Paper sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <List>
            {clientes.map((cliente, index) => (
              <React.Fragment key={cliente.id}>
                <ListItem
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGerenciarCliente(cliente.id)}
                      // Desabilita o botão se já estiver gerenciando este cliente
                      disabled={clienteGerenciadoId === String(cliente.id)}
                    >
                      Gerenciar
                    </Button>
                  }
                >
                  <ListItemText 
                    primary={cliente.nome_empresa} 
                    secondary={`ID do Cliente: ${cliente.id}`} 
                  />
                </ListItem>
                {index < clientes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default AdminClientesPage;