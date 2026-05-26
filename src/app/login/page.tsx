'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Define the global callback that Telegram Widget calls upon success
    (window as any).onTelegramAuth = async (user: any) => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        
        const data = await res.json();
        if (data.success) {
          // Save basic user profile to LocalStorage and cookies for robust persistence (e.g. inside Telegram webviews)
          localStorage.setItem('pulse_user', JSON.stringify(data.user));
          document.cookie = `pulse_user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=2592000; SameSite=Lax`;
          // Redirect to home or dashboard
          router.push('/');
          alert(`Привет, ${data.user.first_name}! Вы успешно вошли в Pulse ID.`);
        } else {
          setError(data.error || 'Authentication failed');
        }
      } catch (err) {
        setError('Сеть временно недоступна. Повторите попытку позже.');
      } finally {
        setIsLoading(false);
      }
    };

    // Inject Telegram Widget Script inside the container
    if (widgetContainerRef.current) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      // Configure specific Bot Username from environment/known const
      script.setAttribute('data-telegram-login', 'BotHelpG_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      
      widgetContainerRef.current.appendChild(script);
    }

    return () => {
      // Cleanup to ensure global callback removal
      delete (window as any).onTelegramAuth;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10 transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] -z-10 transform -translate-x-1/3 translate-y-1/3"></div>

      <Link href="/" className="mb-10 z-10 transition-transform hover:scale-105">
        <span className="text-5xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tighter drop-shadow-sm">PulseMarket</span>
      </Link>

      <div className="glass-card p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/20 max-w-md w-full text-center border border-white/10 relative z-10">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <div className="text-5xl mb-6 bg-blue-500/10 border border-blue-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(59,130,246,0.2)]">🔐</div>
        
        <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Вход в Pulse ID</h1>
        <p className="text-blue-100/70 text-sm mb-10 leading-relaxed font-medium px-4">
          Войдите через Telegram в 1 клик для публикации объявлений и синхронизации избранного.
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-400 text-xs font-bold p-4 rounded-2xl mb-8 border border-red-500/20 shadow-inner">
            ❌ {error}
          </div>
        )}

        <div className="flex flex-col items-center justify-center min-h-[70px] transition-all bg-white/5 rounded-2xl p-4 border border-white/5">
          {isLoading ? (
            <div className="flex items-center gap-3 text-blue-400 font-bold animate-pulse">
              <div className="w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Безопасная авторизация...
            </div>
          ) : (
            // Telegram Widget Target container
            <div ref={widgetContainerRef} className="transition-all transform hover:scale-105 filter drop-shadow-lg" />
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-[11px] text-blue-100/40 font-medium">
          Нажимая кнопку, вы принимаете политику конфиденциальности PulseMarket.
        </div>
      </div>

      <Link href="/" className="mt-10 text-blue-100/50 font-semibold text-sm hover:text-blue-400 transition-colors z-10 flex items-center gap-2">
        <span className="text-lg">←</span> Вернуться на главную
      </Link>
    </div>
  );
}
