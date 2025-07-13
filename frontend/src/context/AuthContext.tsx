// src/context/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import api from '../services/api';

// --- Interfaces ---
interface IUser {
    id: number;
    username: string;
    is_superuser: boolean;
    cliente_id: number | null;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: IUser | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

// --- Criação do Contexto ---
const AuthContext = createContext<AuthContextType>(null!);

// --- Componente Provedor ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const hasToken = !!localStorage.getItem('accessToken');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasToken);

    // Função de Logout
    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('cliente_gerenciado_id');
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    // Função para buscar o perfil do usuário na API
    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get<IUser>('/profile/');
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Sessão inválida ou expirada, deslogando.");
            logout();
        }
    }, [logout]);

    // Efeito que roda quando o app carrega para verificar se já existe um token
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetchProfile();
        }
    }, [fetchProfile]);

    // Função de Login que será chamada pela LoginPage
    const login = async (token: string) => {
        localStorage.setItem('accessToken', token);
        await fetchProfile(); // Busca o perfil imediatamente após salvar o token
    };

    const value = { isAuthenticated, user, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Hook customizado para facilitar o uso do contexto ---
export const useAuth = () => {
    return useContext(AuthContext);
};