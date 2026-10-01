# Dante V7 — Groq + Qwen + Treinador Financeiro

Esta versão parte da versão auditada com Firebase/Kiwify e altera somente a camada do Dante e o health check da API.

## O que mudou

- Dante não usa mais Pollinations.
- Motor principal: Groq, modelo padrão `qwen/qwen3.8-27b`.
- Chave `GROQ_API_KEY` fica somente na Vercel.
- `/api/dante` valida login Firebase e assinatura PRO antes de chamar a IA.
- Dante recebe um raio-X calculado sobre até 2.000 lançamentos, além de contas, metas, investimentos e proventos.
- O backend calcula tendências dos últimos 6 meses, ranking de categorias, recorrências por descrição, comparação mês a mês e gastos claramente discricionários.
- A IA recebe somente o resumo e lançamentos recentes/relevantes, reduzindo tokens sem perder a leitura comportamental do histórico.
- A conversa recente é preservada por usuário no navegador para o Dante acompanhar compromissos e contexto.
- Botão de nova conversa limpa a memória local do Dante.

## Modos de personalidade

### Equilibrado
Didático, firme e acolhedor. Não passa pano, mas não humilha.

### Vira Homem 🔥
Opcional e ativado conscientemente pelo usuário. É duro, sarcástico e pode usar palavrões moderados ao confrontar desperdícios evidentes. As regras impedem insultos degradantes contra a pessoa e bronca automática por saúde, remédios, necessidades básicas ou emergências.

## Arquivos principais alterados

- `api/dante.ts`
- `api/health.ts`
- `src/lib/danteAI.ts` (novo)
- `src/components/finance/AIChatScreen.tsx`
- `.env.example`
- `src/lib/pollinations.ts` removido porque não é mais usado.

## Variáveis na Vercel

Obrigatória e já cadastrada pelo projeto:

```text
GROQ_API_KEY
```

Opcional:

```text
GROQ_MODEL=qwen/qwen3.8-27b
```

Sem `GROQ_MODEL`, o backend já usa `qwen/qwen3.8-27b`.

## Depois do deploy

Abra:

```text
https://jornada-do-sucesso-swart.vercel.app/api/health
```

Deve conter:

```json
"groqConfigured": true,
"danteModel": "qwen/qwen3.8-27b"
```

Depois abra:

```text
https://jornada-do-sucesso-swart.vercel.app/api/dante
```

Deve retornar `status: "ready"`, `provider: "Groq"` e os modos disponíveis.

## Testes recomendados no app

Modo Equilibrado:

> Analise meus últimos meses, minhas categorias e descrições. Onde meus hábitos financeiros estão me atrapalhando e qual é a prioridade desta semana?

Modo Vira Homem:

> Eu vivo dizendo que não sobra dinheiro. Olha meus gastos e me fala sem passar pano onde eu estou me sabotando.

O Dante deve citar valores reais do app. Se responder genericamente sem usar os dados, a versão não deve ser considerada aprovada.

## Validações realizadas

- 58 arquivos TS/TSX analisados sintaticamente: 0 erros.
- Imports relativos: 0 arquivos ausentes.
- Nenhuma `GROQ_API_KEY` literal no repositório.
- Pollinations removida do fluxo do Dante.

A instalação completa de dependências não concluiu dentro do limite do ambiente de revisão; o build final deve ser confirmado pelo deployment da Vercel, que já é o fluxo oficial do projeto.
