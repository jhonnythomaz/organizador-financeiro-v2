<div align="center">

# Organizador Financeiro V2
Gestão de pagamentos, categorias e clientes (multi-empresa) com backend em **Django REST Framework** e frontend em **React + TypeScript + MUI**.

</div>

## Visão Geral
Este projeto provê uma aplicação completa para controle de pagamentos (a pagar / pagos / atrasados), categorização de despesas/receitas e administração multi‑cliente. 

Principais recursos:
- Autenticação via **JWT (djangorestframework-simplejwt)**.
- Suporte multi‑empresa: administradores podem alternar o cliente ativo via header `X-Cliente-Gerenciado-Id`.
- CRUD de Categorias e Pagamentos com filtros avançados e paginação.
- Cálculo dinâmico de status: `Pago`, `Pendente`, `Atrasado`.
- Exportação de pagamentos filtrados para **Excel** e **PDF**.
- Frontend responsivo com **Material UI**, gráficos (Chart.js) e fluxo de autenticação.
- Migração inicial cria superusuário padrão e cliente raiz.

## Estrutura do Repositório
```
organizador-financeiro-v2/
  manage.py              # Entrypoint Django
  requirements.txt       # Dependências backend
  setup_tenant.py        # (Opcional) script extra de tenant (se for extendido)
  api/                   # App principal (models, views, serializers, filtros, urls)
  config/                # Configurações do projeto Django
  frontend/              # Aplicação React + TS (Create React App)
```

### Backend (`api/`)
Modelos principais:
- `Cliente`: representa a empresa/tenant.
- `PerfilUsuario`: vincula `User` (autenticação Django) a um `Cliente`.
- `Categoria`: categorias por cliente.
- `Pagamento`: registros financeiros com campos de datas, valor, nota fiscal e status.

Outros componentes:
- `filters.py`: `PagamentoFilter` com filtros por período, descrição, status calculado e ordenação.
- `serializers.py`: validações customizadas (ex.: data_vencimento obrigatória se pendente).
- `views.py`: ViewSets REST + exportação PDF/Excel + paginação com totais agregados.
- `migrations/0002_create_initial_data.py`: cria superusuário `admin` (senha `admin`) e cliente inicial.

### Frontend (`frontend/`)
Principais elementos:
- `context/AuthContext.tsx`: gerenciamento de autenticação e tokens.
- `context/NotificationContext.tsx`: feedback de sucesso/erro.
- `pages/`: telas (Login, Dashboard, Pagamentos, Categorias, Relatórios, Administração de Clientes).
- `components/`: componentes reutilizáveis (modal de pagamento, diálogo de confirmação, gráfico por categoria).
- `services/api.ts`: instância Axios com injeção automática de JWT e header de cliente gerenciado.

## Autenticação & Multi‑Cliente
- Login gera tokens JWT (armazenados em `localStorage`).
- Cada requisição envia `Authorization: Bearer <token>`.
- Administradores podem gerenciar diferentes clientes adicionando `cliente_gerenciado_id` no `localStorage`; o interceptor gera o header `X-Cliente-Gerenciado-Id`.
- Endpoint `/api/profile/` retorna dados do usuário + `cliente_id` corrente.

## Lógica de Status de Pagamento
Status armazenado: `Pago` ou `Pendente`.
Status calculado (exposto como `status_display`):
- `Pago`: se status = Pago.
- `Atrasado`: se status = Pendente e `data_vencimento` < hoje.
- `Pendente`: demais casos.

## Exportações
Endpoint: `GET /api/pagamentos/exportar/?formato=excel|pdf` com os mesmos parâmetros de filtro usados em `/api/pagamentos/`.

## Filtros de Pagamentos (query params)
- `data_competencia_inicio=YYYY-MM-DD`
- `data_competencia_fim=YYYY-MM-DD`
- `descricao=<substring>`
- `status=Pago|Pendente|Atrasado` (cálculo dinâmico)
- `categoria=<id>`
- `ordering=campo` (ex.: `ordering=-data_vencimento`, campos: `data_competencia`, `data_vencimento`, `valor`, `descricao`, `categoria`)

## Endpoints Principais (Resumo)
Base: `/api/`

| Recurso           | Método           | Endpoint                             | Descrição                                |
| ----------------- | ---------------- | ------------------------------------ | ---------------------------------------- |
| Perfil            | GET              | `/profile/`                          | Dados do usuário logado                  |
| Categorias        | GET/POST         | `/categorias/`                       | Listar / criar                           |
| Categorias        | PUT/PATCH/DELETE | `/categorias/{id}/`                  | Atualizar / remover                      |
| Pagamentos        | GET/POST         | `/pagamentos/`                       | Listar (com paginação & totais) / criar  |
| Pagamentos        | PUT/PATCH/DELETE | `/pagamentos/{id}/`                  | Atualizar / remover                      |
| Pagamentos Export | GET              | `/pagamentos/exportar/?formato=excel | pdf`                                     | Exportação |
| Clientes (Admin)  | GET              | `/admin/clientes/`                   | Listagem de clientes (somente superuser) |

> Observação: endpoints de autenticação JWT (obtenção/refresh) podem ser expostos via `rest_framework_simplejwt` (configure urls conforme necessidade, ex.: `/api/token/`, `/api/token/refresh/`).

## Pré‑requisitos
- Python 3.11+ (recomendado)
- Node.js 18+ / npm 9+
- PostgreSQL 14+ (ou ajuste para SQLite em desenvolvimento se desejar)
- (Opcional Prod) Servidor WSGI (gunicorn) e serviço de entrega (Render / Heroku / etc.)

## Passo a Passo Rápido (Desenvolvimento)
1. Clonar repositório:
	```bash
	git clone <url-do-repo>
	cd organizador-financeiro-v2
	```
2. Criar & ativar virtualenv (Windows PowerShell):
	```bash
	python -m venv .venv
	.venv\Scripts\Activate.ps1
	```
3. Instalar dependências backend:
	```bash
	pip install -r requirements.txt
	```
4. Configurar banco (ajuste credenciais em `config/settings.py` ou use `DATABASE_URL`).
5. Aplicar migrações:
	```bash
	python manage.py migrate
	```
6. (Opcional) Criar outro superusuário:
	```bash
	python manage.py createsuperuser
	```
7. Iniciar backend:
	```bash
	python manage.py runserver
	```
8. Instalar dependências frontend:
	```bash
	cd frontend
	npm install
	```
9. Rodar frontend:
	```bash
	npm start
	```
10. Acessar: http://localhost:3000

Credenciais iniciais (migração): `admin / admin`.

## Testes
Backend (pytest + pytest-django):
```bash
pytest
```
Frontend (Jest / React Testing Library):
```bash
npm test
```

## Variáveis de Ambiente (Exemplos)
Backend (.env ou export antes de rodar):
```
SECRET_KEY=chave-super-secreta
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
DATABASE_URL=postgres://usuario:senha@localhost:5432/organizador_db
```

Frontend (arquivo `.env` na pasta `frontend/`):
```
REACT_APP_API_URL=https://url-do-backend
```

## Build de Produção
Frontend:
```bash
cd frontend
npm run build
```
Servidor (exemplo gunicorn):
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```
Certifique-se de coletar arquivos estáticos se adicionar app com templates/estáticos:
```bash
python manage.py collectstatic --noinput
```

## Decisões de Arquitetura
- Separação clara frontend/backend facilita deploy independentes.
- Uso de `rest_framework_simplejwt` simplifica autenticação stateless.
- Paginação customizada retorna totais agregados sem segunda chamada.
- Exportação implementada diretamente (openpyxl / reportlab) evitando dependências mais pesadas.
- Middleware `WhiteNoise` para servir estáticos em produção simples.

## Segurança (Pontos de Atenção)
- Alterar a senha padrão do superusuário imediatamente em produção.
- Definir `SECRET_KEY` forte e `DEBUG=False` em produção.
- Restringir `ALLOWED_HOSTS` e `CORS_ALLOWED_ORIGINS` a domínios reais.
- Usar HTTPS (proxy ou plataforma gerenciada) para tokens JWT.

## Roadmap Sugerido / Próximos Passos
- Implementar refresh de token automático.
- Adicionar testes de integração para exportação.
- Controle de permissões por papel (ex.: financeiro vs. administrador).
- Dashboard com mais métricas (comparativos mensais / previsão).
- Suporte a anexos (ex.: upload de comprovantes / notas fiscais PDF).

## Contribuição
1. Crie uma branch feature: `git checkout -b feature/minha-feature`
2. Faça commits claros.
3. Abra um Pull Request descrevendo a motivação e mudanças.