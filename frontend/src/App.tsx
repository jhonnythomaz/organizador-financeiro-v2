import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PagamentosPage from './pages/PagamentosPage';
import CategoriasPage from './pages/CategoriasPage';
import RelatoriosPage from './pages/RelatoriosPage';
import AdminClientesPage from './pages/AdminClientesPage';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress, Container } from '@mui/material';
import logo from './logo.png';

const PrivateRoute = () => {
  const { isAuthenticated, user } = useAuth();
  if (!user && isAuthenticated) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Container>;
  }
  return isAuthenticated ? <Layout /> : <Navigate to="/login" />;
};

const AdminRoute = () => {
    const { user } = useAuth();
    return user?.is_superuser ? <Outlet /> : <Navigate to="/dashboard" />;
};

const Layout = () => {
  const { logout, user } = useAuth();
  return (
    <><AppBar position="static"><Toolbar>
        <Box component="img" src={logo} alt="Logo" sx={{ height: 40, mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Alecrim Financeiro</Typography>
        <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
        <Button color="inherit" component={Link} to="/pagamentos">Pagamentos</Button>
        <Button color="inherit" component={Link} to="/categorias">Categorias</Button>
        <Button color="inherit" component={Link} to="/relatorios">Relatórios</Button>
        {user?.is_superuser && <Button color="inherit" component={Link} to="/admin/clientes">Admin</Button>}
        <Button color="inherit" onClick={logout}>Sair</Button>
    </Toolbar></AppBar><Box component="main"><Outlet /></Box></>
  );
};

function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Router><Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pagamentos" element={<PagamentosPage />} />
            <Route path="/categorias" element={<CategoriasPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route element={<AdminRoute />}><Route path="/admin/clientes" element={<AdminClientesPage />} /></Route>
        </Route>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes></Router>
  );
}
export default App;