# Frontend - SGOS (Sistema de Gerenciamento de Ordem de Serviço)

## Arquitetura

Implementação do frontend Vue 3 + TypeScript siguiendo princípios SOLID e Clean Code.

### Estrutura de Pastas

```
src/
├── components/        # Componentes Vue
│   ├── LoginForm.vue
│   └── RegisterForm.vue
├── composables/       # Lógica reutilizável
│   ├── useAuth.ts     # Composable de autenticação
│   └── useForm.ts     # Composable de formulários
├── config/            # Configurações
│   └── constants.ts
├── layouts/           # Layouts
│   └── BaseLayout.vue
├── router/            # Roteamento
│   ├── guards.ts      # Middlewares de rota
│   └── index.ts       # Configuração de rotas
├── services/          # Serviços de API
│   ├── HttpClient.ts  # Cliente HTTP
│   ├── AuthService.ts # Serviço de autenticação
│   └── index.ts
├── stores/            # Estado global (Pinia)
│   ├── authStore.ts   # Store de autenticação
│   └── index.ts
├── types/             # TypeScript types/interfaces
│   └── auth.ts
├── views/             # Páginas
│   └── DashboardView.vue
├── App.vue
└── main.ts
```

## Funcionalidades

### 1. Autenticação

#### Login
- Validação de email e senha
- Autenticação via API
- Armazenamento de token em localStorage
- Redirecionamento para dashboard

#### Register
- Validação de dados
- Verificação de senhas iguais
- Criação de novo usuário
- Geração de token automático
- Armazenamento de token em localStorage

#### Logout
- Invalidação de token no backend
- Limpeza de localStorage
- Redirecionamento para login

### 2. Proteção de Rotas

- Middleware que verifica autenticação
- Redirecionamento automático para login se não autenticado
- Redirecionamento automático para dashboard se autenticado e tentando acessar login/register

### 3. Gerenciamento de Estado (Pinia)

Store de autenticação com:
- Usuário atual
- Token
- Estado de carregamento
- Erros
- Métodos de login, register, logout

### 4. Composables

#### useAuth()
```typescript
const { user, token, isAuthenticated, isLoading, error, login, register, logout } = useAuth()
```

#### useForm()
```typescript
const { values, errors, touched, setFieldValue, setFieldError, setFieldTouched, resetForm, getFieldProps } = useForm(initialValues)
```

### 5. Services

#### HttpClient
Cliente HTTP genérico com:
- Suporte a GET, POST, PUT, DELETE, PATCH
- Injeção automática de token no header
- Tratamento de erros
- Gerenciamento de token (localStorage)

#### AuthService
Serviço específico de autenticação:
- `login(request)` - Fazer login
- `register(request)` - Registrar novo usuário
- `logout()` - Fazer logout

## Fluxo de Autenticação

### Login
```
Usuário preenche formulário
  ↓
Validação no componente
  ↓
useAuth().login() é chamado
  ↓
AuthService.login() faz requisição para API
  ↓
Token é armazenado em localStorage via HttpClient
  ↓
Store é atualizado com usuário e token
  ↓
Router redireciona para dashboard
```

### Register
```
Usuário preenche formulário
  ↓
Validação no componente
  ↓
useAuth().register() é chamado
  ↓
AuthService.register() faz requisição para API
  ↓
Token é armazenado em localStorage
  ↓
Store é atualizado com usuário e token
  ↓
Router redireciona para dashboard
```

## Princípios SOLID Aplicados

### Single Responsibility
- `HttpClient`: Apenas requisições HTTP
- `AuthService`: Apenas lógica de autenticação
- `useAuth()`: Apenas expor autenticação ao componente
- Cada componente tem responsabilidade clara

### Open/Closed
- Services podem ser estendidos sem modificação
- Composables podem ser reutilizados

### Liskov Substitution
- Diferentes implementações de serviços podem ser substituídas

### Interface Segregation
- Types simples e específicas
- Interfaces focadas

### Dependency Inversion
- Injeção de dependências
- Composables e stores injetados nos componentes

## Clean Code

### Sem Comentários Desnecessários
- Nomes claros e auto-explicativos
- Código lógico em métodos bem nomeados

### Sem Else Statements
- Retornos antecipados
- Guard clauses

### Métodos Pequenos e Focados
- Componentes focados em presentação
- Lógica extraída em composables

### Type Safety
- TypeScript em todo o código
- Types/interfaces bem definidas

## Como Usar

### Instalação
```bash
cd /home/void/Documents/Front/vue/sgos
npm install
```

### Configuração
Criar arquivo `.env.local` com:
```
VITE_API_URL=http://localhost/api
```

### Desenvolvimento
```bash
npm run dev
```

Acesse `http://localhost:5173`

### Build
```bash
npm run build
```

### Verificação de Tipos
```bash
npm run type-check
```

## Endpoints Esperados

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| POST | `/v1/auth/login` | Não | Login |
| POST | `/v1/auth/register` | Não | Registro |
| POST | `/v1/auth/logout` | Sim | Logout |

## Tratamento de Erros

Os erros da API são capturados e exibidos:
- Validação de formulário no front
- Mensagens de erro específicas do backend
- Estados de carregamento

## Armazenamento Local

Token é armazenado em `localStorage` com chave `auth_token`.

## Estrutura de Response Esperada

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "is_active": true,
      "created_at": "2026-03-17T00:00:00Z"
    },
    "token": "plaintext_token",
    "type": "Bearer"
  }
}
```

## Desenvolvimento Futuro

- [ ] Refresh token
- [ ] Interceptor para token expirado
- [ ] Componentes globais reutilizáveis
- [ ] Testes unitários e e2e
- [ ] Temas
- [ ] Internacionalização
- [ ] Estado offline


## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
