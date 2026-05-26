'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = [
  'Недвижимость',
  'Транспорт',
  'Работа',
  'Услуги',
  'Электроника',
  'Мебель',
  'Одежда',
  'Новости',
  'Разное',
  '❌ УДАЛИТЬ'
];

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Command Center...</div>}>
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const [listings, setListings] = useState<any[]>([]);
  const [restrictedUsernames, setRestrictedUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [auth, setAuth] = useState(false);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showViewed, setShowViewed] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Load viewed IDs from localStorage
    const saved = localStorage.getItem('pm_admin_viewed');
    if (saved) setViewedIds(JSON.parse(saved));

    const pw = searchParams.get('pw');
    if (pw === 'pulsemarket2026') {
      setAuth(true);
      fetchListings();
      fetchRestricted();
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem('pm_admin_viewed', JSON.stringify(viewedIds));
  }, [viewedIds]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/listings?limit=10000');
      const data = await res.json();
      setListings(data.listings || data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchRestricted = async () => {
    try {
      const res = await fetch('/api/admin/restrict');
      const data = await res.json();
      if (data.success && data.usernames) {
        setRestrictedUsernames(data.usernames);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRestrictUsername = async (username: string) => {
    if (!username) return;
    const clean = username.replace('@', '').trim().toLowerCase();
    const isRestricted = restrictedUsernames.includes(clean);
    
    try {
      if (isRestricted) {
        const res = await fetch(`/api/admin/restrict?username=${clean}`, { method: 'DELETE' });
        if (res.ok) {
          setRestrictedUsernames(prev => prev.filter(u => u !== clean));
        }
      } else {
        const res = await fetch('/api/admin/restrict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: clean })
        });
        if (res.ok) {
          setRestrictedUsernames(prev => [...prev, clean]);
        }
      }
    } catch (err) {
      alert('Failed to toggle restrict status');
    }
  };

  const markViewed = (id: string) => {
    if (!viewedIds.includes(id)) {
      setViewedIds(prev => [...prev, id]);
    }
  };

  const clearViewed = () => {
    if (confirm('Очистить историю просмотров?')) {
      setViewedIds([]);
      localStorage.removeItem('pm_admin_viewed');
    }
  };

  const updateCategory = async (id: string, newCategory: string) => {
    if (newCategory === '❌ УДАЛИТЬ') {
      await deleteListing(id);
      return;
    }
    try {
      const res = await fetch('/api/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, category: newCategory })
      });
      if (res.ok) {
        setListings(prev => prev.map(l => l.id === id ? { ...l, category: newCategory } : l));
        // Update modal state if open
        if (selectedListing?.id === id) {
          setSelectedListing((prev: any) => ({ ...prev, category: newCategory }));
        }
        // Auto-hide after successful category change too
        markViewed(id);
      }
    } catch (err) {
      alert('Failed to update');
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/listings?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setListings(prev => prev.filter(l => l.id !== id));
        setSelectedListing(null);
      }
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleSpamAction = async (listing: any) => {
    if (!confirm('Отправить в СПАМ? Это удалит объявление и навсегда заблокирует автора.')) return;
    
    if (listing.username) {
      const clean = listing.username.replace('@', '').trim();
      if (!restrictedUsernames.includes(clean.toLowerCase())) {
        try {
          await fetch('/api/admin/restrict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: clean })
          });
          setRestrictedUsernames(prev => [...prev, clean.toLowerCase()]);
        } catch (e) {}
      }
    }
    await deleteListing(listing.id);
  };

  const triggerCleanup = async () => {
    if (!confirm('Запустить генеральную уборку? \n\nЭто автоматически: \n1. Удалит все дубликаты объявлений \n2. Очистит старые объявления (>9 дней) \n3. Перепроверит категории всех объявлений.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clean');
      const data = await res.json();
      alert(`Уборка завершена!\n\nПросканировано: ${data.scanned}\nУдалено дублей: ${data.deleted_duplicates}\nУдалено старых: ${data.deleted_old}\n\nСписок обновлен.`);
      fetchListings();
    } catch (err) {
      alert('Ошибка при уборке');
      setLoading(false);
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center shadow-2xl">
          <h1 className="text-3xl font-bold mb-4 text-cyan-400">PulseMarket Admin</h1>
          <p className="text-slate-400 mb-6">Access restricted. Please use the correct administrative link.</p>
          <div className="text-xs text-slate-500 italic">Hint: add ?pw=... to the URL</div>
        </div>
      </div>
    );
  }

  // Filter logic: category AND viewed status
  const baseList = filter === 'All' ? listings : listings.filter(l => l.category === filter);
  const filtered = showViewed ? baseList : baseList.filter(l => !viewedIds.includes(l.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              COMMAND CENTER
            </h1>
            <p className="text-slate-500 text-sm mt-1">PulseMarket Cloud Management</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowViewed(!showViewed)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${showViewed ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {showViewed ? '👁️ Показать новые' : '✅ Показать скрытые'}
            </button>
            <button 
              onClick={clearViewed}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white"
            >
              🗑️ Очистить просмотренные
            </button>
            <button 
              onClick={triggerCleanup}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95"
            >
              🧹 УДАЛИТЬ ДУБЛИ И ОЧИСТИТЬ
            </button>
          </div>
        </header>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setFilter('All')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === 'All' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            All ({listings.filter(l => showViewed || !viewedIds.includes(l.id)).length})
          </button>
          {CATEGORIES.filter(c => c !== '❌ УДАЛИТЬ').map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === cat ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {cat} ({listings.filter(l => l.category === cat && (showViewed || !viewedIds.includes(l.id))).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(l => (
              <div 
                key={l.id} 
                className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-slate-700 transition-colors group"
              >
                <div 
                  className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700 cursor-pointer hover:border-cyan-500 transition-all"
                  onClick={() => setSelectedListing(l)}
                >
                  <img src={(!l.image_url || l.image_url === 'None' || l.image_url === 'null' || l.image_url === 'undefined' || l.image_url === '[]') ? '/promo_banner.webp' : l.image_url} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="w-full md:w-48 flex-shrink-0 flex flex-col gap-2">
                  <select 
                    value={l.category}
                    onChange={(e) => updateCategory(l.id, e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer font-bold"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>

                  {l.username ? (
                    <button
                      onClick={() => toggleRestrictUsername(l.username)}
                      className={`w-full py-1 rounded-lg text-xs font-bold transition-all text-center border ${
                        restrictedUsernames.includes(l.username.toLowerCase())
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700/50 hover:bg-slate-700 hover:text-slate-300'
                      }`}
                      title={restrictedUsernames.includes(l.username.toLowerCase()) ? 'Пользователь ограничен (публикации только за 99 звёзд)' : 'Сделать публикации пользователя платными'}
                    >
                      {restrictedUsernames.includes(l.username.toLowerCase()) ? '💎 Платный (99⭐)' : '💎 Сделать платным'}
                    </button>
                  ) : (
                    <div className="text-[10px] text-slate-600 italic text-center">Без юзернейма</div>
                  )}
                </div>
                
                <div className="flex-grow min-w-0 cursor-pointer" onClick={() => setSelectedListing(l)}>
                  <h3 className="font-bold text-white truncate text-lg group-hover:text-cyan-400 transition-colors">{l.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-400">
                    <span className="text-cyan-400 font-mono">{l.price} {l.currency}</span>
                    <span>📍 {l.location}</span>
                    {l.source && <span className="text-purple-400">🌐 {l.source}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => setSelectedListing(l)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-cyan-500 hover:bg-cyan-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
                  >
                    Обзор
                  </button>

                  <button 
                    onClick={() => markViewed(l.id)}
                    className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-green-400"
                    title="Hide as Viewed"
                  >
                    ✔️
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-20 text-slate-600 italic bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                <div className="text-4xl mb-4">✨</div>
                No unmoderated listings here! Check other categories or show viewed history.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL VIEW */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-800/50">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedListing.title}</h2>
                <div className="text-cyan-400 font-bold mt-1">
                  {selectedListing.price} {selectedListing.currency} • {selectedListing.location}
                  {selectedListing.source && <span className="text-purple-400 ml-3">🌐 Источник: {selectedListing.source}</span>}
                </div>
              </div>
              <button 
                onClick={() => {
                  markViewed(selectedListing.id);
                  setSelectedListing(null);
                }}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-all text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <img src={(!selectedListing.image_url || selectedListing.image_url === 'None' || selectedListing.image_url === 'null' || selectedListing.image_url === 'undefined' || selectedListing.image_url === '[]') ? '/promo_banner.webp' : selectedListing.image_url} alt="" className="w-full rounded-2xl border border-slate-800 shadow-lg" />
                <div className="mt-6 flex gap-3">
                  <a 
                    href={`/listing/${selectedListing.id}`} 
                    target="_blank" 
                    className="flex-grow py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-center font-bold rounded-xl transition-all"
                  >
                    🔗 Открыть на сайте
                  </a>
                  <button 
                    onClick={() => deleteListing(selectedListing.id)}
                    className="px-6 py-3 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/50 rounded-xl transition-all font-bold"
                  >
                    🗑️ Удалить
                  </button>
                  <button 
                    onClick={() => handleSpamAction(selectedListing)}
                    className="px-6 py-3 bg-orange-900/50 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-800/50 rounded-xl transition-all font-bold flex flex-col items-center justify-center leading-none"
                  >
                    <span className="text-sm">☢️ СПАМ</span>
                  </button>
                </div>
              </div>
              
              <div className="md:w-1/2 flex flex-col">
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 flex-grow">
                  <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Description / Text</h4>
                  <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedListing.description || selectedListing.raw_text || "No description provided."}
                  </p>
                </div>
                
                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col gap-4">
                  <div>
                    <label className="text-slate-500 text-xs font-bold uppercase block mb-2">Change Category</label>
                    <div className="flex gap-2">
                      <select 
                        value={selectedListing.category}
                        onChange={(e) => updateCategory(selectedListing.id, e.target.value)}
                        className="flex-grow bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm"
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <button 
                        onClick={() => {
                          markViewed(selectedListing.id);
                          setSelectedListing(null);
                        }}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all text-sm"
                      >
                        Ок & Скрыть
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3">
                    <label className="text-slate-500 text-xs font-bold uppercase block mb-2">Режим публикаций автора</label>
                    {selectedListing.username ? (
                      <button
                        onClick={() => toggleRestrictUsername(selectedListing.username)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all text-center border ${
                          restrictedUsernames.includes(selectedListing.username.toLowerCase())
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                        }`}
                      >
                        {restrictedUsernames.includes(selectedListing.username.toLowerCase()) ? '💎 Автор ограничен (99⭐)' : '💎 Сделать автора платным'}
                      </button>
                    ) : (
                      <div className="text-xs text-slate-600 italic">Автор без юзернейма в Telegram</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
