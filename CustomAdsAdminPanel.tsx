import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X,
  Radio,
  UserCheck,
  Cloud,
  CreditCard,
  Webhook,
  RefreshCw,
  Save,
  Check,
  Copy,
} from 'lucide-react';
import { useSettings, CustomAd, AdDisplayMode } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

export default function CustomAdsAdminPanel() {
  const { user, isAdmin, loginWithGoogle } = useAuth();
  const {
    customAds,
    adDisplayMode,
    addCustomAd,
    updateCustomAd,
    deleteCustomAd,
    setAdDisplayMode,
    kiwifyMonthlyUrl,
    kiwifyAnnualUrl,
    checkoutUrl,
    pixKey,
    pixName,
    googleAdSenseClientId,
    googleAdSenseSlotId,
    affiliateCustomUrl,
    updateCommercialSettings,
    refreshCommercialFromCloud,
    isCloudSynced,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<'ads' | 'commercial' | 'webhook'>('ads');

  // Edit / Create Modal State
  const [editingAd, setEditingAd] = useState<CustomAd | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State for Custom Ad
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
  const [isSavingAd, setIsSavingAd] = useState(false);

  // Form State for Global Commercial Settings
  const [commMonthlyUrl, setCommMonthlyUrl] = useState(kiwifyMonthlyUrl);
  const [commAnnualUrl, setCommAnnualUrl] = useState(kiwifyAnnualUrl);
  const [commCheckoutUrl, setCommCheckoutUrl] = useState(checkoutUrl);
  const [commPixKey, setCommPixKey] = useState(pixKey);
  const [commPixName, setCommPixName] = useState(pixName);
  const [commAdSenseId, setCommAdSenseId] = useState(googleAdSenseClientId);
  const [commAdSenseSlot, setCommAdSenseSlot] = useState(googleAdSenseSlotId);
  const [commAffiliateUrl, setCommAffiliateUrl] = useState(affiliateCustomUrl);
  const [commSaveSuccess, setCommSaveSuccess] = useState(false);
  const [isSavingComm, setIsSavingComm] = useState(false);

  // Webhook Test State
  const [webhookSimEmail, setWebhookSimEmail] = useState(user?.email || 'cliente@exemplo.com');
  const [webhookSimPlan, setWebhookSimPlan] = useState<'monthly' | 'annual'>('monthly');
  const [webhookSimStatus, setWebhookSimStatus] = useState<{ success?: boolean; message: string } | null>(null);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

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
      label: 'Âmbar Dourado (Cripto / Finanças)',
      value: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      label: 'Azul Institucional (Bancos / Cartões)',
      value: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
  ];

  const handleOpenCreateModal = () => {
    setFormTag('PARCERIA');
    setFormTitle('');
    setFormSubtitle('');
    setFormCta('Conhecer');
    setFormUrl('https://');
    setFormPromoCode('');
    setFormLegalUrl('');
    setFormDisclaimer('');
    setFormBadgeColor(BADGE_COLOR_OPTIONS[0].value);
    setFormActive(true);
    setEditingAd(null);
    setIsCreatingNew(true);
  };

  const handleOpenEditModal = (ad: CustomAd) => {
    setEditingAd(ad);
    setFormTag(ad.tag);
    setFormTitle(ad.title);
    setFormSubtitle(ad.subtitle);
    setFormCta(ad.cta);
    setFormUrl(ad.url);
    setFormPromoCode(ad.promoCode || '');
    setFormLegalUrl(ad.legalUrl || '');
    setFormDisclaimer(ad.disclaimer || '');
    setFormBadgeColor(ad.badgeColor || BADGE_COLOR_OPTIONS[0].value);
    setFormActive(ad.active);
    setIsCreatingNew(false);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) return;

    setIsSavingAd(true);
    try {
      if (editingAd) {
        await updateCustomAd(editingAd.id, {
          tag: formTag.trim() || 'PARCERIA',
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          cta: formCta.trim() || 'Conhecer',
          url: formUrl.trim(),
          promoCode: formPromoCode.trim() || undefined,
          legalUrl: formLegalUrl.trim() || undefined,
          disclaimer: formDisclaimer.trim() || undefined,
          badgeColor: formBadgeColor,
          active: formActive,
        });
      } else {
        await addCustomAd({
          tag: formTag.trim() || 'PARCERIA',
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          cta: formCta.trim() || 'Conhecer',
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
    } finally {
      setIsSavingAd(false);
    }
  };

  const handleSaveCommercial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingComm(true);
    try {
      const ok = await updateCommercialSettings({
        kiwifyMonthlyUrl: commMonthlyUrl.trim(),
        kiwifyAnnualUrl: commAnnualUrl.trim(),
        checkoutUrl: commCheckoutUrl.trim(),
        pixKey: commPixKey.trim(),
        pixName: commPixName.trim(),
        googleAdSenseClientId: commAdSenseId.trim(),
        googleAdSenseSlotId: commAdSenseSlot.trim(),
        affiliateCustomUrl: commAffiliateUrl.trim(),
      });
      if (ok) {
        setCommSaveSuccess(true);
        setTimeout(() => setCommSaveSuccess(false), 3500);
      }
    } finally {
      setIsSavingComm(false);
    }
  };

  const handleSimulateWebhook = async () => {
    setIsSimulatingWebhook(true);
    setWebhookSimStatus(null);
    try {
      if (!user) {
        throw new Error('Faça login como administrador antes de executar a simulação.');
      }

      const idToken = await user.getIdToken();
      const res = await fetch('/api/webhooks/kiwify/test-simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: webhookSimEmail.trim(),
          plan: webhookSimPlan,
        }),
      });
      const data = await res.json();
      setWebhookSimStatus(data);
    } catch (e: any) {
      setWebhookSimStatus({
        success: false,
        message: `Falha ao testar webhook: ${e.message || 'Servidor indisponível'}`,
      });
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const webhookPublicUrl = `${window.location.origin}/api/webhooks/kiwify`;

  // Autenticação Estrita via Firebase Auth (Removido qualquer fallback inseguro)
  if (!isAdmin) {
    return (
      <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 sm:p-8 max-w-xl mx-auto shadow-2xl space-y-5 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-base font-bold text-white">Área Restrita aos Administradores</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              AUTORIZAÇÃO FIREBASE
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Este painel gerencia anúncios globais, configurações comerciais na nuvem (Firestore) e webhooks de pagamento. O acesso é exclusivo para a conta Google de administrador autorizada.
          </p>
        </div>

        {user ? (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Conta conectada: {user.email}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Esta conta Google não possui privilégios de administrador do Jornada da Meta.
            </p>
            <button
              onClick={() => loginWithGoogle()}
              className="mt-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all w-full flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Alternar para Conta de Administrador</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <button
              onClick={() => loginWithGoogle()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs font-mono tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Entrar com Google (Conta Administrador)</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Banner com Status da Nuvem Firestore */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-500/30 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-cyan-500/20 shrink-0">
              <Megaphone className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Painel Administrativo &amp; Monetização Global
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  FIRESTORE GLOBAL
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  ADM: {user?.email}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Todas as alterações feitas aqui são gravadas no Firestore e propagadas imediatamente para todos os usuários do aplicativo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={refreshCommercialFromCloud}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              title="Recarregar dados do Firestore"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar</span>
            </button>
            {activeTab === 'ads' && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Novo Anúncio</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('ads')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ads'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Anúncios &amp; Parcerias ({customAds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('commercial')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'commercial'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Configurações Comerciais &amp; Kiwify</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Webhook Kiwify &amp; Automação PRO</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ANÚNCIOS & PARCERIAS FIRESTORE */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          {/* Display Mode Selector */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400" />
                Modo de Exibição Global de Publicidade
              </span>
              <p className="text-[11px] text-slate-400">
                Selecione qual sistema de anúncios é exibido para usuários da versão gratuita
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10">
              <button
                type="button"
                onClick={() => setAdDisplayMode('custom_ads')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  adDisplayMode === 'custom_ads'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Anúncios Próprios
              </button>
              <button
                type="button"
                onClick={() => setAdDisplayMode('adsense')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  adDisplayMode === 'adsense'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google AdSense
              </button>
              <button
                type="button"
                onClick={() => setAdDisplayMode('mixed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  adDisplayMode === 'mixed'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Híbrido (Misto)
              </button>
            </div>
          </div>

          {/* Ads List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {customAds.map((ad) => (
              <div
                key={ad.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative ${
                  ad.active
                    ? 'bg-slate-900/90 border-cyan-500/30 hover:border-cyan-400/50 shadow-lg'
                    : 'bg-slate-950/60 border-white/5 opacity-60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${ad.badgeColor}`}>
                      {ad.tag}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCustomAd(ad.id, { active: !ad.active })}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                        ad.active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                      title={ad.active ? 'Desativar anúncio' : 'Ativar anúncio'}
                    >
                      {ad.active ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3" />}
                      <span>{ad.active ? 'ATIVO' : 'PAUSADO'}</span>
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">{ad.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ad.subtitle}</p>

                  {ad.promoCode && (
                    <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-500/20 inline-block">
                      Cupom: <strong>{ad.promoCode}</strong>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                  <a
                    href={ad.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] flex items-center gap-1 truncate max-w-[140px]"
                  >
                    <span>{ad.cta}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(ad)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                      title="Editar anúncio"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir o anúncio "${ad.title}" do Firestore?`)) {
                          deleteCustomAd(ad.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                      title="Excluir anúncio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CONFIGURAÇÕES COMERCIAIS & KIWIFY (GRAVADAS EM /config/commercial) */}
      {activeTab === 'commercial' && (
        <form onSubmit={handleSaveCommercial} className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-cyan-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  URLs Comerciais e Checkout (Kiwify)
                </h4>
                <p className="text-xs text-slate-400">
                  Atualize os links oficiais de checkout. Usuários em qualquer aparelho receberão estes links imediatamente.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
                /config/commercial
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">URL Checkout Plano Mensal (Kiwify):</label>
                <input
                  type="url"
                  value={commMonthlyUrl}
                  onChange={(e) => setCommMonthlyUrl(e.target.value)}
                  placeholder="https://pay.kiwify.com.br/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">URL Checkout Plano Anual (Kiwify):</label>
                <input
                  type="url"
                  value={commAnnualUrl}
                  onChange={(e) => setCommAnnualUrl(e.target.value)}
                  placeholder="https://pay.kiwify.com.br/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Chave PIX Oficial:</label>
                <input
                  type="text"
                  value={commPixKey}
                  onChange={(e) => setCommPixKey(e.target.value)}
                  placeholder="Chave PIX (e-mail, CPF, aleatória)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Nome do Titular do PIX:</label>
                <input
                  type="text"
                  value={commPixName}
                  onChange={(e) => setCommPixName(e.target.value)}
                  placeholder="Ex: Luiz Eduardo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Google AdSense Client ID (ca-pub):</label>
                <input
                  type="text"
                  value={commAdSenseId}
                  onChange={(e) => setCommAdSenseId(e.target.value)}
                  placeholder="ca-pub-..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Google AdSense Slot ID:</label>
                <input
                  type="text"
                  value={commAdSenseSlot}
                  onChange={(e) => setCommAdSenseSlot(e.target.value)}
                  placeholder="ID numérico do bloco"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {commSaveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Configurações comerciais salvas e sincronizadas na nuvem Firestore!</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingComm}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingComm ? 'Salvando no Firestore...' : 'Salvar Configurações Comerciais'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: WEBHOOK KIWIFY & AUTOMAÇÃO PRO */}
      {activeTab === 'webhook' && (
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Webhook className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    Integração Automática: Webhook Kiwify → Firestore
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ativação 100% no servidor assim que o cliente paga no PIX ou Cartão
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/40">
                POST /api/webhooks/kiwify
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2 text-xs">
              <span className="text-[11px] font-mono text-purple-300 uppercase block font-bold">
                // URL do Webhook para colar no painel da Kiwify:
              </span>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-mono text-cyan-300 select-all truncate">{webhookPublicUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookPublicUrl);
                    setCopiedWebhookUrl(true);
                    setTimeout(() => setCopiedWebhookUrl(false), 3000);
                  }}
                  className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  {copiedWebhookUrl ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedWebhookUrl ? 'Copiado!' : 'Copiar URL'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                No painel da <strong>Kiwify</strong>, acesse: <em>Apps e Webhooks → Adicionar Webhook</em>, cole a URL acima e selecione os eventos: <strong>Compra aprovada</strong>, <strong>Assinatura renovada</strong>, <strong>Reembolso/chargeback</strong> e <strong>Cancelamento de assinatura</strong>.
              </p>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 leading-relaxed">
                <strong>Segurança obrigatória:</strong> configure no servidor a variável <code className="font-mono">KIWIFY_WEBHOOK_SECRET</code> com o token do webhook gerado pela Kiwify. O segredo nunca deve ser colocado no React ou salvo nas configurações públicas do Firestore.
              </div>
            </div>

            {/* Simulador de Teste do Webhook */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h5 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Simulador de Teste de Pagamento Aprovado
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold block">E-mail do Cliente (Google Login):</label>
                  <input
                    type="email"
                    value={webhookSimEmail}
                    onChange={(e) => setWebhookSimEmail(e.target.value)}
                    placeholder="cliente@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Plano:</label>
                  <select
                    value={webhookSimPlan}
                    onChange={(e) => setWebhookSimPlan(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="monthly">Mensal (30 dias)</option>
                    <option value="annual">Anual (365 dias)</option>
                  </select>
                </div>
              </div>

              {webhookSimStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                    webhookSimStatus.success
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                  }`}
                >
                  {webhookSimStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{webhookSimStatus.message}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isSimulatingWebhook}
                onClick={handleSimulateWebhook}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingWebhook ? 'animate-spin' : ''}`} />
                <span>{isSimulatingWebhook ? 'Enviando Webhook...' : 'Disparar Simulação de Pagamento Aprovado'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL FOR CUSTOM AD */}
      {(isCreatingNew || editingAd) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-cyan-400" />
                <span>{editingAd ? 'Editar Anúncio na Nuvem' : 'Novo Anúncio no Firestore'}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEditingAd(null);
                  setIsCreatingNew(false);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Tag / Parceiro:</label>
                  <input
                    type="text"
                    required
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    placeholder="Ex: CONTA NOMAD"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Botão de Ação (CTA):</label>
                  <input
                    type="text"
                    required
                    value={formCta}
                    onChange={(e) => setFormCta(e.target.value)}
                    placeholder="Ex: Abrir Conta"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Título Principal:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Taxa 0% de conversão na 1ª operação"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-cyan-400 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Subtítulo / Proposta de Valor:</label>
                <textarea
                  rows={2}
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="Explicação do benefício para o usuário..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Link de Destino (Afiliado/Parceiro):</label>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Cupom / Código (Opcional):</label>
                  <input
                    type="text"
                    value={formPromoCode}
                    onChange={(e) => setFormPromoCode(e.target.value)}
                    placeholder="Ex: 8F1TYE2SE3"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Cor do Selo:</label>
                  <select
                    value={formBadgeColor}
                    onChange={(e) => setFormBadgeColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                  >
                    {BADGE_COLOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Aviso Legal / Conformidade (Disclaimer):</label>
                <input
                  type="text"
                  value={formDisclaimer}
                  onChange={(e) => setFormDisclaimer(e.target.value)}
                  placeholder="Ex: #GlobalDTVM #IntermediacaoGlobalDTVM"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formActiveCheck"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-white/20 focus:ring-0"
                />
                <label htmlFor="formActiveCheck" className="text-slate-300 font-semibold cursor-pointer">
                  Anúncio ativo e visível imediatamente para todos os usuários
                </label>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAd(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAd}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingAd ? 'Gravando no Firestore...' : 'Salvar no Firestore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
