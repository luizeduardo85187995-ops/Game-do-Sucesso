import React, { useState } from 'react';
import { X, Shield, FileText, Lock, CheckCircle2 } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

export default function LegalModal({ isOpen, onClose, initialTab = 'privacy' }: LegalModalProps) {
  const [tab, setTab] = useState<'privacy' | 'terms'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl max-h-[90vh] flex flex-col relative text-slate-300 font-sans">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Transparência Legal & Privacidade</h3>
            <p className="text-xs text-slate-400 font-mono">Em conformidade com a LGPD e Diretrizes Google</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-4 pb-2">
          <button
            type="button"
            onClick={() => setTab('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tab === 'privacy'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/10'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Política de Privacidade</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('terms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tab === 'terms'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/10'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Termos de Uso</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 py-4 space-y-4 text-xs leading-relaxed text-slate-300">
          {tab === 'privacy' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>
                  <strong>Privacidade em Primeiro Lugar:</strong> Seus dados de contas, metas e investimentos são processados e armazenados com criptografia no seu navegador e em nuvem segura via Firebase.
                </span>
              </div>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">1. Informações que Coletamos</h4>
                <p>
                  O aplicativo <strong>Minhas Finanças (Jornada da Meta)</strong> coleta informações estritamente necessárias para a gestão do seu patrimônio pessoal:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Dados de cadastro quando autenticado com Google (Nome, E-mail e Foto de perfil).</li>
                  <li>Registros financeiros inseridos pelo usuário (lançamentos de receitas, despesas, contas e metas).</li>
                  <li>Informações de carteira de investimentos e proventos cadastrados ou importados.</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">2. Uso de Dados e Publicidade</h4>
                <p>
                  O aplicativo autenticado pode exibir <strong>parcerias diretas</strong> identificadas como publicidade para usuários da versão gratuita. Anúncios do <strong>Google AdSense</strong> são restritos às páginas públicas de conteúdo editorial elegíveis e não são carregados em telas privadas de controle financeiro, login, configurações, Dante, pagamento ou administração.
                </p>
                <p className="text-slate-400">
                  Quando anúncios do Google estiverem ativos nas páginas editoriais públicas, Google e parceiros podem utilizar cookies e tecnologias semelhantes conforme as políticas e preferências de anúncios do próprio Google.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">3. Segurança e Sigilo Bancário</h4>
                <p>
                  O aplicativo <strong>não armazena senhas bancárias</strong> e não realiza movimentações financeiras por conta própria. Todas as informações inseridas têm finalidade exclusiva de controle gerencial e planejamento de metas.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">4. Seus Direitos (LGPD)</h4>
                <p>
                  Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o usuário pode solicitar a exclusão integral de seus dados ou exportar suas informações a qualquer momento através do menu de Configurações do aplicativo.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">1. Aceitação dos Termos</h4>
                <p>
                  Ao acessar ou utilizar a plataforma <strong>Minhas Finanças (Jornada da Meta)</strong>, você concorda em cumprir e vincular-se aos presentes Termos de Uso.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">2. Natureza Informativa e Não Consultiva</h4>
                <p>
                  As ferramentas de simulação, radar de dividendos B3, projeções matemáticas e análises geradas pelo assistente virtual Dante IA possuem finalidade unicamente educacional e organizacional. <strong>Não configuram recomendação formal de compra ou venda de ativos financeiros.</strong> Decisões de investimento são de inteira responsabilidade do titular.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">3. Planos e Assinatura PRO</h4>
                <p>
                  O aplicativo oferece uma modalidade gratuita com exibição de anúncios e uma modalidade PRO mediante assinatura mensal ou anual. A assinatura concede acesso a recursos expandidos e desativação completa de peças publicitárias. O cancelamento pode ser efetuado a qualquer momento.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">4. Atualizações dos Termos</h4>
                <p>
                  Reservamo-nos o direito de atualizar estes termos para refletir melhorias contínuas do aplicativo ou exigências regulatórias.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">Última atualização: Setembro de 2026</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
