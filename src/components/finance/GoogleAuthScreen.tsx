import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LogIn,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  User as UserIcon,
  Mail,
  KeyRound,
  AlertCircle,
  ExternalLink,
  Laptop,
} from 'lucide-react';

export default function GoogleAuthScreen() {
  const { user, loading, loginWithGoogle, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setErrorMessage(res.error || 'Não foi possível completar o login com o Google.');
      } else {
        setSuccessMessage('Login realizado com sucesso. Os dados financeiros são verificados separadamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao conectar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      await logout();
      setSuccessMessage('Você saiu da sua conta.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao deslogar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 border border-cyan-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>AUTENTICAÇÃO OFICIAL GOOGLE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Acesso & Sincronização Google
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Conecte sua conta do Google com segurança via Firebase Authentication para identificação e proteção dos seus dados na nuvem.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3 shadow-inner">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Aviso de Conexão</span>
            <p className="text-rose-300/80">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Sucesso</span>
            <p className="text-emerald-300/80">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Card Principal: Logado ou Não Logado */}
      {loading ? (
        <div className="cyber-card rounded-3xl p-12 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Verificando status da sessão Google...</p>
        </div>
      ) : user ? (
        /* Estado: Usuário CONECTADO */
        <div className="cyber-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuário'}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl border-2 border-cyan-400/60 object-cover shadow-lg shadow-cyan-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-xl">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {user.displayName || 'Usuário Google'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CONECTADO
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Desconectar Conta</span>
            </button>
          </div>

          {/* Dados da Sessão Segura */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">ID do Usuário</span>
              <p className="text-xs font-mono text-cyan-300 truncate" title={user.uid}>
                {user.uid}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Provedor</span>
              <p className="text-xs font-mono text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                google.com (OAuth 2.0)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">E-mail Verificado</span>
              <p className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {user.emailVerified ? 'Confirmado pelo Google' : 'Pendente'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-xs text-cyan-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Sua conta está autenticada com sucesso! Seus dados e metas contam com proteção por token Google.</span>
            </div>
          </div>
        </div>
      ) : (
        /* Estado: NÃO LOGADO */
        <div className="cyber-card rounded-3xl p-6 sm:p-10 text-center space-y-8">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Entre com sua Conta Google
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clique no botão oficial abaixo para abrir a janela do Google, selecionar sua conta e autenticar no aplicativo.
            </p>
          </div>

          {/* Botão Oficial Google */}
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl shadow-cyan-500/15 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 border border-slate-200 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isSubmitting ? 'Conectando ao Google...' : 'Continuar com o Google'}</span>
            </button>

            <span className="text-[11px] font-mono text-slate-500">
              Conexão 100% oficial via Google Identity / Firebase
            </span>
          </div>

          {/* Vantagens */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-white/5">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sem Senhas Decoradas</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Acesse o app com 1 clique usando sua conta do Gmail ou Google Workspace.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Segurança Bancária</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Protocolo OAuth 2.0 com criptografia TLS de ponta a ponta.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Laptop className="w-4 h-4" />
                <span>Multiplataforma</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Acesse o aplicativo pelo celular, tablet ou computador mantendo sua sessão.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
