# Deploy seguro — ordem exata

1. Faça backup do repositório atual no GitHub (tag/branch ou download ZIP).
2. Substitua o conteúdo do repositório pela versão corrigida, preservando os valores secretos somente na Vercel.
3. Nunca envie arquivos `firebase-adminsdk*.json` ao GitHub.
4. Aguarde o deploy automático da Vercel.
5. Se o deploy falhar, não teste Kiwify; abra o log da Vercel e corrija primeiro.
6. Abra `https://jornada-do-sucesso-swart.vercel.app/api/health`.
7. Abra `https://jornada-do-sucesso-swart.vercel.app/api/webhooks/kiwify`.
8. No Firebase, publique o conteúdo de `firestore.rules` para o banco `ai-studio-jornadadameta-5b8ff790-fb11-4b30-b75a-965488b23203`.
9. Rotacione o token do webhook Kiwify que apareceu anteriormente em print e atualize `KIWIFY_WEBHOOK_SECRET` na Vercel.
10. Faça novo deploy após alterar o segredo, se necessário para garantir que o ambiente de produção recebeu a nova variável.
11. Na Kiwify, mantenha o produto `Minhas Finanças PRO` e os eventos: Compra aprovada, Reembolso, Chargeback, Assinatura cancelada, Assinatura atrasada e Assinatura renovada.
12. URL: `https://jornada-do-sucesso-swart.vercel.app/api/webhooks/kiwify`.
13. Use “Testar Webhook” e confira o log da Kiwify e os logs da Function na Vercel.
14. Confirme que o Firestore criou/atualizou `/subscriptions/{uid}` para um usuário de teste.
15. Faça teste controlado dos links mensal e anual antes de liberar comercialmente.
