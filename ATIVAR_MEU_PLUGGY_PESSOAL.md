# Conectar minhas finanças pelo Meu Pluggy

A integração está incluída em Bancos > Meus bancos conectados, sem exigir plano PRO do aplicativo. Ela consulta contas, saldos e extrato mensal exclusivamente do usuário configurado.

## O que já está pronto

- API protegida por login Google e pelo UID do titular.
- Consulta de conexões existentes no Meu Pluggy, com credenciais somente no servidor.
- Extrato mensal com filtro por conta e páginas de 50 linhas.
- Consulta salva em área privada do Firestore; uma consulta recente é reutilizada por 15 minutos.
- Limite de uma tentativa por minuto por titular, inclusive entre meses diferentes.
- Leitura paginada pela API atual /v2/transactions; duplicatas do mesmo ID/conta são eliminadas.
- Datas do extrato preservadas sem deslocar o dia 1 para outro mês.
- Falha de leitura não salva resultado parcial, não zera saldos e não altera lançamentos manuais.
- Dados bancários são exibidos separadamente, sem importação automática para o livro manual, conciliação automática ou soma nos indicadores existentes. Transferências entre contas e pagamentos de fatura precisam dessa separação para não serem tratados duas vezes como despesas.
- O saldo mostrado é o último informado pelo provedor, não o saldo de fechamento do mês selecionado. As datas de coleta e consulta aparecem na tela.

## 1. Autorizar os bancos — feito por você

Abra https://meu.pluggy.ai/ e conecte seus bancos. Confirme as autorizações no aplicativo de cada banco quando solicitado.

Depois abra https://dashboard.pluggy.ai/ com a mesma conta:

1. Aplicações > sua aplicação > Demo > Conectar Conta.
2. Escolha **MeuPluggy**, e entre com sua conta do Meu Pluggy.
3. Não escolha diretamente um banco ou Sandbox neste passo: esse não é o fluxo pessoal que estamos preparando.
4. Em Itens Conectados, copie o ID de cada conexão disponibilizada. Cada banco conectado pode gerar um item diferente.

Guia oficial: https://docs.pluggy.ai/pt/docs/guides/meu-pluggy-personal-use

A documentação consultada em 16/11/2026 informa uso pessoal gratuito, até 5 conexões, sem uso comercial. A atualização de origem é aproximadamente diária. Não existe neste app chamada para forçar atualização bancária, criar conectores pagos ou contratar planos. A gratuidade da API não elimina eventuais limites das franquias de hospedagem e banco de dados; mantenha os planos gratuitos, monitore seu consumo e não habilite cobrança se seu limite é custo zero.

## 2. Trocar a credencial exposta

No painel Pluggy, gere um NOVO Client Secret para invalidar o que apareceu no print. Guarde o novo diretamente no gerenciador de variáveis do servidor. Não envie imagens, não adicione ao GitHub e não use prefixo VITE_. Nenhuma credencial do print foi incorporada a este projeto.

## 3. Configurar a Vercel

No projeto deste app: Settings > Environment Variables. Cadastre para Production:

| Nome | Valor |
| --- | --- |
| OPEN_FINANCE_OWNER_UID | Seu ID de usuário Firebase. O app mostra esse ID na tela Acesso & Sincronização Google, após login. Não é seu e-mail nem Client ID. |
| PLUGGY_CLIENT_ID | Client ID da aplicação Pluggy que contém as conexões MeuPluggy. |
| PLUGGY_CLIENT_SECRET | Novo segredo gerado no passo anterior. |
| PLUGGY_PERSONAL_ITEM_IDS | IDs de Itens Conectados, separados por vírgula, até 5. |

As credenciais Firebase Admin das APIs também precisam existir: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY e FIRESTORE_DATABASE_ID. Preserve as já configuradas. O banco precisa corresponder a firebase-applet-config.json, inclusive se for um banco nomeado, e não necessariamente (default).

Publique os arquivos desta pasta e faça novo deploy após configurar as variáveis. Não é necessário contratar um plano Pluggy.

A coleção openFinancePrivate deve permanecer inacessível pelo SDK cliente. O firestore.rules incluído já a bloqueia pela regra geral; publique essas regras no banco correto e não mantenha nenhuma regra ampla que permita leitura pública ou para todos os usuários autenticados. A API usa Firebase Admin e só retorna o extrato ao UID configurado.

## 4. Usar

Entre no app com sua conta Google. Abra Bancos, escolha o mês e clique em Consultar dados disponíveis. Se não houver dados salvos, esse botão faz a primeira consulta. Trocar o mês só abre uma consulta já salva; clique no botão para buscar outra.

- A consulta não força atualização no banco: usa o que o Meu Pluggy já coletou.
- Autorizações vencidas precisam ser renovadas no Meu Pluggy/Demo. Depois confira os itemIds novamente; eles podem mudar.
- A área aceita meses desde 24 meses atrás até o próximo mês, mas a disponibilidade histórica depende do banco e do provedor.
- Para desconectar do aplicativo, remova PLUGGY_PERSONAL_ITEM_IDS do servidor e faça novo deploy; para revogar o compartilhamento, use também o Meu Pluggy/banco. Cópias de consultas anteriores permanecem privadas no Firestore até exclusão explícita.

## Desenvolvimento e testes

```sh
npm ci
npm test
npm run lint
npm run build
```

`npm run dev` executa apenas a interface Vite. Para as APIs, use o ambiente Vercel configurado ou Vercel CLI com as variáveis locais protegidas. Não abra index.html diretamente.

Os testes usam respostas simuladas: permissões, paginação, duplicatas, consentimento vencido, erros parciais, datas, interface, limpeza de dados na troca de usuário e os cálculos financeiros corrigidos anteriormente. A compilação e o TypeScript também foram verificados. Login bancário real e implantação na Vercel ainda dependem das autorizações e configurações acima; não foram executados nesta entrega.
