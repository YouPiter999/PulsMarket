import { notFound } from "next/navigation";
import { getFirestoreDb } from "@/lib/firebaseAdmin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const revalidate = 300; // Revalidate articles every 5 minutes

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const db = getFirestoreDb();
  const doc = await db.collection("articles").doc(slug).get();
  
  if (!doc.exists) return null;
  
  const data = doc.data()!;
  return {
    title: data.title,
    content: data.content,
    coverImage: data.coverImage || "",
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
    author: data.author
  };
}

export async function generateMetadata({ params }: PageProps) {
  const p = await params;
  const article = await getArticle(p.slug);
  if (!article) return { title: "Статья не найдена" };
  
  return {
    title: article.title,
    description: article.content.substring(0, 150) + "...",
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const p = await params;
  const article = await getArticle(p.slug);
  
  if (!article) {
    notFound();
  }

  // Удаляем H1 заголовок из самого текста (если ИИ его сгенерировал), 
  // так как мы выводим его отдельно сверху
  let markdownContent = article.content;
  if (markdownContent.startsWith("# ")) {
    const firstNewline = markdownContent.indexOf("\n");
    if (firstNewline !== -1) {
      markdownContent = markdownContent.substring(firstNewline).trim();
    }
  }

  // Удаляем обложку из тела статьи в формате Markdown, чтобы она не дублировалась
  if (article.coverImage) {
    const escapedUrl = article.coverImage.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const imgRegex = new RegExp(`!\\[.*?\\]\\(${escapedUrl}\\)`, 'i');
    markdownContent = markdownContent.replace(imgRegex, '').trim();
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex flex-col font-sans text-slate-100 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.15),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.12),transparent_40%)] pointer-events-none z-0" />

      <header className="sticky top-0 z-50 bg-[#0a0f1c]/70 backdrop-blur-md border-b border-white/10 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            PulseMarket
          </Link>
          <Link href="/blog" className="text-sm font-bold text-slate-300 hover:text-purple-400 transition-colors">
            Все статьи
          </Link>
        </div>
      </header>

      <main className="flex-grow pt-12 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full relative z-10">
        <div className="mb-8">
          <Link href="/blog" className="inline-flex items-center text-sm font-medium text-slate-300 hover:text-purple-400 transition-colors bg-[#121b2e]/60 px-4 py-2 rounded-xl shadow-sm border border-white/5 backdrop-blur-sm">
            <span className="mr-2">←</span> Вернуться в блог
          </Link>
        </div>

        <article className="bg-[#121b2e]/30 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-6 sm:p-10 lg:p-12">
            <header className="mb-10 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="inline-flex items-center rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400 uppercase tracking-wider border border-purple-500/20">
                  Статья
                </span>
                <span className="text-sm text-slate-400 font-medium">
                  {format(new Date(article.createdAt), "d MMMM yyyy", { locale: ru })}
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-6 tracking-tight">
                {article.title}
              </h1>
              
              <div className="flex items-center justify-center gap-3 border-t border-b border-white/5 py-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  AI
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-200">{article.author}</p>
                  <p className="text-xs font-medium text-slate-400">Редакция PulseMarket</p>
                </div>
              </div>
            </header>

            {article.coverImage && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl mb-10 border border-white/5 shadow-md">
                <img 
                  src={article.coverImage} 
                  alt={article.title} 
                  className="absolute inset-0 w-full h-full object-cover object-center" 
                />
              </div>
            )}

            <div className="prose prose-slate prose-invert prose-lg max-w-none prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight prose-a:text-purple-400 prose-a:font-semibold hover:prose-a:text-purple-300 prose-p:text-slate-300 prose-strong:text-white prose-blockquote:text-purple-300 prose-blockquote:border-purple-500 prose-ol:text-slate-300 prose-ul:text-slate-300">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ src, alt }) => (
                    <span className="block my-8 max-w-full overflow-hidden rounded-2xl border border-white/5 shadow-md bg-slate-950/40">
                      <img 
                        src={src} 
                        alt={alt} 
                        className="w-full h-auto max-h-[520px] object-contain object-center mx-auto" 
                      />
                    </span>
                  )
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          </div>
          
          <div className="bg-[#121b2e]/60 p-6 sm:p-10 border-t border-white/5 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Нашли эту статью полезной?</h3>
            <p className="text-slate-300 mb-6 font-medium">
              Поделитесь ею с друзьями или перейдите в наш Telegram-бот, чтобы подать собственное объявление!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="https://t.me/BotHelpG_bot" target="_blank" rel="noopener noreferrer" className="inline-flex justify-center items-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:from-indigo-500 hover:to-purple-500 transition-all active:scale-95 border border-purple-500/30">
                Перейти в Бот 🤖
              </a>
              <Link href="/" className="inline-flex justify-center items-center rounded-xl bg-[#121b2e]/30 px-6 py-3 text-sm font-bold text-slate-300 shadow-sm border border-white/5 hover:bg-[#121b2e]/50 transition-all active:scale-95">
                На главную маркетплейса
              </Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
