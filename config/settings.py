# config/settings.py

import os
from pathlib import Path
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Configurações de Segurança e Ambiente ---
# Lê a SECRET_KEY do ambiente. Em desenvolvimento, usa uma chave insegura.
SECRET_KEY = os.environ.get(
    'SECRET_KEY', 
    'django-insecure-fallback-key-para-desenvolvimento-local'
)

# O modo DEBUG é 'True' apenas se a variável de ambiente DEBUG for 'True'.
# Em produção (no Render), ela não existirá ou será 'False'.
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Lê os hosts permitidos do ambiente, separado por vírgula.
# O Render.com gerencia isso, mas '*' é um bom fallback para iniciar.
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')


# --- Application definition ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    # Whitenoise, para servir arquivos estáticos de forma eficiente em produção.
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
    
    # Nossos Apps
    'api.apps.ApiConfig',

    # Apps de Terceiros
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # O middleware do Whitenoise deve vir logo após o de segurança.
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# --- Banco de Dados Lendo do Ambiente ---
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'organizador_db',
        'USER': 'postgres',
        'PASSWORD': '@Jklpm2pb', # Seu valor padrão para desenvolvimento local
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
# Lógica padrão para serviços como Render e Heroku: se a variável DATABASE_URL existir,
# ela sobrescreve a configuração 'default'.
if 'DATABASE_URL' in os.environ:
    DATABASES['default'] = dj_database_url.config(conn_max_age=600, ssl_require=True)


# --- Validação de Senha ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Internacionalização ---
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# --- Arquivos Estáticos (Configuração para Produção com Whitenoise) ---
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# --- Outras Configurações ---
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configuração de CORS para Produção
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
# Em produção, o frontend e o backend terão URLs diferentes.
# O Django precisa confiar na URL do frontend para evitar erros de CSRF.
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',),
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
}