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
          // Save basic user profile to LocalStorage for basic persistence without robust cookie management
          localStorage.setItem('pulse_user', JSON.stringify(data.user));
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
    <div className="min-h-screen bg-[#f2f4f7] flex flex-col items-center justify-center px-4 font-sans">
      <Link href="/" className="mb-8">
        <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter">PulseMarket</span>
      </Link>

      <div className="bg-white p-10 rounded-[2rem] shadow-2xl shadow-indigo-500/5 max-w-md w-full text-center border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600"></div>
        
        <div className="text-5xl mb-6 bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto animate-bounce-slow">🔐</div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-2">Вход в Pulse ID</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Используйте ваш профиль Telegram для мгновенного доступа, создания репутации и управления объявлениями.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl mb-6 border border-red-100">
            ❌ {error}
          </div>
        )}

        <div className="flex flex-col items-center justify-center min-h-[60px] transition-all">
          {isLoading ? (
            <div className="flex items-center gap-3 text-blue-600 font-bold animate-pulse">
              <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Авторизация...
            </div>
          ) : (
            // Telegram Widget Target container
            <div ref={widgetContainerRef} className="transition-all transform hover:scale-105" />
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 text-xs text-gray-400">
          Нажимая кнопку выше, вы соглашаетесь с правилами PulseMarket.
        </div>
      </div>

      <Link href="/" className="mt-8 text-gray-500 font-semibold text-sm hover:text-blue-600 transition-colors">
        ← Вернуться на сайт
      </Link>
    </div>
  );
}
