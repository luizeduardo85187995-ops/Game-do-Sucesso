export type PublicArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  tip?: string;
};

export type PublicArticle = {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  category: string;
  updatedAt: string;
  intro: string;
  sections: PublicArticleSection[];
  takeaway: string;
};

export const PUBLIC_ARTICLES: PublicArticle[] = [
  {
    slug: 'reserva-de-emergencia-como-comecar',
    title: 'Reserva de emergência: quanto guardar e como começar sem travar o orçamento',
    description: 'Um método prático para construir sua reserva de emergência em etapas, mesmo quando o orçamento está apertado.',
    readTime: '8 min',
    category: 'Organização financeira',
    updatedAt: '2026-10-05',
    intro:
      'Reserva de emergência não é dinheiro parado: é o que impede um imprevisto de virar dívida. O erro mais comum é imaginar que você precisa juntar seis meses de despesas de uma vez. Na prática, funciona melhor construir uma sequência de pequenas proteções e aumentar a meta conforme o hábito de guardar dinheiro fica mais forte.',
    sections: [
      {
        heading: '1. Descubra o seu custo essencial mensal',
        paragraphs: [
          'Comece separando despesas indispensáveis das despesas ajustáveis. Moradia, alimentação básica, transporte necessário, saúde, contas essenciais e parcelas que você realmente não pode interromper formam o núcleo do seu custo mensal.',
          'Não use a média total do cartão sem analisar. Se parte relevante da fatura vem de delivery, lazer, compras por impulso ou assinaturas que poderiam ser canceladas, isso não deveria inflar artificialmente a reserva que você precisa formar.'
        ],
        bullets: [
          'Some apenas os gastos essenciais recorrentes.',
          'Use uma média de pelo menos três meses para contas variáveis.',
          'Não conte limite de cartão ou cheque especial como reserva.'
        ]
      },
      {
        heading: '2. Construa a reserva em três degraus',
        paragraphs: [
          'Uma meta muito distante costuma desmotivar. Por isso, divida o processo. Primeiro, forme uma reserva de choque pequena. Depois, alcance um mês de despesas essenciais. Só então avance para três a seis meses, conforme estabilidade de renda, dependentes e riscos profissionais.',
          'Quem tem renda variável, trabalha por conta própria ou sustenta outras pessoas costuma precisar de uma margem maior. Quem tem emprego estável e boa cobertura de seguros pode trabalhar com uma faixa menor, desde que não ignore riscos reais.'
        ],
        bullets: [
          'Degrau 1: R$ 500 a R$ 1.000 para pequenos imprevistos.',
          'Degrau 2: 1 mês de despesas essenciais.',
          'Degrau 3: 3 a 6 meses de despesas essenciais.'
        ],
        tip: 'No Jornada do Sucesso, transforme cada degrau em uma meta separada. Metas menores dão sensação de progresso e ajudam a manter o hábito.'
      },
      {
        heading: '3. Automatize o valor antes de gastar',
        paragraphs: [
          'Esperar o fim do mês para ver “o que sobrou” quase sempre produz o mesmo resultado: sobra pouco ou nada. O hábito mais eficiente é decidir antes quanto será guardado e tratar esse valor como uma obrigação com você mesmo.',
          'Se 10% da renda ainda parece inviável, comece com um valor menor. O objetivo inicial é criar consistência. Guardar R$ 100 todos os meses é melhor do que planejar R$ 500 e abandonar a meta depois de duas tentativas.'
        ]
      },
      {
        heading: '4. Onde deixar a reserva',
        paragraphs: [
          'Reserva de emergência precisa priorizar segurança e liquidez. O objetivo não é buscar a maior rentabilidade possível; é conseguir acessar o dinheiro quando necessário sem depender de vender um ativo volátil em um momento ruim.',
          'Antes de escolher qualquer produto, confira liquidez, risco, tributação, garantia aplicável e prazo de resgate. A decisão deve ser compatível com a função do dinheiro: proteção contra imprevistos.'
        ]
      },
      {
        heading: '5. Quando usar e quando repor',
        paragraphs: [
          'A reserva existe para eventos importantes e não planejados: perda de renda, urgência médica, reparo essencial ou outro problema que comprometa a rotina financeira. Promoção, viagem, troca de celular ou compra por impulso não são emergência.',
          'Se precisar usar uma parte, não trate isso como fracasso. A reserva cumpriu sua função. O passo seguinte é reconstruí-la antes de acelerar metas menos urgentes.'
        ]
      }
    ],
    takeaway: 'A melhor reserva não é a que fica perfeita na planilha. É a que você consegue começar, manter e reconstruir quando a vida exige.'
  },
  {
    slug: 'como-organizar-despesas-do-mes',
    title: 'Como organizar as despesas do mês sem transformar sua vida em uma planilha impossível',
    description: 'Um sistema simples de categorias, revisão semanal e limites para entender para onde o dinheiro está indo.',
    readTime: '7 min',
    category: 'Orçamento',
    updatedAt: '2026-10-05',
    intro:
      'Organização financeira não exige registrar vinte detalhes de cada café. O que você precisa é de informação suficiente para tomar decisões. Um bom sistema mostra quanto entra, quanto sai, quais categorias estão crescendo e quais compromissos vão vencer antes do próximo salário.',
    sections: [
      {
        heading: '1. Comece pelo fluxo, não pelo sentimento',
        paragraphs: [
          'É comum alguém dizer “eu quase não gasto” e, ao mesmo tempo, terminar o mês sem saber para onde foi o salário. O primeiro passo é substituir percepção por números. Liste receitas e despesas do período e confira o total líquido.',
          'O objetivo não é julgar cada compra. É descobrir padrões. Uma despesa isolada raramente destrói o orçamento; dezenas de pequenas decisões repetidas podem destruir.'
        ]
      },
      {
        heading: '2. Use poucas categorias que realmente ajudam',
        paragraphs: [
          'Categorias demais tornam o controle cansativo. Categorias de menos escondem problemas. Para a maioria das pessoas, algo entre oito e doze grupos já permite entender o comportamento sem criar burocracia.'
        ],
        bullets: [
          'Moradia',
          'Alimentação',
          'Transporte',
          'Saúde',
          'Educação',
          'Lazer',
          'Compras pessoais',
          'Assinaturas',
          'Dívidas e parcelas',
          'Investimentos e metas'
        ]
      },
      {
        heading: '3. Diferencie gasto fixo, variável e discricionário',
        paragraphs: [
          'Gastos fixos têm pouca variação no curto prazo. Gastos variáveis são necessários, mas mudam de valor. Gastos discricionários são os que podem ser reduzidos sem comprometer necessidades básicas. Essa separação é mais útil do que apenas olhar uma lista de categorias.',
          'Quando o mês aperta, o corte inteligente começa pelo discricionário. Tentar economizar primeiro em energia enquanto R$ 800 vão para delivery normalmente ataca o problema errado.'
        ]
      },
      {
        heading: '4. Faça uma revisão semanal de dez minutos',
        paragraphs: [
          'Esperar o fechamento do mês para descobrir que estourou o orçamento é tarde demais. Uma revisão semanal curta permite corrigir rota enquanto ainda existe tempo. Veja as categorias com maior consumo, despesas futuras e saldo disponível até a próxima entrada de renda.',
          'No Jornada do Sucesso, a Visão Geral e o Dante podem ser usados como uma revisão guiada: o sistema mostra os números e o consultor ajuda a interpretar os hábitos.'
        ]
      },
      {
        heading: '5. Defina limites como direção, não como punição',
        paragraphs: [
          'Um limite deve ser realista. Se você gasta R$ 1.000 em alimentação fora de casa, reduzir para R$ 150 de uma vez tende a falhar. Uma redução progressiva, acompanhada semana a semana, cria uma mudança sustentável.',
          'O orçamento é um plano para usar o dinheiro com intenção. Ele não precisa eliminar lazer; precisa impedir que gastos automáticos roubem recursos das prioridades que você diz ter.'
        ]
      }
    ],
    takeaway: 'Controle financeiro bom é aquele que você consegue revisar rapidamente e que muda uma decisão antes de o dinheiro acabar.'
  },
  {
    slug: 'habitos-financeiros-que-sabotam-metas',
    title: '7 hábitos financeiros que sabotam suas metas sem você perceber',
    description: 'Como reconhecer comportamentos que drenam o orçamento e substituir culpa por ações concretas.',
    readTime: '9 min',
    category: 'Hábitos financeiros',
    updatedAt: '2026-10-05',
    intro:
      'Muita gente não tem um “grande gasto” responsável pela falta de dinheiro. O problema está em hábitos repetidos: comprar sem planejar, parcelar pequenas despesas, ignorar assinaturas ou tratar todo aumento de renda como permissão para aumentar o padrão de vida. O efeito aparece no fim do mês, mas a causa está nas decisões do dia a dia.',
    sections: [
      {
        heading: '1. Gastar primeiro e tentar guardar depois',
        paragraphs: [
          'Esse hábito transforma a economia em algo opcional. Como o consumo se adapta facilmente ao dinheiro disponível, a tendência é sempre surgir um gasto novo. Separar uma parte no início do ciclo muda a ordem de prioridade.'
        ]
      },
      {
        heading: '2. Parcelar o que deveria caber no mês',
        paragraphs: [
          'Parcelamento pode ser útil em situações específicas, mas parcelar rotineiramente despesas pequenas cria um orçamento cheio de compromissos antigos. O salário futuro já chega parcialmente gasto.',
          'Antes de parcelar, pergunte se a compra caberia no orçamento à vista. Se não caberia e não é essencial, talvez o problema não seja a forma de pagamento.'
        ]
      },
      {
        heading: '3. Usar o cartão como extensão da renda',
        paragraphs: [
          'Limite disponível não é dinheiro disponível. Quando a fatura depende do próximo salário para ser paga, qualquer imprevisto cria um efeito dominó. O cartão deveria organizar pagamentos, não mascarar a falta de caixa.'
        ]
      },
      {
        heading: '4. Aumentar o padrão de vida a cada aumento de renda',
        paragraphs: [
          'Se toda melhora salarial vira uma nova parcela, assinatura ou despesa fixa, o patrimônio não acompanha a renda. Uma regra útil é direcionar uma parte de cada aumento para metas e investimentos antes de elevar o padrão de consumo.'
        ]
      },
      {
        heading: '5. Não olhar pequenas recorrências',
        paragraphs: [
          'Assinaturas digitais, taxas e serviços de baixo valor são fáceis de ignorar individualmente. Somados, podem representar centenas de reais por mês. Faça uma revisão trimestral e cancele o que deixou de gerar valor.'
        ]
      },
      {
        heading: '6. Comprar para compensar emoções',
        paragraphs: [
          'Cansaço, ansiedade e recompensa pessoal podem virar gatilhos de consumo. A solução não é culpa: é criar uma barreira entre vontade e pagamento. Uma regra de espera de 24 horas para compras não essenciais já reduz decisões impulsivas.'
        ]
      },
      {
        heading: '7. Ter meta vaga',
        paragraphs: [
          '“Quero economizar mais” não diz quanto, até quando nem para quê. Uma meta concreta transforma intenção em acompanhamento. Quando o objetivo tem valor, prazo e contribuição mensal, você consegue medir progresso e corrigir desvios.'
        ],
        tip: 'Use metas pequenas no começo. Disciplina financeira se fortalece com vitórias repetidas, não com promessas gigantes.'
      }
    ],
    takeaway: 'Você não precisa corrigir sete hábitos ao mesmo tempo. Escolha o que mais custa dinheiro hoje e trabalhe nele por algumas semanas.'
  },
  {
    slug: 'como-guardar-dinheiro-ganhando-pouco',
    title: 'Como começar a guardar dinheiro ganhando pouco: um plano realista',
    description: 'Estratégias para criar margem financeira quando o orçamento já parece apertado.',
    readTime: '8 min',
    category: 'Economia',
    updatedAt: '2026-10-05',
    intro:
      'Quando a renda é limitada, a recomendação “guarde 20%” pode parecer desconectada da realidade. A prioridade deve ser criar margem. Isso pode exigir redução de despesas, renegociação de compromissos, aumento de renda ou uma combinação dos três. O ponto de partida é medir o tamanho real do déficit ou da sobra.',
    sections: [
      {
        heading: '1. Descubra se o problema é hábito, estrutura ou renda',
        paragraphs: [
          'Se despesas essenciais consomem praticamente toda a renda, cortes pequenos não resolvem sozinhos. Se existe gasto discricionário relevante, há espaço para mudança comportamental. Se o orçamento fecha positivo, mas o dinheiro desaparece, falta método para transformar sobra em patrimônio.'
        ]
      },
      {
        heading: '2. Comece com uma meta mínima que seja impossível ignorar',
        paragraphs: [
          'R$ 20, R$ 50 ou R$ 100 podem parecer pouco, mas o primeiro objetivo é provar que o hábito cabe na rotina. Depois de dois ou três meses consistentes, aumente a contribuição. O processo precisa sobreviver aos meses comuns, não apenas aos meses perfeitos.'
        ]
      },
      {
        heading: '3. Ataque vazamentos repetidos',
        paragraphs: [
          'Um único corte enorme pode ser difícil de sustentar. Vazamentos recorrentes são candidatos melhores: taxas, delivery frequente, compras pequenas por impulso, assinaturas pouco usadas e juros de atraso. Some o valor anual para enxergar o impacto.'
        ]
      },
      {
        heading: '4. Proteja qualquer renda extra',
        paragraphs: [
          'Décimo terceiro, comissão, venda de um item ou trabalho extra costuma desaparecer quando não existe regra. Defina previamente uma divisão. Por exemplo: parte para dívida, parte para reserva e uma parte pequena para uso livre.'
        ]
      },
      {
        heading: '5. Não confunda austeridade com organização',
        paragraphs: [
          'Um plano que elimina todo lazer costuma ser abandonado. O objetivo é direcionar recursos para prioridades e reduzir desperdício. Uma pequena verba de lazer planejada é melhor do que várias compras impulsivas seguidas de culpa.'
        ]
      }
    ],
    takeaway: 'Quem ganha pouco precisa de precisão, não de culpa. O primeiro passo é criar uma sobra pequena e protegê-la antes que vire consumo.'
  },
  {
    slug: 'gastos-fixos-variaveis-desnecessarios',
    title: 'Gastos fixos, variáveis e desnecessários: como separar sem se enganar',
    description: 'Entenda quais despesas realmente podem ser reduzidas e como priorizar cortes que fazem diferença.',
    readTime: '6 min',
    category: 'Orçamento',
    updatedAt: '2026-10-05',
    intro:
      'Classificar uma despesa não serve apenas para deixar o relatório bonito. Serve para decidir o que fazer quando o orçamento aperta. A classificação mais útil combina necessidade, recorrência e flexibilidade.',
    sections: [
      {
        heading: 'Fixos não significam intocáveis',
        paragraphs: [
          'Aluguel, mensalidade, internet e seguros podem ter valor previsível, mas ainda podem ser renegociados ou substituídos. O fato de serem fixos significa que se repetem, não que sejam eternos.'
        ]
      },
      {
        heading: 'Variáveis exigem acompanhamento',
        paragraphs: [
          'Supermercado, combustível e energia oscilam. Um único mês não define o padrão. Compare médias e observe tendência. Se uma categoria cresce por três meses seguidos, vale investigar o motivo.'
        ]
      },
      {
        heading: 'Desnecessário depende do contexto',
        paragraphs: [
          'Nem todo lazer é desperdício. O problema aparece quando uma despesa disputa dinheiro com prioridades mais importantes ou acontece por hábito automático. O mesmo gasto pode ser adequado para uma pessoa e excessivo para outra.'
        ]
      },
      {
        heading: 'Use o corte por impacto',
        paragraphs: [
          'Ordene despesas ajustáveis pelo impacto mensal e pela facilidade de redução. Comece pelas que liberam mais dinheiro com menor perda de qualidade de vida. Isso costuma ser mais eficiente do que tentar economizar centavos em todas as categorias.'
        ]
      }
    ],
    takeaway: 'A melhor classificação é a que ajuda você a decidir: manter, reduzir, renegociar ou eliminar.'
  },
  {
    slug: 'como-criar-meta-financeira',
    title: 'Como criar uma meta financeira que você realmente consegue cumprir',
    description: 'Transforme objetivos vagos em metas com valor, prazo e contribuição mensal possível.',
    readTime: '7 min',
    category: 'Metas',
    updatedAt: '2026-10-05',
    intro:
      'Metas falham quando dependem apenas de motivação. Uma boa meta financeira é mensurável, cabe no fluxo de caixa e tem prioridade clara. Ela também precisa ser revisada quando a realidade muda.',
    sections: [
      {
        heading: 'Defina o valor total e o prazo',
        paragraphs: [
          '“Viajar no ano que vem” é um desejo. “Juntar R$ 6.000 em 12 meses” é uma meta. Ao definir números, você descobre a contribuição necessária e consegue comparar com a sua capacidade de poupança.'
        ]
      },
      {
        heading: 'Calcule a contribuição mensal antes de se comprometer',
        paragraphs: [
          'Divida o valor que falta pelo número de meses. Se o resultado não cabe no orçamento, você tem três alternativas honestas: aumentar o prazo, reduzir o objetivo ou criar renda adicional. Ignorar a matemática só adia a frustração.'
        ]
      },
      {
        heading: 'Dê prioridade às metas',
        paragraphs: [
          'Ter seis metas simultâneas pode dispersar recursos. Reserva de emergência e dívidas caras normalmente precisam vir antes de objetivos de consumo. Depois, distribua o restante entre metas de curto, médio e longo prazo.'
        ]
      },
      {
        heading: 'Acompanhe progresso visível',
        paragraphs: [
          'Progresso visível ajuda a manter consistência. A Jornada da Meta existe justamente para transformar uma meta abstrata em uma trajetória acompanhável, mostrando o quanto já foi construído e o que falta para chegar ao objetivo.'
        ]
      }
    ],
    takeaway: 'Meta boa não é a mais ambiciosa. É a que conecta um objetivo importante a um plano mensal que você consegue executar.'
  },
  {
    slug: 'como-sair-do-ciclo-do-cartao',
    title: 'Como sair do ciclo de viver no cartão e depender do próximo salário',
    description: 'Um plano em etapas para recuperar caixa e parar de usar o cartão como extensão da renda.',
    readTime: '9 min',
    category: 'Dívidas e cartão',
    updatedAt: '2026-10-05',
    intro:
      'Quando a fatura consome grande parte do salário logo no início do mês, o cartão deixa de ser meio de pagamento e vira antecipação de renda. Para sair desse ciclo, é preciso criar caixa, reduzir novas parcelas e controlar a velocidade de novas compras.',
    sections: [
      {
        heading: 'Pare de aumentar o problema',
        paragraphs: [
          'Antes de pensar em estratégias sofisticadas, interrompa novas parcelas não essenciais. Se a fatura continua crescendo enquanto você tenta pagá-la, qualquer esforço vira corrida em esteira.'
        ]
      },
      {
        heading: 'Mapeie parcelas futuras',
        paragraphs: [
          'Liste todas as compras parceladas e quanto ainda falta. Isso revela quanto da renda dos próximos meses já está comprometida. Muitas pessoas olham apenas a fatura atual e ignoram o estoque de parcelas futuras.'
        ]
      },
      {
        heading: 'Crie um orçamento em dinheiro disponível',
        paragraphs: [
          'Determine quanto pode ser gasto no restante do mês depois de contas e metas. Acompanhe esse valor, não o limite do cartão. O objetivo é voltar a tomar decisões com base em caixa real.'
        ]
      },
      {
        heading: 'Priorize juros altos',
        paragraphs: [
          'Rotativo e atraso de cartão podem ter custo muito alto. Se houver dívida, compare opções de renegociação e custos efetivos. Não troque uma dívida por outra sem calcular o total pago e o impacto no fluxo mensal.'
        ]
      },
      {
        heading: 'Reconstrua uma pequena reserva',
        paragraphs: [
          'Depois de estabilizar a fatura, forme uma reserva mínima. Sem esse colchão, qualquer gasto inesperado pode empurrar você novamente para o cartão e reiniciar o ciclo.'
        ]
      }
    ],
    takeaway: 'Sair do ciclo do cartão exige reduzir novas compras e criar caixa real. O limite do banco não pode ser o seu orçamento.'
  },
  {
    slug: 'quanto-do-salario-guardar',
    title: 'Quanto do salário guardar por mês? Uma regra flexível para a vida real',
    description: 'Como definir uma taxa de poupança adequada sem copiar percentuais que não combinam com sua realidade.',
    readTime: '7 min',
    category: 'Planejamento',
    updatedAt: '2026-10-05',
    intro:
      'Percentuais como 10%, 20% ou 30% podem servir como referência, mas não são uma lei. A taxa adequada depende de renda, despesas essenciais, dívidas, estágio de vida e objetivos. Mais importante do que escolher o número perfeito é criar uma taxa que avance ao longo do tempo.',
    sections: [
      {
        heading: 'Use o percentual como diagnóstico',
        paragraphs: [
          'Calcule quanto você guardou nos últimos três meses dividido pela renda líquida do mesmo período. Isso mostra sua taxa real, não a taxa que você gostaria de ter. A diferença entre intenção e resultado é onde o plano precisa atuar.'
        ]
      },
      {
        heading: 'Comece do ponto atual',
        paragraphs: [
          'Se hoje você não guarda nada, tentar saltar diretamente para 30% pode ser inviável. Uma progressão de 2% ou 5% por vez cria adaptação. Quando uma dívida termina ou a renda aumenta, redirecione parte da folga antes de criar uma nova despesa.'
        ]
      },
      {
        heading: 'Separe reserva, metas e longo prazo',
        paragraphs: [
          'Nem todo dinheiro guardado tem o mesmo objetivo. Uma parte pode formar reserva, outra financiar uma meta e outra construir patrimônio de longo prazo. Essa separação ajuda a evitar o uso de investimentos de longo prazo para pagar despesas previsíveis.'
        ]
      },
      {
        heading: 'Revise a taxa a cada trimestre',
        paragraphs: [
          'Mudanças de renda e despesas alteram a capacidade de poupança. Uma revisão trimestral é suficiente para a maioria das pessoas. Se a taxa caiu, procure a categoria responsável antes de concluir que “não dá para guardar”.'
        ]
      }
    ],
    takeaway: 'A melhor taxa de poupança é a que você consegue sustentar hoje e aumentar conforme organiza sua vida financeira.'
  }
];

export const PUBLIC_ARTICLE_MAP = new Map(PUBLIC_ARTICLES.map((article) => [article.slug, article]));
