// src/services/api.ts

import axios from 'axios';

// --- Lógica Inteligente de URL Base ---

// 'process.env.NODE_ENV' é uma variável injetada pelo Create React App.
// Ela é 'development' quando você roda `npm start` e 'production' quando você roda `npm run build`.
const isProduction = process.env.NODE_ENV === 'production';

// O Vercel injeta as variáveis de ambiente que configuramos no painel dele.
// Elas precisam começar com REACT_APP_ para serem acessíveis no código.
const productionApiUrl = `${process.env.REACT_APP_API_URL}/api`;

const developmentApiUrl = 'http://localhost:8000/api';

// Seleciona a URL correta com base no ambiente
const baseURL = isProduction ? productionApiUrl : developmentApiUrl;

console.log(`API baseURL: ${baseURL}`); // Log para depuração, você pode remover depois.

// Cria a instância do Axios já configurada
const api = axios.create({
  baseURL: baseURL,
});

// --- Interceptor de Requisição ---
// Esta função é executada ANTES de QUALQUER requisição ser enviada.
api.interceptors.request.use(
  (config) => {
    // Pega o token de acesso do localStorage do navegador
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Anexa o token ao cabeçalho, se existir
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Pega o ID do cliente que o admin está gerenciando (se existir)
    const clienteGerenciadoId = localStorage.getItem('cliente_gerenciado_id');
    if (clienteGerenciadoId) {
      // Anexa o header customizado
      config.headers['X-Cliente-Gerenciado-Id'] = clienteGerenciadoId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;