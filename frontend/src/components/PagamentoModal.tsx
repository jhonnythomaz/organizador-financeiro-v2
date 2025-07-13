// src/components/PagamentoModal.tsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Box, Divider } from '@mui/material';
import api from '../services/api';
import { IPagamento, IApiResponse, ICategoria } from '../pages/PagamentosPage';
import { useNotification } from '../context/NotificationContext';
import { useFormik } from 'formik';
import * as yup from 'yup';

// --- Interfaces ---
interface PagamentoModalProps {
  open: boolean;
  onClose: () => void;
  onSaveSuccess: (data: IApiResponse) => void;
  pagamentoParaEditar?: IPagamento | null;
}

// --- Validação Condicional com Yup ---
const validationSchema = yup.object({
  descricao: yup.string().max(255).required('A descrição é obrigatória'),
  valor: yup.number().positive('O valor deve ser positivo').required('O valor é obrigatório'),
  data_competencia: yup.date().required('A data de competência é obrigatória'),
  // A data de vencimento só é obrigatória se o tipo de pagamento for 'A Pagar'
  data_vencimento: yup.string().when('tipo_pagamento', {
      is: 'A Pagar',
      then: (schema) => schema.required('A data de vencimento é obrigatória para contas a pagar.'),
      otherwise: (schema) => schema.notRequired(),
  }),
});

const PagamentoModal: React.FC<PagamentoModalProps> = ({ open, onClose, onSaveSuccess, pagamentoParaEditar }) => {
  const [categorias, setCategorias] = useState<ICategoria[]>([]);
  const { showNotification } = useNotification();

  const formik = useFormik({
    initialValues: {
      tipo_pagamento: 'A Pagar', // Novo campo para controlar a lógica
      descricao: '', valor: '', data_competencia: '', data_vencimento: '',
      categoria: '', status: 'Pendente', numero_nota_fiscal: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Prepara os dados para enviar para a API
        const dadosParaEnviar = {
          descricao: values.descricao,
          valor: values.valor,
          data_competencia: values.data_competencia,
          // Se for 'Pago no Ato', envia 'null' para vencimento e 'Pago' para status
          data_vencimento: values.tipo_pagamento === 'A Pagar' ? values.data_vencimento : null,
          status: values.tipo_pagamento === 'A Pagar' ? 'Pendente' : 'Pago',
          categoria: values.categoria || null,
          numero_nota_fiscal: values.numero_nota_fiscal || null,
        };
        
        let response;
        if (pagamentoParaEditar) {
          response = await api.put<IApiResponse>(`/pagamentos/${pagamentoParaEditar.id}/`, dadosParaEnviar);
          showNotification('Pagamento atualizado!', 'success');
        } else {
          response = await api.post<IApiResponse>('/pagamentos/', dadosParaEnviar);
          showNotification('Pagamento criado!', 'success');
        }
        onSaveSuccess(response.data);
        onClose();
      } catch (error) {
        showNotification('Erro ao salvar pagamento.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Efeitos para buscar dados e popular o formulário
  useEffect(() => {
    if (open) {
      api.get<ICategoria[]>('/categorias/').then(res => setCategorias(res.data));
      if (pagamentoParaEditar) {
        // Se tem data de vencimento, é 'A Pagar', senão, é 'Pago no Ato'
        const tipo = pagamentoParaEditar.data_vencimento ? 'A Pagar' : 'Pago no Ato';
        formik.setValues({
          tipo_pagamento: tipo,
          descricao: pagamentoParaEditar.descricao,
          valor: pagamentoParaEditar.valor,
          data_competencia: pagamentoParaEditar.data_competencia.split('T')[0],
          data_vencimento: pagamentoParaEditar.data_vencimento ? pagamentoParaEditar.data_vencimento.split('T')[0] : '',
          categoria: String(pagamentoParaEditar.categoria || ''),
          status: pagamentoParaEditar.status,
          numero_nota_fiscal: pagamentoParaEditar.numero_nota_fiscal || '',
        });
      } else {
        formik.resetForm();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pagamentoParaEditar]);

  return (
    <Dialog open={open} onClose={() => { formik.resetForm(); onClose(); }} fullWidth maxWidth="sm">
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{pagamentoParaEditar ? 'Editar Pagamento' : 'Novo Pagamento'}</DialogTitle>
        <DialogContent>
            <FormControl fullWidth margin="normal" variant="standard">
                <InputLabel>Tipo de Pagamento</InputLabel>
                <Select
                    name="tipo_pagamento"
                    value={formik.values.tipo_pagamento}
                    onChange={formik.handleChange}
                >
                    <MenuItem value="A Pagar">A Pagar (Boleto, Fatura, etc.)</MenuItem>
                    <MenuItem value="Pago no Ato">Pago no Ato (Débito, PIX, etc.)</MenuItem>
                </Select>
            </FormControl>
            <Divider sx={{ my: 2 }} />
            <TextField autoFocus margin="dense" name="descricao" label="Descrição" type="text" fullWidth variant="standard" value={formik.values.descricao} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.descricao && Boolean(formik.errors.descricao)} helperText={formik.touched.descricao && formik.errors.descricao}/>
            <TextField margin="dense" name="valor" label="Valor" type="number" fullWidth variant="standard" value={formik.values.valor} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.valor && Boolean(formik.errors.valor)} helperText={formik.touched.valor && formik.errors.valor}/>
            <TextField margin="dense" name="data_competencia" label="Data da Competência/Compra" type="date" fullWidth variant="standard" InputLabelProps={{ shrink: true }} value={formik.values.data_competencia} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.data_competencia && Boolean(formik.errors.data_competencia)} helperText={formik.touched.data_competencia && formik.errors.data_competencia}/>

            {/* Campos que só aparecem se for "A Pagar" */}
            {formik.values.tipo_pagamento === 'A Pagar' && (
                <TextField margin="dense" name="data_vencimento" label="Data de Vencimento" type="date" fullWidth variant="standard" InputLabelProps={{ shrink: true }} value={formik.values.data_vencimento} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.data_vencimento && Boolean(formik.errors.data_vencimento)} helperText={formik.touched.data_vencimento && formik.errors.data_vencimento}/>
            )}

            <FormControl fullWidth margin="dense" variant="standard"><InputLabel>Categoria</InputLabel><Select name="categoria" value={formik.values.categoria} onChange={formik.handleChange}><MenuItem value=""><em>Nenhuma</em></MenuItem>{categorias.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>)}</Select></FormControl>
            <TextField margin="dense" name="numero_nota_fiscal" label="Número da Nota Fiscal (opcional)" type="text" fullWidth variant="standard" value={formik.values.numero_nota_fiscal} onChange={formik.handleChange}/>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => { formik.resetForm(); onClose(); }}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}>{formik.isSubmitting ? <CircularProgress size={24} /> : 'Salvar'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
export default PagamentoModal;