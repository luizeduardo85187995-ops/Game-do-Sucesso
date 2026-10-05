# V8 — Correção estrutural para AdSense sem descaracterizar o app

## Objetivo

A V8 separa claramente duas experiências:

- `/` e rotas públicas: conteúdo educacional original, ferramentas, metodologia, páginas institucionais e navegação pública.
- `/app`: aplicativo financeiro autenticado, com Firebase, Kiwify, Dante, metas, investimentos e demais recursos existentes.

Essa separação evita que Google AdSense seja carregado em telas privadas, comportamentais, de navegação, login, configurações, chat, pagamento, administração ou estados vazios.

## O que mudou

1. Home pública nova com proposta do produto e conteúdo substancial.
2. Hub `/educacao-financeira` com 8 guias originais completos.
3. Página `/ferramentas` com calculadora de reserva e calculadora de meta mensal.
4. Páginas públicas `/como-funciona`, `/metodologia`, `/sobre`, `/privacidade`, `/termos` e `/contato`.
5. `robots.txt` e `sitemap.xml` adicionados.
6. PWA passa a abrir em `/app`.
7. Script global do Google AdSense removido de `index.html`.
8. Mantida apenas a meta de propriedade `google-adsense-account` no documento global.
9. Google AdSense só pode ser carregado manualmente em artigos públicos longos, e apenas se existir Client ID + Slot ID válidos e o modo comercial estiver como `adsense` ou `mixed`.
10. O aplicativo `/app` nunca carrega Google AdSense. Usuários gratuitos podem continuar vendo somente parcerias diretas configuradas no app.
11. Removido o fallback de Slot ID falso `1234567890`.
12. Textos de privacidade/admin atualizados para refletir a separação entre publicidade pública e parcerias dentro do app.

## Antes de solicitar nova revisão do AdSense

- Publique esta V8 e abra o site deslogado em `/`.
- Navegue por Educação Financeira, Ferramentas, Como funciona, Metodologia, Sobre, Privacidade, Termos e Contato.
- Confirme que `/app` continua funcionando normalmente.
- No painel do Google AdSense, desative temporariamente **Anúncios automáticos** durante a revisão. A V8 foi desenhada para unidades manuais apenas em artigos elegíveis.
- Não coloque bloco do Google em login, Dante, configurações, administração, pagamento, calculadoras ou telas vazias.
- Se ainda não houver um Slot ID manual válido, deixe o campo vazio. A V8 não exibirá Google AdSense até existir um slot válido.
- Confirme que `https://jornada-do-sucesso-swart.vercel.app/ads.txt` continua acessível.
- Envie `https://jornada-do-sucesso-swart.vercel.app/sitemap.xml` ao Google Search Console, se utilizar Search Console.
- Só então solicite nova revisão no AdSense.

## Importante

Aprovação do AdSense nunca pode ser garantida por código. A decisão final é do Google e também considera qualidade, histórico, tráfego, conteúdo, experiência e outros sinais. A V8 corrige os problemas estruturais identificáveis no código e melhora substancialmente o valor público do domínio.
