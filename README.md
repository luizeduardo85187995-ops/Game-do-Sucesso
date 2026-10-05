# Jornada do Sucesso — V8

Plataforma de organização financeira pessoal com duas camadas claramente separadas:

- **Site público** (`/`): educação financeira, ferramentas, metodologia e páginas institucionais.
- **Aplicativo** (`/app`): controle financeiro, contas, metas, investimentos, Jornada da Meta, Dante IA, plano PRO e sincronização Firebase.

## Desenvolvimento local

Pré-requisito: Node.js.

```bash
npm install
npm run dev
```

## Variáveis de ambiente do backend

As credenciais devem permanecer na Vercel e nunca ser enviadas ao GitHub.

- `FIREBASE_PROJECT_ID`
- `FIRESTORE_DATABASE_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `KIWIFY_WEBHOOK_SECRET`
- `GROQ_API_KEY`
- `GROQ_MODEL` (opcional)

## Rotas principais

### Públicas

- `/`
- `/educacao-financeira`
- `/educacao-financeira/<artigo>`
- `/ferramentas`
- `/como-funciona`
- `/metodologia`
- `/sobre`
- `/privacidade`
- `/termos`
- `/contato`

### Aplicativo

- `/app`

### Backend Vercel

- `/api/health`
- `/api/dante`
- `/api/webhooks/kiwify`
- `/api/subscriptions/claim-pending`

## Publicidade

Google AdSense não é carregado dentro do aplicativo autenticado. Unidades Google, quando configuradas, ficam restritas a artigos públicos longos e só são renderizadas com Client ID e Slot ID válidos.

Parcerias diretas podem continuar aparecendo para usuários gratuitos dentro do aplicativo.

Leia `ADSENSE_V8_LEIA_PRIMEIRO.md` antes de solicitar nova revisão no AdSense.
