# api/migrations/0002_create_initial_data.py
from django.db import migrations
import os

def create_superuser_and_tenant(apps, schema_editor):
    """
    Cria um superusuário e o primeiro cliente/tenant,
    usando valores padrão.
    """
    User = apps.get_model('auth', 'User')
    Cliente = apps.get_model('api', 'Cliente')
    PerfilUsuario = apps.get_model('api', 'PerfilUsuario')

    USERNAME = 'admin'
    PASSWORD = 'admin' # Em um projeto real, use variáveis de ambiente
    EMAIL = 'admin@exemplo.com'
    NOME_EMPRESA = 'Alecrim Cuidados Especiais (Admin)'

    # Só cria se o usuário não existir
    if not User.objects.filter(username=USERNAME).exists():
        print(f"\n (Migração) Criando superusuário: {USERNAME}...")
        super_usuario = User.objects.create_superuser(
            username=USERNAME,
            password=PASSWORD,
            email=EMAIL
        )

        print(f" (Migração) Criando cliente principal: {NOME_EMPRESA}...")
        cliente_principal = Cliente.objects.create(nome_empresa=NOME_EMPRESA)

        print(f" (Migração) Associando usuário ao cliente...")
        PerfilUsuario.objects.create(usuario=super_usuario, cliente=cliente_principal)
        print(" (Migração) Setup inicial de dados concluído.")
    else:
        print(f"\n (Migração) Usuário '{USERNAME}' já existe. Nenhuma ação necessária.")


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'), # Garante que as tabelas do app 'api' já foram criadas
        # Adiciona dependência do app de autenticação para garantir que a tabela User exista
        ('auth', '__latest__'),
    ]

    operations = [
        # Roda nossa função Python durante o processo de migração
        migrations.RunPython(create_superuser_and_tenant),
    ]