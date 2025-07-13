// src/context/NotificationContext.tsx

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';

// O 'AlertColor' é o tipo para as cores do alerta (success, error, warning, info)
type AlertColor = 'success' | 'error' | 'warning' | 'info';

// O que nosso contexto vai fornecer para a aplicação
interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void;
}

// Criação do Contexto
const NotificationContext = createContext<NotificationContextType>(null!);

// Componente Provedor que vai "embrulhar" nossa aplicação
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('success');

  // Função que os outros componentes vão chamar para mostrar uma notificação
  const showNotification = (msg: string, sev: AlertColor = 'success') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  // Função para fechar a notificação
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    // Impede que a notificação feche se o usuário clicar fora dela
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* O componente Snackbar do Material-UI que fica "escutando" para aparecer */}
      <Snackbar 
        open={open} 
        autoHideDuration={6000} // Fecha automaticamente após 6 segundos
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Posição na tela
      >
        {/* Usamos o Alert para dar a cor e o ícone corretos */}
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

// Hook customizado para facilitar o uso
export const useNotification = () => {
  return useContext(NotificationContext);
};