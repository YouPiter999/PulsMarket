import { Listing } from "../types/listing";
import { MapPin, Clock, MessageCircle, Crown, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard = ({ listing }: ListingCardProps) => {
  const formattedPrice = new Intl.NumberFormat("ru-RU").format(listing.price);
  const timeAgo = new Date(listing.createdAt).toLocaleDateString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border ${
        listing.isPriority ? 'border-yellow-200 ring-1 ring-yellow-100' : 'border-gray-100'
      }`}
    >
      {listing.isPriority && (
        <div className="absolute top-0 right-0 z-20">
          <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm font-bold text-[10px] uppercase tracking-wider">
            <Crown className="w-3 h-3 fill-yellow-900" />
            Priority
          </div>
        </div>
      )}
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={listing.images[0] || "https://placehold.co/600x400?text=No+Photo"}
          alt={listing.title}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-xs font-bold rounded-full shadow-sm">
            {listing.location.countryCode}
          </span>
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
            {listing.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 flex items-center gap-2">
            {listing.price > 0 ? `${formattedPrice} ${listing.currency}` : "Цена договорная"}
            {listing.isOfficial && (
              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />
            )}
          </h3>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
          {listing.title}
        </p>

        <div className="flex flex-col gap-3 pt-4 border-t border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-500 text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {listing.location.city}, {listing.location.region}
            </div>
            <div className="flex items-center text-gray-400 text-[10px]">
              <Clock className="w-3 h-3 mr-1" />
              {timeAgo}
            </div>
          </div>
          
          {listing.seller.telegram && (
            <a
              href={listing.seller.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              Написать в Telegram
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};
