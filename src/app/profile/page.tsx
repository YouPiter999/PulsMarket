'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'VERIFY' | 'SETTINGS' | 'SUPPORT' | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      let stored = localStorage.getItem('pulse_user');
      if (!stored) {
        const match = document.cookie.match(/(^| )pulse_user=([^;]+)/);
        if (match) {
          try {
            stored = decodeURIComponent(match[2]);
            localStorage.setItem('pulse_user', stored);
          } catch (e) {}
        }
      }
      
      if (!stored) {
        router.push('/login');
        return;
      }
      
      try {
        const cachedUser = JSON.parse(stored);
        setUser(cachedUser); // Optimistic show from cache
        
        // Immediately trigger loading their listings
        loadListings(cachedUser);

        // Fetch fresh data from DB
        const res = await fetch(`/api/users/${cachedUser.telegram_id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
            localStorage.setItem('pulse_user', JSON.stringify(data.user));
            document.cookie = `pulse_user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=2592000; SameSite=Lax`;
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const loadListings = async (targetUser: any) => {
       setListingsLoading(true);
       try {
         const res = await fetch('/api/listings');
         const data = await res.json();
         const listingsArray = Array.isArray(data) ? data : (data.listings || []);
         // Match either user ID or telegram username derived names
         const userKey = targetUser.username ? targetUser.username.toLowerCase() : '';
         
         const filtered = listingsArray.filter((item: any) => {
            const itemUser = (item.username || '').toLowerCase();
            return itemUser.includes(userKey) || itemUser === String(targetUser.telegram_id);
         });
         
         setMyListings(filtered);
       } catch (e) {
         console.error("Fail list:", e);
       } finally {
         setListingsLoading(false);
       }
    };

    loadProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('pulse_user');
    document.cookie = "pulse_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/');
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faff]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const trustScore = user?.trust_score ?? 50;
  const verifiedLevel = user?.verified_level ?? 0;
  const role = user?.role || 'expat';

  return (
    <div className="min-h-screen bg-[#f5f7fb] font-sans text-gray-900 selection:bg-blue-100">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200/80 sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter">PulseMarket</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors bg-gray-100 hover:bg-red-50 px-4 py-2 rounded-full"
          >
            Выйти
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-900/5 border border-white/20 overflow-hidden mb-8 relative">
          
          {/* Banner Accent */}
          <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 relative">
            {/* Profile Ring over banner */}
            <div className="absolute -bottom-16 left-8 sm:left-12">
              <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-xl overflow-hidden bg-gray-100 relative bg-white">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-indigo-300 bg-indigo-50">
                    {user?.first_name?.charAt(0) || '?'}
                  </div>
                )}
                {/* Online green dot */}
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Basic Info Info */}
          <div className="pt-20 pb-8 px-8 sm:px-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2">
                  {user?.first_name} {user?.last_name}
                  {verifiedLevel > 0 && (
                    <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                  )}
                </h1>
                <p className="text-gray-500 font-medium">@{user?.username || 'PulseUser'}</p>
                
                {/* Live Seller Star Rating in Profile */}
                {user?.rating_avg > 0 && (
                  <div className="flex items-center gap-1 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 w-fit">
                    <span className="text-amber-500 text-xs">★</span>
                    <span className="text-gray-800 font-black text-xs tracking-tight">{user.rating_avg.toFixed(1)}</span>
                    <span className="text-gray-400 font-bold text-[10px] tracking-tight ml-0.5">({user.rating_count} {user.rating_count === 1 ? 'отзыв' : [2,3,4].includes(user.rating_count % 10) && ![12,13,14].includes(user.rating_count % 100) ? 'отзыва' : 'отзывов'})</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-100">
                  🌍 {role === 'expat' ? 'Экспат' : role === 'local' ? 'Местный' : 'Бизнес'}
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border border-indigo-100">
                  🆔 Pulse ID: {user?.telegram_id}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-gray-100 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 bg-gray-50/50">
            
            {/* Trust Score stat */}
            <div className="p-8 flex items-center gap-5 group transition-all duration-300 hover:bg-white">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20 transform group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-0.5">Trust Score</p>
                <p className="text-2xl font-black text-gray-900">{trustScore}</p>
              </div>
            </div>

            {/* Verified Level stat */}
            <div className="p-8 flex items-center gap-5 group transition-all duration-300 hover:bg-white">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20 transform group-hover:scale-110 transition-transform">
                ✅
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-0.5">Верификация</p>
                <p className="text-2xl font-black text-gray-900">Lvl {verifiedLevel}</p>
              </div>
            </div>

            {/* 🤝 Live Real-time Deals Record */}
            <div className="p-8 flex items-center gap-5 group transition-all duration-300 hover:bg-white">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-orange-500/20 transform group-hover:scale-110 transition-transform">
                🤝
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-0.5">Сделки</p>
                <p className="text-2xl font-black text-gray-900">{user?.deals_count || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left column: My Listings (Span 2) */}
          <div className="md:col-span-2 space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900">Мои Объявления</h3>
                <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-lg text-xs">
                   {myListings.length} активных
                </span>
             </div>
             
             {listingsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
                   <div className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
                </div>
             ) : myListings.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center">
                   <div className="text-4xl mb-3">📭</div>
                   <h4 className="font-bold text-gray-800 text-lg mb-1">Здесь пока пусто</h4>
                   <p className="text-sm text-gray-500 mb-5">Вы еще не опубликовали ни одного лота через нашего бота.</p>
                   <Link href="/" className="bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-all inline-block">
                      Начать продавать
                   </Link>
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {myListings.map(item => (
                      <Link key={item.id} href={`/listing/${item.id}`} className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                         <div className="aspect-video bg-gray-100 relative">
                            {item.image_url ? (
                               <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🖼️</div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] font-black px-2 py-1 rounded">
                               {item.category}
                            </div>
                         </div>
                         <div className="p-4">
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-blue-600">{item.title}</h4>
                            <p className="text-blue-600 font-black text-lg mt-1">
                               {Number(item.price).toLocaleString()} {item.currency}
                            </p>
                         </div>
                      </Link>
                   ))}
                </div>
             )}
          </div>

          {/* Right Column: Actions / Trust Upgrades */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900">Действия</h3>
             </div>

             <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group">
               {/* Decorative Glow Circles */}
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl transform group-hover:scale-150 transition-transform duration-700"></div>
               
               <div className="relative z-10 flex justify-between items-start mb-4">
                 <h3 className="font-bold text-lg leading-tight">Повысить <br/>Trust Score</h3>
                 <span className="bg-yellow-400 text-gray-900 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border shadow-sm">
                   СКОРО
                 </span>
               </div>
               <p className="relative z-10 text-xs text-indigo-100 mb-5 leading-relaxed opacity-90">Пройдите расширенную верификацию и получите премиум-бейдж, который увеличивает доверие покупателей на 80%.</p>
               <button 
                  onClick={() => setActiveModal('VERIFY')}
                  className="relative z-10 w-full bg-white text-indigo-700 text-xs font-black py-3 rounded-xl shadow-lg hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-2 hover:shadow-white/20 cursor-pointer"
                >
                  🚀 Открыть верификатор
                </button>
              </div>

              <div 
                onClick={() => setActiveModal('SETTINGS')}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors cursor-pointer hover:-translate-y-0.5 transition-all duration-200"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg group-hover:bg-blue-50 transition-colors">⚙️</div>
                    <span className="text-sm font-bold text-gray-700">Настройки</span>
                 </div>
                 <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
              </div>

              <div 
                onClick={() => setActiveModal('SUPPORT')}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors cursor-pointer hover:-translate-y-0.5 transition-all duration-200"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg group-hover:bg-blue-50 transition-colors">❓</div>
                    <span className="text-sm font-bold text-gray-700">Поддержка</span>
                 </div>
                 <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
              </div>
          </div>
        </div>
      </main>
      {/* Unified Profile Modal Overlays */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm duration-200 animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-6 sm:p-8 duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>

            {activeModal === 'VERIFY' && (
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-indigo-200 mb-5">
                  🛡️
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Повышение уровня</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  Пройдите верификацию для получения специальной галочки ✅. Это подтвердит подлинность профиля и многократно поднимет доверие клиентов к вашим лотам.
                </p>
                <div className="bg-blue-50 border border-blue-100/50 rounded-2xl p-4 text-left text-xs text-blue-800 mb-6 flex flex-col gap-2 font-medium w-full">
                  <p>• 💳 <b>Шаг 1:</b> Предоставьте паспорт или ID</p>
                  <p>• 📸 <b>Шаг 2:</b> Селфи с паспортом в руках</p>
                  <p>• ✅ <b>Результат:</b> Статус подтверждён!</p>
                </div>
                <a 
                  href="https://t.me/BotHelpG_bot?start=verify" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  ✉️ Написать верификатору в Telegram
                </a>
              </div>
            )}

            {activeModal === 'SETTINGS' && (
              <div className="text-left">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-100 text-slate-700 rounded-xl flex items-center justify-center text-2xl">
                    ⚙️
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Настройки профиля</h3>
                    <p className="text-xs text-slate-500">Синхронизация с Telegram</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Аккаунт на PulseMarket</p>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      👤 {user?.first_name} {user?.last_name} 
                      <span className="text-xs font-semibold text-slate-500">(@{user?.username})</span>
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1">🆔 Telegram ID: {user?.telegram_id}</p>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100/30 p-4 rounded-2xl flex gap-3">
                    <span className="text-xl">💡</span>
                    <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                      Ваши персональные данные (фото, имя, фамилия) автоматически берутся из Telegram. Чтобы их обновить — просто измените их в самом мессенджере!
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                     setLoading(true);
                     setActiveModal(null);
                     setTimeout(() => {
                        window.location.reload();
                     }, 300);
                  }}
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  🔄 Принудительно обновить данные
                </button>
              </div>
            )}

            {activeModal === 'SUPPORT' && (
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-orange-100 mb-5">
                  ❓
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Связаться с поддержкой</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-8">
                  Появились технические сложности, вопросы по оплате или предложения по развитию сайта? Наша команда с радостью ответит вам в Telegram!
                </p>
                <a 
                  href="https://t.me/BotHelpG_bot?start=support" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  💬 Написать в поддержку PulseMarket
                </a>
                <p className="text-[10px] text-slate-400 font-bold mt-4 tracking-wide uppercase">
                  Среднее время ответа: ~5 минут ⚡
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
