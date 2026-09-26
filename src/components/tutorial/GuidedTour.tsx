import React, { useState, useEffect } from 'react';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Crown,
  CheckCircle2,
  Minimize2,
  Maximize2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { TabId } from '../../types/navigation';

export interface TourStep {
  id: string;
  tab: TabId;
  title: string;
  subtitle: string;
  badge?: string;
  isProFeature?: boolean;
  proExplanation?: string;
  description: string;
  highlights: string[];
  tips?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    tab: 'overview',
    title: 'Bem-vindo ao Tutorial Guiado!',
    subtitle: 'Conheça cada tela e entenda como transformar suas finanças',
    badge: 'Início',
    description:
      'Este tutorial foi criado para você aprender com calma como funciona cada recurso do aplicativo: desde o controle diário de gastos até o Jogo da Montanha e o que é o Plano PRO.',
    highlights: [
      'Navegação guiada tela por tela em tempo real.',
      'Explicação detalhada dos recursos gratuitos e dos recursos PRO.',
      'Você pode avançar, voltar, pausar ou fechar este tour quando quiser.',
      'Seus dados já cadastrados estão 100% seguros e intactos.',
    ],
    tips: 'Dica: Conforme você avança no tutorial, a tela ao fundo mudará automaticamente para você ver o recurso em ação!',
  },
  {
    id: 'overview',
    tab: 'overview',
    title: '1. Visão Geral: Seu Painel Financeiro',
    subtitle: 'Resumo consolidado de todas as suas finanças em um só lugar',
    badge: 'Gratuito',
    description:
      'A tela de Visão Geral é o centro de comando do seu dinheiro. Nela você vê o saldo total acumulado somando todos os seus bancos, o total de entradas e saídas do mês corrente e o saldo disponível para o dia a dia.',
    highlights: [
      'Saldo Total Consolidado atualizado instantaneamente a cada lançamento.',
      'Cards rápidos de Entradas, Saídas e Balanço Líquido do mês.',
      'Atalhos instantâneos para registrar receitas, despesas e acessar metas.',
      'Modo Privacidade no topo (ícone do olho) para esconder valores em público.',
    ],
    tips: 'Use esta tela diariamente para saber com precisão sua saúde financeira imediata.',
  },
  {
    id: 'transactions',
    tab: 'transactions',
    title: '2. Lançamentos: Despesas & Receitas',
    subtitle: 'Registro minucioso com categorias e ícones personalizados',
    badge: 'Gratuito',
    description:
      'Aqui você registra todas as suas movimentações financeiras: compras no mercado, salário recebido, contas de água e luz, transferências e pagamentos via Pix.',
    highlights: [
      'Adicione receitas e despesas informando valor, data, conta bancária e notas.',
      'Categorias com ícones visuais exclusivos para facilitar a identificação.',
      'Extrato interativo com filtros por mês, ano, tipo e busca rápida por texto.',
      'Edite ou exclua qualquer lançamento com recálculo automático de saldos.',
    ],
    tips: 'Dica: Lançar gastos na hora em que acontecem evita esquecimentos e mantém seus saldos bancários sempre batendo.',
  },
  {
    id: 'banks',
    tab: 'banks',
    title: '3. Bancos & Contas: Carteiras e Saldos',
    subtitle: 'Gerencie todas as suas instituições financeiras em um único painel',
    badge: 'Gratuito',
    description:
      'Cadastre todas as suas contas bancárias (Nubank, Itaú, Bradesco, Inter, Caixa, etc.), carteiras de dinheiro em espécie e contas de poupança.',
    highlights: [
      'Adicione quantas contas e bancos desejar sem limite.',
      'Acompanhe o saldo individual de cada conta e o total somado.',
      'Defina saldo inicial e cores para cada instituição financeira.',
      'Extrato filtrado especificamente por conta bancária.',
    ],
    tips: 'Isso permite que você saiba exatamente em qual banco está o seu dinheiro sem precisar abrir vários aplicativos ao mesmo tempo.',
  },
  {
    id: 'investments',
    tab: 'investments',
    title: '4. Investimentos: Carteira Patrimonial',
    subtitle: 'Acompanhamento de ativos de Renda Fixa, FIIs, Ações e Cripto',
    badge: 'Recurso PRO',
    isProFeature: true,
    proExplanation:
      '👑 O que é um Recurso PRO aqui? O módulo de Investimentos é um benefício exclusivo para assinantes PRO. Ele permite cadastrar seus ativos reais (Tesouro Direto, CDBs, Fundos Imobiliários, Ações e Criptomoedas), acompanhar rentabilidades, calcular o crescimento do seu patrimônio com juros compostos e simular rendimentos sem anúncios.',
    description:
      'A tela de Investimentos foi projetada para quem quer fazer o dinheiro trabalhar a seu favor e construir independência financeira a longo prazo.',
    highlights: [
      'Consolidação de patrimônio investido vs saldo em conta corrente.',
      'Acompanhamento de dividendos e proventos mensais.',
      'Gráficos de alocação por classe de ativos (Renda Fixa vs Renda Variável).',
      'Disponível com demonstração gratuita e desbloqueio total no Plano PRO.',
    ],
    tips: 'Recursos essenciais como despesas, receitas e bancos continuam sempre 100% gratuitos para todos os usuários!',
  },
  {
    id: 'planning',
    tab: 'planning',
    title: '5. Planejar: Metas & Regra 50/30/20',
    subtitle: 'Estruturação de orçamentos e Editor Completo de Metas',
    badge: 'Gratuito',
    description:
      'O coração do seu planejamento estratégico! Aqui você define limites mensais para não gastar mais do que ganha e gerencia suas metas de vida.',
    highlights: [
      'Metodologia 50/30/20: 50% para Necessidades, 30% para Desejos e 20% para Metas.',
      'Editor de Metas: ajuste nome, valor alvo, valor já guardado, cor e ícone emoji.',
      'Gestão de Categorias: adicione novas categorias de receitas e despesas com ícones.',
      'Vinculação direta das suas metas ao Jogo da Montanha.',
    ],
    tips: 'Ao criar uma meta (ex: Reserva de Emergência ou Viagem), ela pode ser escalada no jogo da Jornada da Meta!',
  },
  {
    id: 'reports',
    tab: 'reports',
    title: '6. Relatórios: Gráficos & Estatísticas',
    subtitle: 'Visualização clara para descobrir onde você pode economizar',
    badge: 'Gratuito',
    description:
      'Gráficos inteligentes que revelam padrões nos seus hábitos financeiros para você tomar decisões embasadas em dados reais.',
    highlights: [
      'Gráfico de pizza com percentual de gastos por categoria.',
      'Histórico de evolução mensal comparando receitas vs despesas.',
      'Indicadores de taxa de economia e sobras financeiras.',
      'Relatórios visuais limpos e fáceis de entender.',
    ],
    tips: 'Olhe os relatórios no final de cada mês para identificar despesas desnecessárias que podem ser cortadas.',
  },
  {
    id: 'ai',
    tab: 'ai',
    title: '7. Dante IA: Seu Mentor Financeiro Inteligente',
    subtitle: 'Inteligência Artificial aplicada às suas decisões de dinheiro',
    badge: 'Recurso PRO',
    isProFeature: true,
    proExplanation:
      '👑 O que é um Recurso PRO aqui? O Dante IA é o nosso consultor financeiro inteligente alimentado por modelos de inteligência artificial de ponta. Assinantes PRO têm conversas ilimitadas para tirar dúvidas, pedir diagnósticos sobre gastos, simular quitação de dívidas e receber planos de ação personalizados para economizar mais rápido.',
    description:
      'Dante conversa com você em português claro, analisa cenários financeiros e dá conselhos práticos para você atingir seus objetivos.',
    highlights: [
      'Análise inteligente personalizada do seu perfil de gastos.',
      'Estratégias sob medida para cortar despesas sem sofrimento.',
      'Respostas instantâneas para qualquer dúvida de finanças pessoais.',
      'Disponível para teste e com acesso ilimitado para usuários PRO.',
    ],
    tips: 'Pergunte coisas como: "Como posso montar minha reserva de emergência mais rápido?" ou "Qual a melhor estratégia para cortar gastos de delivery?"',
  },
  {
    id: 'game',
    tab: 'game',
    title: '8. Jornada da Meta: O Jogo da Montanha',
    subtitle: 'Gamificação onde suas economias reais escalam montanhas',
    badge: 'Gratuito',
    description:
      'O recurso exclusivo e mais amado do Minhas Finanças! Guardar dinheiro deixa de ser uma obrigação chata e se transforma em uma divertida escalada rumo ao cume.',
    highlights: [
      'Cada meta criada vira uma montanha viva com fases e acampamentos.',
      'Aporte dinheiro na meta e veja seu herói subir em direção ao topo.',
      'Barra de ações: Aportar, Retirar saldo, Mudar de Herói e Editar a Meta.',
      'Seletor inferior para alternar facilmente entre todas as suas metas.',
    ],
    tips: 'A disciplina financeira se torna natural quando você vê seu personagem alcançando o topo da montanha a cada economia!',
  },
  {
    id: 'settings',
    tab: 'settings',
    title: '9. Configurações & Nuvem Google',
    subtitle: 'Segurança absoluta, temas visuais e backup automático',
    badge: 'Gratuito',
    description:
      'Personalize a aparência do sistema e garanta que suas informações financeiras estejam sempre seguras e sincronizadas.',
    highlights: [
      'Sincronização em Nuvem Firestore com sua Conta Google (gratuita e segura).',
      'Backup e Restauração completa de dados em JSON e exportação para Excel.',
      'Diversos temas visuais (Modo Escuro Cyber, Azul Executivo, Claro Minimalista).',
      'Efeitos visuais, controle sonoro e formatação de moeda.',
    ],
    tips: 'Recomendamos conectar sua Conta Google para que seus dados fiquem salvos mesmo se você trocar de dispositivo.',
  },
  {
    id: 'pro_summary',
    tab: 'overview',
    title: '10. O Que é o Plano PRO? (Resumo Transparente)',
    subtitle: 'Tudo o que você precisa saber sobre o que é gratuito e o que é PRO',
    badge: 'Dúvidas & PRO',
    isProFeature: true,
    proExplanation:
      '👑 Transparência total: Nosso compromisso é que o Minhas Finanças seja sempre uma ferramenta acessível e completa. Por isso, a versão Gratuita NUNCA terá limites para suas despesas, receitas, bancos ou metas.',
    description:
      'Veja abaixo a comparação clara do que você tem gratuitamente e do que ganha ao apoiar o projeto com o Plano PRO:',
    highlights: [
      '✅ 100% GRATUITO PARA SEMPRE: Gestão de despesas e receitas ilimitadas, todos os bancos e carteiras, planejamento 50/30/20, editor de metas, Jogo da Montanha completo, backup Excel/JSON e sincronização Google Cloud.',
      '👑 RECURSOS PRO: Experiência 100% LIVRE DE ANÚNCIOS, Dante Inteligência Artificial com consultas ilimitadas, Módulo Completo de Investimentos e rentabilidade, Skins exclusivas para a Jornada da Meta e suporte prioritário.',
      'O Plano PRO é totalmente opcional e serve para quem busca recursos de ponta em inteligência artificial e carteira de investimentos sem anúncios.',
    ],
    tips: 'Você pode assinar o PRO a qualquer momento pelo botão "PRO" no topo ou continuar usando todos os recursos gratuitos com total liberdade!',
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabId;
  onNavigateTab: (tab: TabId) => void;
  onOpenProModal?: () => void;
}

export default function GuidedTour({
  isOpen,
  onClose,
  activeTab,
  onNavigateTab,
  onOpenProModal,
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Sync tab when opening or advancing step
  useEffect(() => {
    if (isOpen) {
      const step = TOUR_STEPS[currentStepIndex];
      if (step && step.tab !== activeTab) {
        onNavigateTab(step.tab);
      }
    }
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const totalSteps = TOUR_STEPS.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onNavigateTab(TOUR_STEPS[nextIndex].tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onNavigateTab(TOUR_STEPS[prevIndex].tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    onNavigateTab(TOUR_STEPS[index].tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('has_completed_guided_tour', 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <>
      {/* Subtle Backdrop highlight when maximized */}
      {!isMinimized && (
        <div
          onClick={() => {}}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 transition-opacity pointer-events-none"
        />
      )}

      {/* Floating Tour Dock / Card */}
      <div className="fixed z-50 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[540px] max-w-full">
        <div className="bg-slate-950/95 text-white border-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/20 rounded-2xl backdrop-blur-2xl overflow-hidden flex flex-col transition-all">
          {/* Header bar */}
          <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 px-4 py-3 border-b border-cyan-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/30">
                <Compass className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase text-cyan-400">
                    Tutorial Guiado
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Passo {currentStepIndex + 1} de {totalSteps}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Explorando: <span className="text-white font-semibold">{currentStep.title.split(':')[0]}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Minimize / Close) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title={isMinimized ? 'Expandir tutorial' : 'Minimizar tutorial para ver a tela'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4 text-cyan-400" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Fechar tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 h-1.5 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-amber-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Content Body (When not minimized) */}
          {!isMinimized && (
            <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto no-scrollbar space-y-4">
              {/* Title & Badge */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                    {currentStep.title}
                  </h3>
                  <p className="text-xs text-cyan-300/90 font-medium mt-0.5">
                    {currentStep.subtitle}
                  </p>
                </div>
                {currentStep.badge && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 uppercase tracking-wider border ${
                      currentStep.isProFeature
                        ? 'bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-amber-300 border-amber-400/50 shadow-sm shadow-amber-500/20'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {currentStep.isProFeature && <Crown className="w-3 h-3 inline mr-1 text-amber-400" />}
                    {currentStep.badge}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                {currentStep.description}
              </p>

              {/* Special PRO Explanation Block if applicable */}
              {currentStep.proExplanation && (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-yellow-950/20 to-slate-900 border border-amber-400/40 shadow-inner">
                  <div className="flex items-center gap-2 mb-1.5 text-amber-300 text-xs font-black">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>O que é um Recurso PRO?</span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {currentStep.proExplanation}
                  </p>
                </div>
              )}

              {/* Bullet Highlights */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  O que você faz nesta tela:
                </span>
                <div className="space-y-1.5">
                  {currentStep.highlights.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-200 bg-white/[0.02] p-2 rounded-lg border border-white/5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Tip */}
              {currentStep.tips && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{currentStep.tips}</span>
                </div>
              )}

              {/* Step Navigation Pill Map (Clickable Dots) */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                <span className="text-[10px] text-slate-500 font-mono">Ir direto para:</span>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                  {TOUR_STEPS.map((s, idx) => {
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleJumpToStep(idx)}
                        className={`h-6 px-2 rounded-md text-[10px] font-mono font-bold transition-all shrink-0 ${
                          isCurrent
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40 scale-105'
                            : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={`${idx + 1}. ${s.title}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="bg-slate-900/90 px-4 py-3 border-t border-cyan-500/20 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleFinish}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors font-medium"
            >
              Pular / Sair
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
              )}

              {currentStep.isProFeature && onOpenProModal && (
                <button
                  type="button"
                  onClick={onOpenProModal}
                  className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border border-amber-400/40 text-amber-300 text-xs font-black items-center gap-1 hover:bg-amber-400/30 transition-all"
                >
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>Ver PRO</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <span>{currentStepIndex === totalSteps - 1 ? 'Concluir Tutorial' : 'Próximo Passo'}</span>
                {currentStepIndex === totalSteps - 1 ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
