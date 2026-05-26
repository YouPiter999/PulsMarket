import { motion } from "framer-motion";
import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";

export const PromoBanner = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="max-w-7xl mx-auto px-0 mt-8 mb-12"
    >
      <Link 
        href="https://t.me/BotHelpG_bot?start=alerts"
        target="_blank"
        rel="noopener noreferrer"
        className="group block w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white p-6 md:p-8 rounded-[2rem] shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
      >
        {/* Background Decorative Circles */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/30 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-left">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/20">
              <Bell className="w-8 h-8 text-white animate-pulse group-hover:animate-none" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl md:text-2xl font-black tracking-tight">
                  Перехватывайте лучшие товары первыми
                </h3>
                <span className="bg-yellow-400 text-blue-950 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest animate-bounce group-hover:animate-none shadow-sm">
                  VIP-РАДАР
                </span>
              </div>
              <p className="text-blue-100 text-sm md:text-base font-medium max-w-2xl leading-relaxed opacity-90">
                Устали видеть «Уже продано»? Пока остальные часами листают ленту, вы получаете уведомление в ту же секунду, как нужная вещь появилась в продаже. Настройте фильтры под себя и забирайте эксклюзив раньше всех.
              </p>
            </div>
          </div>

          <div className="shrink-0 bg-white text-blue-700 px-8 py-4 rounded-2xl font-black text-base group-hover:bg-blue-50 transition-all shadow-xl flex items-center gap-3 group-hover:scale-105 active:scale-95">
            Включить за 99 ⭐
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={3} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
