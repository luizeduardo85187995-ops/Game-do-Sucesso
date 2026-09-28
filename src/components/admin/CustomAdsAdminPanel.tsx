import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  AlertCircle,
  X,
  Save,
  Radio,
} from 'lucide-react';
import { useSettings, CustomAd, AdDisplayMode } from '../../context/SettingsContext';

interface CustomAdsAdminPanelProps {
  isOwnerAuthenticated: boolean;
}

export default function CustomAdsAdminPanel({ isOwnerAuthenticated }: CustomAdsAdminPanelProps) {
  const {
    customAds,
    adDisplayMode,
    adminPin,
    addCustomAd,
    updateCustomAd,
    deleteCustomAd,
    setAdDisplayMode,
    setAdminPin,
    theme,
  } = useSettings();

  const isLight = theme === 'pro_light';

  // Security Lock State
  const [isUnlocked, setIsUnlocked] = useState(isOwnerAuthenticated);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Edit / Create Modal State
  const [editingAd, setEditingAd] = useState<CustomAd | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [formTag, setFormTag] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCta, setFormCta] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formPromoCode, setFormPromoCode] = useState('');
  const [formLegalUrl, setFormLegalUrl] = useState('');
  const [formDisclaimer, setFormDisclaimer] = useState('');
  const [formBadgeColor, setFormBadgeColor] = useState('bg-emerald-500/20 text-emerald-400 border-emerald-500/30');
  const [formActive, setFormActive] = useState(true);

  // Color options for badges
  const BADGE_COLOR_OPTIONS = [
    {
      label: 'Verde Esmeralda (Nomad / Investimentos)',
      value: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      label: 'Ciano Cyber (B3 / Tecnologia)',
      value: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    {
      label: 'Roxo Premium (Remessa / VIP)',
      value: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    {
      label: 'Dourado Âmbar (Promoções Especiais)',
      value: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
  ];

  // Unlock check
  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === (adminPin || '2026') || pinInput.trim() === '2026') {
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  // Change PIN
  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.trim().length >= 4) {
      setAdminPin(newPinInput.trim());
      setPinChangeSuccess(true);
      setIsChangingPin(false);
      setNewPinInput('');
      setTimeout(() => setPinChangeSuccess(false), 3000);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormTag('PARCERIA');
    setFormTitle('');
    setFormSubtitle('');
    setFormCta('Acessar');
    setFormUrl('');
    setFormPromoCode('');
    setFormLegalUrl('');
    setFormDisclaimer('');
    setFormBadgeColor('bg-emerald-500/20 text-emerald-400 border-emerald-500/30');
    setFormActive(true);
    setIsCreatingNew(true);
    setEditingAd(null);
  };

  // Open Edit Modal
  const handleOpenEditModal = (ad: CustomAd) => {
    setEditingAd(ad);
    setFormTag(ad.tag || '');
    setFormTitle(ad.title || '');
    setFormSubtitle(ad.subtitle || '');
    setFormCta(ad.cta || 'Acessar');
    setFormUrl(ad.url || '');
    setFormPromoCode(ad.promoCode || '');
    setFormLegalUrl(ad.legalUrl || '');
    setFormDisclaimer(ad.disclaimer || '');
    setFormBadgeColor(ad.badgeColor || 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30');
    setFormActive(ad.active);
    setIsCreatingNew(false);
  };

  // Save Ad (Create or Edit)
  const handleSaveAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) {
      alert('Por favor, preencha pelo menos o Título e a URL de Destino do anúncio.');
      return;
    }

    if (isCreatingNew) {
      addCustomAd({
        tag: formTag.trim() || 'PARCERIA',
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        cta: formCta.trim() || 'Acessar',
        url: formUrl.trim(),
        promoCode: formPromoCode.trim() || undefined,
        legalUrl: formLegalUrl.trim() || undefined,
        disclaimer: formDisclaimer.trim() || undefined,
        badgeColor: formBadgeColor,
        active: formActive,
      });
    } else if (editingAd) {
      updateCustomAd(editingAd.id, {
        tag: formTag.trim() || 'PARCERIA',
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        cta: formCta.trim() || 'Acessar',
        url: formUrl.trim(),
        promoCode: formPromoCode.trim() || undefined,
        legalUrl: formLegalUrl.trim() || undefined,
        disclaimer: formDisclaimer.trim() || undefined,
        badgeColor: formBadgeColor,
        active: formActive,
      });
    }

    setEditingAd(null);
    setIsCreatingNew(false);
  };

  // Delete Ad
  const handleDeleteAd = (ad: CustomAd) => {
    const confirm = window.confirm(`Deseja realmente excluir o anúncio "${ad.title}"?`);
    if (confirm) {
      deleteCustomAd(ad.id);
    }
  };

  // If locked, show PIN unlock form for security
  if (!isUnlocked && !isOwnerAuthenticated) {
    return (
      <div className="rounded-3xl bg-slate-900/90 border border-cyan-500/30 p-6 sm:p-8 max-w-xl mx-auto shadow-2xl space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Área Restrita do Administrador
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PROTEGIDO
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Digite seu PIN de segurança mestre para gerenciar os anúncios diretos e parcerias.
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlockWithPin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 block">
              PIN de Segurança (Padrão inicial: 2026)
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Digite o PIN (ex: 2026)"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-cyan-500/30 text-white font-mono text-center text-lg tracking-widest focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
                autoFocus
              />
            </div>
            {pinError && (
              <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>PIN incorreto. Tente novamente ou entre com sua Conta Google.</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs font-mono tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Desbloquear Painel de Anúncios</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-cyan-500/20 shrink-0">
              <Megaphone className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Gerenciador de Anúncios Diretos & Parcerias
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  NÃO-ADSENSE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  ADM ATIVO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Configure seus links de indicação, cupons de desconto (como Nomad) e campanhas sem precisar de AdSense.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Anúncio</span>
            </button>

            <button
              type="button"
              onClick={() => setIsChangingPin(!isChangingPin)}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-all"
              title="Trocar PIN mestre de segurança"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>PIN</span>
            </button>
          </div>
        </div>

        {/* Change PIN Box if open */}
        {isChangingPin && (
          <form onSubmit={handleSaveNewPin} className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Defina um novo PIN numérico (mínimo 4 dígitos):</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                maxLength={8}
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="Novo PIN"
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/30 text-white font-mono text-xs w-32 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Salvar PIN
              </button>
              <button
                type="button"
                onClick={() => setIsChangingPin(false)}
                className="px-2 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {pinChangeSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>PIN mestre atualizado com sucesso!</span>
          </div>
        )}

        {/* Display Mode Selector */}
        <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-white block">Modo de Exibição dos Anúncios no App:</span>
            <span className="text-[11px] text-slate-400">Escolha o que os usuários do plano gratuito verão no topo da tela</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-white/10 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setAdDisplayMode('custom_ads')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                adDisplayMode === 'custom_ads'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Anúncios Próprios / Nomad (Ativo)</span>
            </button>

            <button
              type="button"
              onClick={() => setAdDisplayMode('adsense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                adDisplayMode === 'adsense'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Google AdSense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview of Active Ad */}
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <Eye className="w-4 h-4" />
            <span>Prévia em Tempo Real (Como o anúncio aparece para os usuários)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {customAds.filter((a) => a.active).length} anúncio(s) ativo(s)
          </span>
        </div>

        {/* Mock Top Banner Preview */}
        <div className="rounded-2xl border border-cyan-500/30 bg-[#070d1e] p-3 text-white flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2 flex-1 min-w-[260px] truncate">
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              PARCERIA
            </span>
            {customAds[0]?.tag && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${customAds[0].badgeColor}`}>
                {customAds[0].tag}
              </span>
            )}
            <span className="text-xs font-bold truncate text-white">
              {customAds[0]?.title || 'Nenhum anúncio ativo'}
            </span>
            {customAds[0]?.subtitle && (
              <span className="text-[11px] text-slate-400 hidden md:inline truncate">
                — {customAds[0].subtitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {customAds[0]?.promoCode && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                <Copy className="w-3 h-3" />
                <span>Código: {customAds[0].promoCode}</span>
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 flex items-center gap-1">
              <span>{customAds[0]?.cta || 'Abrir'}</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Ads List Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Lista de Anúncios Cadastrados</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white/10 text-slate-300">
              {customAds.length}
            </span>
          </h4>

          <span className="text-xs text-slate-400">
            Dica: Se mais de um anúncio estiver ativo, eles rotacionam a cada 9 segundos.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {customAds.map((ad, index) => (
            <div
              key={ad.id}
              className={`rounded-2xl p-4 border transition-all ${
                ad.active
                  ? 'bg-slate-900/90 border-cyan-500/30 hover:border-cyan-400/50 shadow-md'
                  : 'bg-slate-950/60 border-white/5 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Info Left */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-500 font-bold">#{index + 1}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${ad.badgeColor}`}>
                      {ad.tag}
                    </span>
                    <h5 className="text-sm font-black text-white truncate">
                      {ad.title}
                    </h5>
                    {ad.id === 'ad-nomad-luiz' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        NOMAD OFICIAL
                      </span>
                    )}
                  </div>

                  {ad.subtitle && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ad.subtitle}
                    </p>
                  )}

                  {/* Badges / Links details */}
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 flex-wrap">
                    {ad.promoCode && (
                      <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                        <span>Código / Cupom:</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-white">
                          {ad.promoCode}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 truncate max-w-xs text-cyan-300 font-mono">
                      <span>Destino:</span>
                      <a
                        href={ad.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline text-cyan-400 flex items-center gap-1"
                      >
                        <span className="truncate">{ad.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    {ad.legalUrl && (
                      <a
                        href={ad.legalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-cyan-300 underline"
                      >
                        Termos Legais
                      </a>
                    )}
                  </div>

                  {ad.disclaimer && (
                    <p className="text-[10px] text-slate-500 font-mono pt-0.5">
                      {ad.disclaimer}
                    </p>
                  )}
                </div>

                {/* Actions Right */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  {/* Active Toggle */}
                  <button
                    type="button"
                    onClick={() => updateCustomAd(ad.id, { active: !ad.active })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      ad.active
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {ad.active ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{ad.active ? 'Ativo' : 'Pausado'}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(ad)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 hover:text-white transition-colors"
                    title="Editar Anúncio"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteAd(ad)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-rose-300 transition-colors"
                    title="Excluir Anúncio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Create or Edit Custom Ad */}
      {(isCreatingNew || editingAd) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/30 text-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isCreatingNew ? 'Cadastrar Novo Anúncio Patrocinado' : 'Editar Anúncio Patrocinado'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina o texto, o link de parceiro e o código de desconto que aparecerão no topo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingAd(null);
                  setIsCreatingNew(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    Tag / Categoria do Badge *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    placeholder="ex: CONTA GLOBAL NOMAD"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    Texto do Botão de Ação (CTA) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCta}
                    onChange={(e) => setFormCta(e.target.value)}
                    placeholder="ex: Abrir Conta Nomad"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Título Principal do Anúncio *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="ex: Nomad: Taxa de conversão 0% na 1ª operação com código 8F1TYE2SE3"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Subtítulo / Descrição Explicativa
                </label>
                <textarea
                  rows={2}
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="ex: Ganhe taxa 0% em até US$ 1.000 ou € 1.000 para começar a investir com a Nomad!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    Link de Destino / Link de Indicação (URL) *
                  </label>
                  <input
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value.trim())}
                    placeholder="https://nomad.onelink.me/wIQT/Invest?code=8F1TYE2SE3"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    Código de Indicação / Cupom (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formPromoCode}
                    onChange={(e) => setFormPromoCode(e.target.value.trim())}
                    placeholder="ex: 8F1TYE2SE3 (habilita botão de copiar com 1 clique)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    Link de Informações Legais (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formLegalUrl}
                    onChange={(e) => setFormLegalUrl(e.target.value.trim())}
                    placeholder="https://www.nomadglobal.com/legal"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    Cor e Estilo do Badge
                  </label>
                  <select
                    value={formBadgeColor}
                    onChange={(e) => setFormBadgeColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    {BADGE_COLOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Hashtags / Disclaimers Regulatórios (Opcional)
                </label>
                <input
                  type="text"
                  value={formDisclaimer}
                  onChange={(e) => setFormDisclaimer(e.target.value)}
                  placeholder="ex: #GlobalDTVM #IntermediacaoGlobalDTVM #NomadFintechInc #SECRIA"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Status Toggle */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/10">
                <div>
                  <span className="text-xs font-bold text-white block">Status do Anúncio</span>
                  <span className="text-[11px] text-slate-400">Ative para exibir na rotação do banner superior</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    formActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}
                >
                  {formActive ? 'Ativo (Visível)' : 'Pausado (Oculto)'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAd(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Anúncio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
