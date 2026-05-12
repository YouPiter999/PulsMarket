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

  useEffect(() => {
    const loadProfile = async () => {
      const stored = localStorage.getItem('pulse_user');
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
         const allListings = await res.json();
         // Match either user ID or telegram username derived names
         const userKey = targetUser.username ? targetUser.username.toLowerCase() : '';
         
         const filtered = allListings.filter((item: any) => {
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

            {/* Deals (Placeholder for next sprint) */}
            <div className="p-8 flex items-center gap-5 group transition-all duration-300 hover:bg-white opacity-75">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-orange-500/20 transform group-hover:scale-110 transition-transform">
                🤝
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-0.5">Сделки</p>
                <p className="text-2xl font-black text-gray-900">0</p>
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
               <button className="relative z-10 w-full bg-white text-indigo-700 text-xs font-black py-3 rounded-xl shadow-lg hover:bg-gray-100 transition-all active:scale-95 cursor-not-allowed opacity-90 flex items-center justify-center gap-2">
                 🚀 Открыть верификатор
               </button>
             </div>

             <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg group-hover:bg-blue-50 transition-colors">⚙️</div>
                   <span className="text-sm font-bold text-gray-700">Настройки</span>
                </div>
                <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
             </div>

             <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg group-hover:bg-blue-50 transition-colors">❓</div>
                   <span className="text-sm font-bold text-gray-700">Поддержка</span>
                </div>
                <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
