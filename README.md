# 🚀 Teste Match Backend

Backend do sistema **Teste Match** - Análise de compatibilidade romântica via IA.

## 📋 Funcionalidades

- ✅ Autenticação JWT
- ✅ Sistema de créditos e planos
- ✅ Webhooks para n8n e AppMax
- ✅ Banco MongoDB
- ✅ Rate limiting e segurança
- ✅ Processamento de análises via n8n

## 🛠️ Tecnologias

- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **JWT** para autenticação
- **Helmet** para segurança
- **n8n** para processamento de IA

## 🚀 Como executar

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env
# Editar o arquivo .env com suas configurações
```

3. Executar em desenvolvimento:
```bash
npm run dev
```

4. Executar em produção:
```bash
npm start
```

## 📡 Endpoints

### Autenticação
- `POST /api/register` - Cadastro de usuário
- `POST /api/login` - Login
- `GET /api/profile` - Perfil do usuário

### Créditos
- `GET /api/credits` - Consultar créditos
- `POST /api/credits/purchase` - Comprar créditos

### Análise
- `POST /api/upload` - Criar nova análise
- `GET /api/analysis/:id` - Consultar análise
- `GET /api/history` - Histórico de análises

### Webhooks
- `POST /api/webhook/n8n` - Receber resultado do n8n
- `POST /api/webhook/appmax` - Receber confirmação de pagamento

## 🔒 Segurança

- Rate limiting configurado
- Validação de dados
- Sanitização de inputs
- Headers de segurança (Helmet)
- CORS configurado

## 📊 Banco de Dados

MongoDB com as seguintes coleções:
- `users` - Usuários
- `analyses` - Análises realizadas
- `credits` - Histórico de créditos
- `plans` - Planos disponíveis
