# api/views.py

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum, Q

import io
import openpyxl
from openpyxl.styles import Font, Alignment
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch

from django_filters.rest_framework import DjangoFilterBackend

from .models import Pagamento, Categoria, Cliente, User, PerfilUsuario
from .serializers import PagamentoSerializer, CategoriaSerializer, ClienteSerializer
from .filters import PagamentoFilter

def get_cliente_from_request(request):
    user = request.user
    if not hasattr(user, 'perfilusuario'): return None 
    if user.is_superuser and request.headers.get('X-Cliente-Gerenciado-Id'):
        try:
            cliente_id = int(request.headers.get('X-Cliente-Gerenciado-Id'))
            return Cliente.objects.get(id=cliente_id)
        except (ValueError, Cliente.DoesNotExist):
            return user.perfilusuario.cliente
    return user.perfilusuario.cliente

class PagamentoPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000
    def get_paginated_response(self, data):
        queryset = self.page.paginator.object_list
        today = timezone.now().date()
        agregados = queryset.aggregate(
            total_pago=Sum('valor', filter=Q(status='Pago')),
            total_pendente=Sum('valor', filter=Q(status='Pendente') & (Q(data_vencimento__gte=today) | Q(data_vencimento__isnull=True))),
            total_atrasado=Sum('valor', filter=Q(status='Pendente', data_vencimento__lt=today)),
        )
        return Response({
            'count': self.page.paginator.count, 'next': self.get_next_link(), 'previous': self.get_previous_link(),
            'totais': {
                'pago': agregados.get('total_pago') or 0,
                'pendente': agregados.get('total_pendente') or 0,
                'atrasado': agregados.get('total_atrasado') or 0,
            },
            'results': data
        })

class CategoriaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CategoriaSerializer
    def get_queryset(self):
        cliente = get_cliente_from_request(self.request)
        return Categoria.objects.filter(cliente=cliente) if cliente else Categoria.objects.none()
    def perform_create(self, serializer):
        cliente = get_cliente_from_request(self.request)
        serializer.save(cliente=cliente)

class PagamentoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PagamentoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = PagamentoFilter
    pagination_class = PagamentoPagination
    def get_queryset(self):
        cliente = get_cliente_from_request(self.request)
        return Pagamento.objects.filter(cliente=cliente).select_related('categoria') if cliente else Pagamento.objects.none()
    def get_serializer_context(self):
        return {'request': self.request}
    def perform_create(self, serializer):
        cliente = get_cliente_from_request(self.request)
        serializer.save(cliente=cliente)

class ClienteAdminViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Cliente.objects.all().order_by('nome_empresa')
    serializer_class = ClienteSerializer
    permission_classes = [IsAdminUser]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    user = request.user
    return Response({
        'id': user.id, 'username': user.username, 'email': user.email,
        'is_superuser': user.is_superuser,
        'cliente_id': user.perfilusuario.cliente.id if hasattr(user, 'perfilusuario') else None
    })

class ExportarDadosView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        formato = request.query_params.get('formato', 'excel')
        pagamento_filter = PagamentoFilter(request.GET, queryset=Pagamento.objects.filter(cliente=get_cliente_from_request(request)))
        queryset = pagamento_filter.qs.order_by('data_competencia')

        if formato == 'pdf':
            return self.gerar_pdf(queryset, request)
        return self.gerar_excel(queryset, request)

    def gerar_excel(self, queryset, request):
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = 'Pagamentos'
        headers = ["ID", "Descrição", "Valor", "Competência", "Vencimento", "Data Pagamento", "Status", "Categoria", "Nota Fiscal"]
        sheet.append(headers)
        bold_font = Font(bold=True)
        for cell in sheet[1]:
            cell.font = bold_font
        for pg in queryset:
            sheet.append([
                pg.id, pg.descricao, pg.valor, pg.data_competencia, pg.data_vencimento, pg.data_pagamento,
                pg.status_calculado, pg.categoria.nome if pg.categoria else 'N/A', pg.numero_nota_fiscal
            ])
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="pagamentos.xlsx"'
        workbook.save(response)
        return response

    def gerar_pdf(self, queryset, request):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        cliente = get_cliente_from_request(request)
        p.setFont("Helvetica-Bold", 16); p.drawString(inch, height - inch, f"Relatório de Pagamentos")
        p.setFont("Helvetica", 12); p.drawString(inch, height - 1.2*inch, f"Cliente: {cliente.nome_empresa}")
        y = height - 2*inch
        p.setFont("Helvetica-Bold", 10)
        p.drawString(inch, y, "Vencimento"); p.drawString(2*inch, y, "Descrição"); p.drawString(5*inch, y, "Status"); p.drawRightString(width - inch, y, "Valor (R$)")
        y -= 15; p.line(inch, y, width - inch, y); y -= 20
        p.setFont("Helvetica", 10)
        total = 0
        for pg in queryset:
            if y < inch: p.showPage(); y = height - inch; p.setFont("Helvetica", 10)
            venc_str = pg.data_vencimento.strftime('%d/%m/%Y') if pg.data_vencimento else "N/A"
            p.drawString(inch, y, venc_str); p.drawString(2*inch, y, pg.descricao[:45]); p.drawString(5*inch, y, pg.status_calculado)
            valor_str = f"R$ {pg.valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."); p.drawRightString(width - inch, y, valor_str)
            total += pg.valor; y -= 20
        y -= 10; p.line(inch, y, width - inch, y); y -= 20
        p.setFont("Helvetica-Bold", 12); p.drawString(5*inch, y, "Total Filtrado:"); p.drawRightString(width - inch, y, f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        p.showPage(); p.save(); buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="relatorio_pagamentos.pdf"'
        return response