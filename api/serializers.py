# api/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import Pagamento, Categoria, Cliente, User

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'nome_empresa']

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'descricao']

class PagamentoSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='status_calculado', read_only=True)
    
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(), 
        required=False, 
        allow_null=True
    )
    
    class Meta:
        model = Pagamento
        fields = [
            'id', 'descricao', 'valor', 'data_competencia', 'data_vencimento', 
            'data_pagamento', 'status', 'status_display', 'numero_nota_fiscal', 
            'categoria', 'categoria_nome', 'data_criacao'
        ]

    # --- A LÓGICA DE VALIDAÇÃO FOI ATUALIZADA ---
    def validate(self, data):
        """
        Validação customizada para o objeto de pagamento inteiro.
        """
        status = data.get('status')
        data_vencimento = data.get('data_vencimento')
        data_pagamento = data.get('data_pagamento')

        # REGRA 1: Se o status é Pendente, a data de vencimento é obrigatória.
        if status == 'Pendente' and not data_vencimento:
            raise serializers.ValidationError({
                'data_vencimento': 'A data de vencimento é obrigatória para pagamentos pendentes.'
            })

        # REGRA 2: Se o status for Pago e não houver data de pagamento, define como hoje.
        if status == 'Pago' and not data_pagamento:
            data['data_pagamento'] = timezone.now().date()
        
        # REGRA 3: Se o status for Pendente, limpa a data de pagamento para garantir consistência.
        if status == 'Pendente':
            data['data_pagamento'] = None

        return super().validate(data)

    def validate_categoria(self, value):
        if value and 'request' in self.context:
            cliente_do_usuario = self.context['request'].user.perfilusuario.cliente
            if value.cliente != cliente_do_usuario:
                raise serializers.ValidationError("Você só pode usar categorias da sua própria empresa.")
        return value