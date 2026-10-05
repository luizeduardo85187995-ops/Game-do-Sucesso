# Auditoria AdSense — V8

## Problemas encontrados na V7

- Script oficial do AdSense carregado globalmente em `index.html`.
- Banner Google podia ser renderizado no topo do aplicativo autenticado, independentemente da tela interna.
- Isso incluía potencialmente login, configurações, Dante, administração, navegação, telas vazias e outras áreas sem conteúdo editorial substancial.
- Existia fallback de Slot ID fictício `1234567890`.
- A raiz do domínio era predominantemente uma interface de aplicativo, com pouco conteúdo editorial público indexável.
- Páginas institucionais e educativas públicas independentes eram insuficientes para demonstrar presença editorial consistente.

## Correções V8

- AdSense removido completamente do aplicativo autenticado.
- App movido logicamente para `/app` sem remover recursos.
- Home pública criada em `/`.
- 8 artigos originais de educação financeira adicionados.
- 2 calculadoras públicas adicionadas sem anúncios Google.
- Metodologia, como funciona, sobre, contato, privacidade e termos adicionados como páginas públicas.
- Google AdSense manual limitado a artigos longos.
- AdSense só carrega com Client ID e Slot ID válidos; nenhum identificador fictício é usado.
- Meta de propriedade do AdSense mantida no `index.html`.
- `ads.txt`, `robots.txt` e `sitemap.xml` estruturados para descoberta e transparência.
- PWA configurada para abrir diretamente em `/app`.

## Validação estática realizada

- 61 arquivos TypeScript/TSX analisados sintaticamente: 0 erros de sintaxe.
- Imports relativos analisados: 0 referências ausentes.
- Busca por `adsbygoogle`: restrita ao componente público `PublicAdSense.tsx`.
- Busca por Slot ID falso `1234567890`: removido do projeto.
- Busca por script global `pagead2.googlesyndication.com`: removido de `index.html`; existe somente no carregamento sob demanda de artigo público.

## Limitação de validação

O `npm install` completo excedeu o limite de execução do ambiente, portanto o build integral deve ser confirmado no deploy da Vercel. A validação sintática e estrutural foi concluída, mas não substitui o build real.
