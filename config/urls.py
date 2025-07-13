# config/urls.py

from django.contrib import admin
from django.urls import path, include
# Importa as views do Simple JWT
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Rota principal da nossa API (categorias, pagamentos, etc.)
    path('api/', include('api.urls')),
    
    # Rotas de Autenticação JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]