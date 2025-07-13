# setup_tenant.py (na pasta raiz do projeto)

import os
import django

print("--- Configurando ambiente Django para script ---")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
print("--- Ambiente configurado ---")

from django.contrib.auth.models import User
from api.models import Cliente, PerfilUsuario

def run():
    print("--- Iniciando Script de Setup ---")

    # --- Defina aqui os dados do seu administrador principal ---
    USERNAME = 'admin'
    PASSWORD = 'admin' # Troque por uma senha segura em um projeto real
    EMAIL = 'admin@exemplo.com'
    NOME_EMPRESA = 'Alecrim Cuidados Especiais (Minha Empresa)'

    # --- Lógica de Criação ---
    if not User.objects.filter(username=USERNAME).exists():
        print(f"Criando superusuário: {USERNAME}...")
        super_usuario = User.objects.create_superuser(
            username=USERNAME,
            email=EMAIL,
            password=PASSWORD
        )

        print(f"Criando cliente principal: {NOME_EMPRESA}...")
        cliente_principal = Cliente.objects.create(nome_empresa=NOME_EMPRESA)

        print(f"Associando usuário '{USERNAME}' ao cliente '{NOME_EMPRESA}'...")
        PerfilUsuario.objects.create(usuario=super_usuario, cliente=cliente_principal)

        print("\n✅ Setup do primeiro tenant concluído com sucesso!")
        print(f"   Login: {USERNAME}")
        print(f"   Senha: {PASSWORD}")
    else:
        print(f"⚠️  Usuário '{USERNAME}' já existe. Nenhum dado novo foi criado.")

# Roda a função principal quando o script é executado
if __name__ == '__main__':
    run()