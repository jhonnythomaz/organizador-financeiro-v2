# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PagamentoViewSet, 
    CategoriaViewSet, 
    ClienteAdminViewSet, 
    get_user_profile,
    ExportarDadosView # Importa a nova view
)

router = DefaultRouter()
router.register(r'pagamentos', PagamentoViewSet, basename='pagamento')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'admin/clientes', ClienteAdminViewSet, basename='admin-cliente')

urlpatterns = [
    path('pagamentos/exportar/', ExportarDadosView.as_view(), name='exportar_dados'),
    path('', include(router.urls)),
    path('profile/', get_user_profile, name='user_profile'),
    # Nova rota para exportar dados
    
]