"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
// Client component, renders static shell on server

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  createdAt: string;
  author: string;
  views: number;
  region?: string;
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/blog");
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch (err) {
        console.error("Error fetching articles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex flex-col font-sans text-slate-100 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.15),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.12),transparent_40%)] pointer-events-none z-0" />

      <header className="sticky top-0 z-50 bg-[#0a0f1c]/70 backdrop-blur-md border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            PulseMarket
          </Link>
          <Link href="/" className="text-sm font-bold text-slate-300 hover:text-purple-400 transition-colors">
            На главную
          </Link>
        </div>
      </header>

      <main className="flex-grow pt-12 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white tracking-tight sm:text-5xl">
            Блог <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">PulseMarket</span>
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto font-medium">
            Полезные статьи, гайды по недвижимости, жизни на Кипре и обзоры рынка.
          </p>
          
          <div className="mt-8 flex justify-center gap-2 sm:gap-4 overflow-x-auto pb-2 no-scrollbar">
            <Link href="/blog" className="px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-purple-500/30 whitespace-nowrap">
              Все статьи
            </Link>
            <Link href="/blog/south-cyprus" className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#121b2e]/60 text-slate-300 hover:bg-[#121b2e] border border-white/5 transition-all duration-300 whitespace-nowrap hover:border-purple-500/20">
              Южный Кипр
            </Link>
            <Link href="/blog/north-cyprus" className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#121b2e]/60 text-slate-300 hover:bg-[#121b2e] border border-white/5 transition-all duration-300 whitespace-nowrap hover:border-purple-500/20">
              Северный Кипр (ТРСК)
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-[#121b2e]/40 rounded-3xl border border-white/5 backdrop-blur-md">
            <span className="text-6xl mb-4 block">📝</span>
            <h3 className="text-xl font-bold text-white">Статей пока нет</h3>
            <p className="text-slate-400 mt-2">Первая статья появится совсем скоро!</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.id} href={`/blog/${article.slug}`} className="group flex flex-col bg-[#121b2e]/30 rounded-3xl hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-300 border border-white/5 hover:border-purple-500/30 overflow-hidden hover:-translate-y-1">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900/60">
                  {article.coverImage && article.coverImage.trim() !== "" ? (
                    <>
                      <img src={article.coverImage} alt={article.title} className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c]/90 via-[#0a0f1c]/10 to-transparent opacity-60" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-purple-950 opacity-90 group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 flex items-center justify-center text-white/10">
                        <span className="text-5xl font-black uppercase transform -rotate-12">PulseMarket</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex flex-col flex-grow p-6 sm:p-8 relative">
                  <div className="flex items-center gap-3 mb-4">
                    {(() => {
                      const region = article.region || "general";
                      let label = "Общий";
                      let badgeClass = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
                      
                      if (region === "north-cyprus") {
                         label = "Северный Кипр";
                         badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                      } else if (region === "south-cyprus") {
                         label = "Южный Кипр";
                         badgeClass = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                      }
                      
                      return (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeClass}`}>
                          {label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-slate-400 font-medium">
                      {format(new Date(article.createdAt), "d MMMM yyyy", { locale: ru })}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-3">
                    {article.title}
                  </h3>
                  
                  <p className="text-slate-400 text-sm flex-grow line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                  
                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        AI
                      </div>
                      <span className="text-sm font-medium text-slate-300">{article.author}</span>
                    </div>
                    <div className="flex items-center text-slate-400 text-sm font-medium group-hover:text-purple-400 transition-colors">
                      Читать →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
