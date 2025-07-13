// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  CircularProgress, 
  Paper 
} from '@mui/material';
import api from '../services/api';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = useAuth(); // Usando nosso hook de autenticação

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o recarregamento da página ao submeter o formulário
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/token/', { username, password });
      // Chama a função de login do nosso AuthContext
      await auth.login(response.data.access); 
      // Após o login e o perfil carregado, navega para o dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Usuário ou senha inválidos!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ 
        marginTop: 8, 
        padding: 4, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        <Typography component="h1" variant="h5">
          Bem-vindo ao Alecrim Financeiro
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Nome de Usuário"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2" align="center" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;