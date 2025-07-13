# api/filters.py

import django_filters
from django.utils import timezone
from django.db.models import Q
from .models import Pagamento

class PagamentoFilter(django_filters.FilterSet):
    # Filtros existentes
    data_competencia_inicio = django_filters.DateFilter(field_name="data_competencia", lookup_expr='gte')
    data_competencia_fim = django_filters.DateFilter(field_name="data_competencia", lookup_expr='lte')
    descricao = django_filters.CharFilter(field_name='descricao', lookup_expr='icontains')

    # Filtro customizado para o status calculado
    status = django_filters.CharFilter(method='filter_by_calculated_status')

    # Ordenação
    ordering = django_filters.OrderingFilter(
        fields=(
            ('data_competencia', 'data_competencia'),
            ('data_vencimento', 'data_vencimento'),
            ('valor', 'valor'),
            ('descricao', 'descricao'),
            ('categoria__nome', 'categoria'),
        ),
    )

    class Meta:
        model = Pagamento
        # O filtro de 'status' agora é customizado, então o removemos daqui
        fields = ['categoria'] 

    def filter_by_calculated_status(self, queryset, name, value):
        """
        Filtra o queryset com base no status calculado (Pago, Pendente, Atrasado).
        """
        today = timezone.now().date()
        if value == 'Pago':
            return queryset.filter(status='Pago')
        if value == 'Pendente':
            return queryset.filter(
                Q(status='Pendente') & (Q(data_vencimento__gte=today) | Q(data_vencimento__isnull=True))
            )
        if value == 'Atrasado':
            return queryset.filter(status='Pendente', data_vencimento__lt=today)
        # Se nenhum filtro de status for fornecido, retorna o queryset original
        return queryset