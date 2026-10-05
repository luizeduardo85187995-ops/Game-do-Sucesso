import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Compass,
  LineChart,
  Mail,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import PublicAdSense from './PublicAdSense';
import { PUBLIC_ARTICLE_MAP, PUBLIC_ARTICLES, PublicArticle } from './publicContent';

const SITE_URL = 'https://jornada-do-sucesso-swart.vercel.app';
const CONTACT_EMAIL = 'luizeduardo85187995@gmail.com';

type SeoData = {
  title: string;
  description: string;
  canonicalPath: string;
};

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let meta = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    if (property) meta.setAttribute('property', name);
    else meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function usePageSeo({ title, description, canonicalPath }: SeoData) {
  useEffect(() => {
    document.documentElement.lang = 'pt-BR';
    document.title = title;
    setMeta('description', description);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'website', true);
    setMeta('twitter:card', 'summary_large_image');

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE_URL}${canonicalPath}`;
  }, [title, description, canonicalPath]);
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-3" aria-label="Jornada do Sucesso - início">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="font-black leading-none text-slate-950">Jornada do Sucesso</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-500">Finanças pessoais com direção</div>
          </div>
        </a>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex" aria-label="Navegação principal">
          <a className="hover:text-emerald-700" href="/educacao-financeira">Educação financeira</a>
          <a className="hover:text-emerald-700" href="/ferramentas">Ferramentas</a>
          <a className="hover:text-emerald-700" href="/como-funciona">Como funciona</a>
          <a className="hover:text-emerald-700" href="/metodologia">Metodologia</a>
          <a className="hover:text-emerald-700" href="/sobre">Sobre</a>
        </nav>

        <a
          href="/app"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
        >
          Abrir aplicativo
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 lg:hidden" aria-label="Navegação móvel">
        <a className="shrink-0 hover:text-emerald-700" href="/educacao-financeira">Educação financeira</a>
        <a className="shrink-0 hover:text-emerald-700" href="/ferramentas">Ferramentas</a>
        <a className="shrink-0 hover:text-emerald-700" href="/como-funciona">Como funciona</a>
        <a className="shrink-0 hover:text-emerald-700" href="/metodologia">Metodologia</a>
        <a className="shrink-0 hover:text-emerald-700" href="/sobre">Sobre</a>
      </nav>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-3 flex items-center gap-2 font-black text-white">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Jornada do Sucesso
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            Conteúdo, ferramentas e um aplicativo de organização financeira para ajudar pessoas comuns a entender gastos, criar bons hábitos, construir reserva e acompanhar metas com consistência.
          </p>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            O conteúdo é educativo e não constitui recomendação individual de investimento, crédito ou produto financeiro.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-black text-white">Conteúdo</p>
          <div className="space-y-2 text-sm text-slate-400">
            <a className="block hover:text-white" href="/educacao-financeira">Educação financeira</a>
            <a className="block hover:text-white" href="/ferramentas">Ferramentas gratuitas</a>
            <a className="block hover:text-white" href="/metodologia">Metodologia</a>
            <a className="block hover:text-white" href="/como-funciona">Como funciona</a>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-black text-white">Institucional</p>
          <div className="space-y-2 text-sm text-slate-400">
            <a className="block hover:text-white" href="/sobre">Sobre</a>
            <a className="block hover:text-white" href="/contato">Contato</a>
            <a className="block hover:text-white" href="/privacidade">Privacidade</a>
            <a className="block hover:text-white" href="/termos">Termos de uso</a>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Jornada do Sucesso. Organização financeira é construída com informação, hábito e acompanhamento.
      </div>
    </footer>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{eyebrow}</p>
      <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>}
    </div>
  );
}

function HomePage() {
  usePageSeo({
    title: 'Jornada do Sucesso | Organização financeira, hábitos e metas',
    description: 'Aprenda a organizar despesas, criar reserva, acompanhar metas e melhorar seus hábitos financeiros com conteúdo, ferramentas e um aplicativo completo.',
    canonicalPath: '/',
  });

  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.20),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,.14),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Educação + ferramenta + acompanhamento
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Pare de descobrir no fim do mês que o dinheiro acabou.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A Jornada do Sucesso ajuda você a entender para onde o dinheiro vai, organizar despesas, criar reserva, acompanhar metas e construir hábitos financeiros melhores sem transformar sua vida em uma planilha impossível.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/app" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-400">
                Começar no aplicativo <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/educacao-financeira" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-bold text-white transition hover:bg-white/10">
                <BookOpen className="h-4 w-4" /> Ler guias gratuitos
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-3xl bg-white p-6 text-slate-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Exemplo de revisão mensal</p>
                  <p className="mt-1 text-2xl font-black">Seu dinheiro com contexto</p>
                </div>
                <LineChart className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">Receitas</p>
                  <p className="mt-1 text-lg font-black text-emerald-700">R$ 5.200</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">Despesas</p>
                  <p className="mt-1 text-lg font-black text-rose-600">R$ 4.410</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">Meta do mês</p>
                  <p className="mt-1 text-lg font-black text-slate-900">R$ 700</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold text-emerald-700">Guardado</p>
                  <p className="mt-1 text-lg font-black text-emerald-800">R$ 790</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <strong>Dante:</strong> alimentação fora de casa subiu por três semanas. Se você reduzir R$ 160 nesta categoria, mantém a meta sem cortar todo o lazer.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle
            eyebrow="O problema que resolvemos"
            title="Organização financeira precisa gerar decisões, não só gráficos"
            description="O objetivo do Jornada do Sucesso é transformar dados do dia a dia em hábitos que você consegue manter."
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              [Wallet, 'Enxergue o fluxo', 'Receitas, despesas, contas e compromissos em um só lugar para entender o que realmente está disponível.'],
              [PiggyBank, 'Crie margem', 'Identifique vazamentos e transforme pequenas sobras em reserva antes que elas virem consumo automático.'],
              [Target, 'Acompanhe metas', 'Defina valor, prazo e contribuição mensal. A Jornada da Meta deixa o progresso visível.'],
              [Bot, 'Tenha um treinador', 'O Dante interpreta padrões, questiona hábitos e ajuda a transformar intenção em ações financeiras concretas.'],
            ].map(([Icon, title, text]) => {
              const Comp = Icon as React.ComponentType<{ className?: string }>;
              return (
                <div key={String(title)} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Comp className="h-5 w-5" /></div>
                  <h3 className="text-lg font-black text-slate-950">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{String(text)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Aprenda antes de decidir" title="Guias práticos para problemas financeiros reais" description="Conteúdo original ligado às mesmas decisões que você acompanha dentro do aplicativo." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_ARTICLES.slice(0, 6).map((article) => (
              <a key={article.slug} href={`/educacao-financeira/${article.slug}`} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg">
                <div className="mb-4 flex items-center justify-between text-xs font-bold">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{article.category}</span>
                  <span className="text-slate-400">{article.readTime}</span>
                </div>
                <h3 className="text-xl font-black leading-7 text-slate-950 group-hover:text-emerald-700">{article.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{article.description}</p>
                <div className="mt-5 flex items-center gap-1 text-sm font-black text-emerald-700">Ler guia <ChevronRight className="h-4 w-4" /></div>
              </a>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a href="/educacao-financeira" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-900 hover:border-emerald-400 hover:text-emerald-700">
              Ver todos os guias <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Ferramentas gratuitas</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Faça contas úteis antes de abrir o aplicativo</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">Calcule uma meta de reserva e quanto precisa guardar por mês. As ferramentas públicas não pedem login e não exibem anúncios do Google em telas de cálculo.</p>
            <a href="/ferramentas" className="mt-6 inline-flex items-center gap-2 font-black text-emerald-700">Abrir ferramentas <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
              <Calculator className="h-7 w-7 text-emerald-700" />
              <h3 className="mt-4 text-lg font-black text-emerald-950">Reserva de emergência</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-900/80">Transforme seu custo essencial em uma meta de 1, 3 ou 6 meses.</p>
            </div>
            <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6">
              <Target className="h-7 w-7 text-cyan-700" />
              <h3 className="mt-4 text-lg font-black text-cyan-950">Meta mensal</h3>
              <p className="mt-2 text-sm leading-6 text-cyan-900/80">Descubra quanto precisa separar por mês para atingir um objetivo no prazo.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-emerald-700 py-16 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6">
          <Compass className="h-9 w-9 text-emerald-200" />
          <h2 className="mt-4 text-3xl font-black">Conhecimento ajuda. Acompanhamento muda o hábito.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50">Use os guias para entender o problema e o aplicativo para acompanhar se as decisões estão realmente melhorando seus números.</p>
          <a href="/app" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-emerald-800">Abrir Jornada do Sucesso <ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>
    </>
  );
}

function EducationPage() {
  usePageSeo({
    title: 'Educação Financeira | Jornada do Sucesso',
    description: 'Guias práticos sobre orçamento, reserva, cartão, metas e hábitos financeiros para organizar melhor o dinheiro.',
    canonicalPath: '/educacao-financeira',
  });

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <BookOpen className="mx-auto h-9 w-9 text-emerald-700" />
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Educação financeira para decisões do dia a dia</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">Sem promessa de enriquecimento rápido. Os guias abaixo ajudam a entender despesas, criar margem, lidar com cartão, construir reserva e transformar objetivos em metas acompanháveis.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_ARTICLES.map((article) => (
            <article key={article.slug} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{article.category}</span>
                <span className="text-slate-400">{article.readTime}</span>
              </div>
              <h2 className="mt-4 text-xl font-black leading-7 text-slate-950">{article.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{article.description}</p>
              <a href={`/educacao-financeira/${article.slug}`} className="mt-5 inline-flex items-center gap-1 text-sm font-black text-emerald-700">Ler conteúdo completo <ChevronRight className="h-4 w-4" /></a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ArticlePage({ article }: { article: PublicArticle }) {
  usePageSeo({
    title: `${article.title} | Jornada do Sucesso`,
    description: article.description,
    canonicalPath: `/educacao-financeira/${article.slug}`,
  });

  return (
    <main className="bg-slate-50">
      <article className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <a href="/educacao-financeira" className="text-sm font-bold text-emerald-700 hover:underline">← Voltar para Educação Financeira</a>
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">{article.category}</span>
            <span className="text-slate-400">{article.readTime} de leitura</span>
            <span className="text-slate-400">Atualizado em {new Date(`${article.updatedAt}T12:00:00`).toLocaleDateString('pt-BR')}</span>
          </div>
          <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">{article.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{article.intro}</p>

          <div className="mt-9 space-y-10">
            {article.sections.map((section, index) => (
              <React.Fragment key={section.heading}>
                {index === 2 && <PublicAdSense />}
                <section>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">{section.heading}</h2>
                  <div className="mt-4 space-y-4 text-base leading-8 text-slate-700">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                  {section.bullets && (
                    <ul className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                      {section.bullets.map((item) => (
                        <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> <span>{item}</span></li>
                      ))}
                    </ul>
                  )}
                  {section.tip && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950"><strong>Aplicação prática:</strong> {section.tip}</div>}
                </section>
              </React.Fragment>
            ))}
          </div>

          <div className="mt-10 rounded-3xl bg-slate-950 p-6 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Ideia principal</p>
            <p className="mt-3 text-lg font-bold leading-8">{article.takeaway}</p>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-black text-slate-950">Leve o aprendizado para seus próprios números</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">No aplicativo, você pode acompanhar categorias, metas, contas e histórico. O Dante usa esses dados para ajudar a identificar hábitos e prioridades.</p>
            <a href="/app" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700">Abrir aplicativo <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </article>
    </main>
  );
}

function ToolsPage() {
  usePageSeo({
    title: 'Ferramentas Financeiras Gratuitas | Jornada do Sucesso',
    description: 'Calcule sua reserva de emergência e quanto precisa guardar por mês para atingir uma meta financeira.',
    canonicalPath: '/ferramentas',
  });

  const [essentialCost, setEssentialCost] = useState(2500);
  const [reserveMonths, setReserveMonths] = useState(6);
  const [goalValue, setGoalValue] = useState(10000);
  const [alreadySaved, setAlreadySaved] = useState(1000);
  const [deadlineMonths, setDeadlineMonths] = useState(12);

  const reserveTarget = Math.max(0, essentialCost) * Math.max(1, reserveMonths);
  const monthlyGoal = Math.max(0, goalValue - alreadySaved) / Math.max(1, deadlineMonths);
  const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <Calculator className="mx-auto h-9 w-9 text-emerald-700" />
          <h1 className="mt-4 text-4xl font-black text-slate-950">Ferramentas financeiras simples e úteis</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">Faça contas rápidas sem cadastro. Nenhum valor digitado nesta página é salvo ou enviado ao aplicativo.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3"><PiggyBank className="h-6 w-6 text-emerald-700" /><h2 className="text-2xl font-black text-slate-950">Reserva de emergência</h2></div>
          <p className="mt-3 text-sm leading-6 text-slate-600">Use o custo mensal essencial, não o gasto total com lazer e compras opcionais.</p>
          <label className="mt-6 block text-sm font-bold text-slate-700">Despesas essenciais por mês</label>
          <input type="number" min="0" value={essentialCost} onChange={(e) => setEssentialCost(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-emerald-500" />
          <label className="mt-5 block text-sm font-bold text-slate-700">Meses de proteção</label>
          <select value={reserveMonths} onChange={(e) => setReserveMonths(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-emerald-500">
            <option value={1}>1 mês — primeiro degrau</option><option value={3}>3 meses</option><option value={6}>6 meses</option><option value={9}>9 meses</option><option value={12}>12 meses</option>
          </select>
          <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Meta estimada</p>
            <p className="mt-1 text-3xl font-black text-emerald-950">{brl(reserveTarget)}</p>
            <p className="mt-2 text-xs leading-5 text-emerald-900/80">A quantidade de meses depende da estabilidade da sua renda, dependentes, seguros e riscos pessoais.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3"><Target className="h-6 w-6 text-cyan-700" /><h2 className="text-2xl font-black text-slate-950">Quanto guardar por mês</h2></div>
          <p className="mt-3 text-sm leading-6 text-slate-600">Veja se sua meta cabe no prazo antes de se comprometer com um valor impossível.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">Valor da meta<input type="number" min="0" value={goalValue} onChange={(e) => setGoalValue(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-950 outline-none focus:border-cyan-500" /></label>
            <label className="text-sm font-bold text-slate-700">Já guardado<input type="number" min="0" value={alreadySaved} onChange={(e) => setAlreadySaved(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-950 outline-none focus:border-cyan-500" /></label>
          </div>
          <label className="mt-5 block text-sm font-bold text-slate-700">Prazo em meses</label>
          <input type="number" min="1" value={deadlineMonths} onChange={(e) => setDeadlineMonths(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-cyan-500" />
          <div className="mt-6 rounded-2xl bg-cyan-50 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-cyan-700">Contribuição mensal</p>
            <p className="mt-1 text-3xl font-black text-cyan-950">{brl(monthlyGoal)}</p>
            <p className="mt-2 text-xs leading-5 text-cyan-900/80">Se esse valor não cabe no orçamento, ajuste o prazo, o valor final ou sua capacidade mensal. A matemática precisa fechar antes da motivação.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 pb-16 text-center sm:px-6">
        <p className="text-sm leading-6 text-slate-600">Quer acompanhar essas metas automaticamente? O aplicativo permite registrar objetivos, movimentações e progresso ao longo do tempo.</p>
        <a href="/app" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700">Abrir Jornada do Sucesso <ArrowRight className="h-4 w-4" /></a>
      </section>
    </main>
  );
}

const STATIC_PAGES: Record<string, { title: string; description: string; icon: React.ComponentType<{ className?: string }>; body: React.ReactNode }> = {
  '/como-funciona': {
    title: 'Como funciona | Jornada do Sucesso',
    description: 'Entenda como o Jornada do Sucesso conecta organização financeira, metas, investimentos e o consultor Dante.',
    icon: Compass,
    body: (
      <div className="space-y-8">
        <p>O Jornada do Sucesso foi criado para pessoas que querem melhorar a relação com dinheiro, mas não precisam de mais uma planilha complicada. O processo começa pelo registro das informações que realmente influenciam decisões: receitas, despesas, contas, metas e investimentos.</p>
        {[
          ['1. Organize o que entra e o que sai', 'Registre ou importe movimentações e classifique-as. O objetivo é enxergar o fluxo real, não depender da memória ou apenas da fatura do cartão.'],
          ['2. Entenda padrões', 'Relatórios e indicadores mostram quais categorias crescem, quanto da renda está comprometido e como o mês atual se compara aos anteriores.'],
          ['3. Transforme intenção em meta', 'Defina um valor e um prazo. A Jornada da Meta mostra o progresso e ajuda a manter objetivos visíveis durante o mês.'],
          ['4. Converse com o Dante', 'O consultor financeiro usa o contexto do aplicativo para questionar hábitos, explicar números e sugerir ações. Ele não substitui decisão profissional nem faz movimentações bancárias por conta própria.'],
          ['5. Revise e ajuste', 'Organização financeira é um processo contínuo. Uma revisão semanal curta e uma revisão mensal mais completa ajudam a corrigir rota antes que pequenos problemas virem dívidas.'],
        ].map(([title, text]) => <section key={title}><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-2">{text}</p></section>)}
      </div>
    )
  },
  '/metodologia': {
    title: 'Metodologia | Jornada do Sucesso',
    description: 'A metodologia de cinco etapas usada pelo Jornada do Sucesso para construir organização, reserva, metas e patrimônio.',
    icon: Target,
    body: (
      <div className="space-y-8">
        <p>A metodologia prioriza comportamento antes de complexidade. O objetivo não é fazer a pessoa decorar termos financeiros; é criar uma sequência de decisões que melhore o fluxo de caixa e torne o hábito de guardar dinheiro repetível.</p>
        {[
          ['Etapa 1 — Clareza', 'Saber quanto entra, quanto sai, quais compromissos estão próximos e quais gastos são ajustáveis. Sem clareza, qualquer meta vira palpite.'],
          ['Etapa 2 — Margem', 'Criar uma sobra recorrente. Isso pode vir de cortes, renegociação, eliminação de desperdícios ou aumento de renda. Margem é o combustível das próximas etapas.'],
          ['Etapa 3 — Proteção', 'Construir reserva de emergência em degraus, começando por uma proteção pequena e evoluindo até uma faixa compatível com os riscos da pessoa.'],
          ['Etapa 4 — Direção', 'Criar metas com valor, prazo e contribuição mensal. Dinheiro guardado sem objetivo pode ser facilmente consumido; uma meta clara dá direção ao esforço.'],
          ['Etapa 5 — Crescimento', 'Depois de fluxo organizado, dívidas caras controladas e reserva adequada, o foco pode avançar para investimento de longo prazo e construção de patrimônio.'],
        ].map(([title, text]) => <section key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-2">{text}</p></section>)}
      </div>
    )
  },
  '/sobre': {
    title: 'Sobre | Jornada do Sucesso',
    description: 'Conheça a proposta do Jornada do Sucesso e os princípios usados no desenvolvimento do aplicativo e do conteúdo.',
    icon: ShieldCheck,
    body: (
      <div className="space-y-6">
        <p>O Jornada do Sucesso é uma plataforma de organização financeira pessoal que combina controle de despesas, contas, metas, investimentos, educação financeira e um consultor de inteligência artificial chamado Dante.</p>
        <p>A proposta é atender principalmente pessoas que sabem que precisam se organizar, mas ainda não criaram hábitos consistentes. Por isso, o produto evita tratar finanças como uma competição de fórmulas e prioriza clareza, acompanhamento e decisões práticas.</p>
        <p>O conteúdo público é produzido para explicar os mesmos problemas que aparecem dentro do aplicativo: gastos recorrentes, cartão, reserva, metas, disciplina e planejamento. Não publicamos promessas de retorno, enriquecimento rápido ou recomendações individualizadas de investimento.</p>
        <p>O aplicativo não movimenta contas bancárias, não solicita senhas bancárias e não substitui profissionais habilitados quando a situação exige orientação financeira, jurídica, contábil ou de investimentos específica.</p>
      </div>
    )
  },
  '/privacidade': {
    title: 'Política de Privacidade | Jornada do Sucesso',
    description: 'Saiba quais dados o Jornada do Sucesso utiliza, como são armazenados e como funcionam autenticação, IA e publicidade.',
    icon: ShieldCheck,
    body: (
      <div className="space-y-8">
        <section><h2 className="text-xl font-black text-slate-950">Dados do aplicativo</h2><p className="mt-2">Quando você utiliza o aplicativo, podem ser processados dados de autenticação do Google, registros financeiros inseridos por você, contas, metas, investimentos e preferências. Esses dados servem para fornecer as funções de organização e sincronização solicitadas pelo usuário.</p></section>
        <section><h2 className="text-xl font-black text-slate-950">Autenticação e nuvem</h2><p className="mt-2">A autenticação e a sincronização utilizam Firebase. O aplicativo não solicita sua senha do Google nem armazena senhas bancárias.</p></section>
        <section><h2 className="text-xl font-black text-slate-950">Dante e inteligência artificial</h2><p className="mt-2">Ao usar o Dante, informações financeiras necessárias para responder à pergunta podem ser processadas por um provedor de inteligência artificial através do backend do Jornada do Sucesso. Evite inserir senhas, números completos de cartões ou credenciais bancárias no chat.</p></section>
        <section><h2 className="text-xl font-black text-slate-950">Publicidade</h2><p className="mt-2">O aplicativo autenticado pode exibir parcerias diretas identificadas como publicidade. Anúncios do Google AdSense são restritos a páginas públicas de conteúdo editorial elegíveis, e não são carregados dentro das telas privadas de controle financeiro, login, configurações, Dante, pagamento ou administração. Quando ativos nas páginas editoriais, Google e parceiros podem utilizar cookies e tecnologias semelhantes conforme suas próprias políticas e preferências de anúncios.</p></section>
        <section><h2 className="text-xl font-black text-slate-950">Seus direitos</h2><p className="mt-2">Você pode utilizar as funções de exportação e exclusão disponibilizadas no aplicativo e entrar em contato para dúvidas relacionadas à privacidade pelo canal informado na página de contato.</p></section>
      </div>
    )
  },
  '/termos': {
    title: 'Termos de Uso | Jornada do Sucesso',
    description: 'Termos de uso do site público, aplicativo Jornada do Sucesso e consultor financeiro Dante.',
    icon: ShieldCheck,
    body: (
      <div className="space-y-8">
        <section><h2 className="text-xl font-black text-slate-950">Natureza educativa</h2><p className="mt-2">O conteúdo e as análises disponibilizadas têm finalidade de organização e educação financeira. Não constituem oferta, garantia de retorno ou recomendação individual de investimento, crédito, seguro ou produto financeiro.</p></section>
        <section><h2 className="text-xl font-black text-slate-950">Responsabilidade do usuário</h2><p className="mt-2">O usuário é responsável pela veracidade dos dados inseridos e pelas decisões tomadas com base nas informações do sistema. Cálculos e projeções devem ser conferidos quando forem utilizados em decisões relevantes.</p></section>
        <section><h2 className="text-xl font-black text-slate-950">Inteligência artificial</h2><p className="mt-2">Respostas do Dante podem conter imprecisões. O usuário deve tratar a IA como apoio à organização e reflexão, não como autoridade única para decisões financeiras ou de investimento.</p></section>
        <section><h2 className="text-xl font-black text-slate-950">Assinaturas</h2><p className="mt-2">Recursos PRO podem depender de pagamento e validação pela plataforma de checkout indicada no aplicativo. Condições comerciais, renovação e cancelamento devem seguir as informações apresentadas no momento da contratação.</p></section>
      </div>
    )
  },
  '/contato': {
    title: 'Contato | Jornada do Sucesso',
    description: 'Entre em contato com a equipe responsável pelo Jornada do Sucesso.',
    icon: Mail,
    body: (
      <div className="space-y-5">
        <p>Para dúvidas sobre o aplicativo, privacidade, assinatura, conteúdo ou correção de informações, utilize o e-mail abaixo.</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-black text-white"><Mail className="h-4 w-4" /> {CONTACT_EMAIL}</a>
        <p className="text-sm text-slate-500">Não envie senhas, chaves privadas, dados completos de cartões ou credenciais bancárias por e-mail.</p>
      </div>
    )
  },
};

function StaticPage({ path }: { path: string }) {
  const page = STATIC_PAGES[path];
  const Icon = page.icon;
  usePageSeo({ title: page.title, description: page.description, canonicalPath: path });
  return (
    <main className="bg-slate-50 py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <Icon className="h-9 w-9 text-emerald-700" />
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">{page.title.replace(' | Jornada do Sucesso', '')}</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{page.description}</p>
          <div className="prose-like mt-9 space-y-6 text-base leading-8 text-slate-700">{page.body}</div>
        </div>
      </div>
    </main>
  );
}

function NotFoundPage() {
  usePageSeo({ title: 'Página não encontrada | Jornada do Sucesso', description: 'A página solicitada não foi encontrada.', canonicalPath: '/' });
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-16 text-center">
      <div>
        <p className="text-sm font-black uppercase tracking-wider text-emerald-700">404</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Página não encontrada</h1>
        <p className="mt-4 text-slate-600">O endereço pode ter mudado ou não existir.</p>
        <a href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Voltar ao início <ArrowRight className="h-4 w-4" /></a>
      </div>
    </main>
  );
}

export default function PublicSite() {
  const path = useMemo(() => {
    const normalized = window.location.pathname.replace(/\/+$/, '');
    return normalized || '/';
  }, []);

  let page: React.ReactNode;
  if (path === '/') page = <HomePage />;
  else if (path === '/educacao-financeira') page = <EducationPage />;
  else if (path === '/ferramentas') page = <ToolsPage />;
  else if (path.startsWith('/educacao-financeira/')) {
    const slug = path.split('/').filter(Boolean)[1] || '';
    const article = PUBLIC_ARTICLE_MAP.get(slug);
    page = article ? <ArticlePage article={article} /> : <NotFoundPage />;
  } else if (STATIC_PAGES[path]) page = <StaticPage path={path} />;
  else page = <NotFoundPage />;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <PublicHeader />
      {page}
      <PublicFooter />
    </div>
  );
}
