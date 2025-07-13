import { createTheme } from '@mui/material/styles';
const theme = createTheme({
  palette: { primary: { main: '#2E7D32', light: '#4CAF50', dark: '#1B5E20', contrastText: '#ffffff' }, secondary: { main: '#FFA000', contrastText: '#ffffff' }, background: { default: '#f4f6f8', paper: '#ffffff' }, text: { primary: '#212121', secondary: '#757575' } },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', h4: { fontWeight: 700, color: '#1B5E20' }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 } },
  shape: { borderRadius: 8 },
  components: { MuiPaper: { styleOverrides: { root: { boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.05)' } } }, MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 'bold', borderRadius: 6 } } }, MuiAppBar: { styleOverrides: { root: { boxShadow: 'none' } } } }
});
export default theme;