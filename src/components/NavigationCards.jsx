import React from 'react';
import { Upload, BookOpen, MessageSquare, TrendingUp, Search, ChevronRight } from 'lucide-react';

export default function NavigationCards({ navigateTo }) {
  const cards = [
    {
      title: 'Search Similar Papers',
      icon: <Search size={24} />,
      description: 'Find research papers by entering keywords',
      color: 'bg-blue-500',
      action: () => navigateTo('searchSimilar'),
    },
    {
      title: 'Previous Uploads',
      icon: <BookOpen size={24} />,
      description: 'View and manage your previously uploaded papers',
      color: 'bg-green-500',
      action: () => navigateTo('previous'),
    },
    {
      title: 'Q&A',
      icon: <MessageSquare size={24} />,
      description: 'Ask questions about your research papers',
      color: 'bg-purple-500',
      action: () => navigateTo('qa'),
    },
    {
      title: 'Trending Papers',
      icon: <TrendingUp size={24} />,
      description: 'Discover trending research papers',
      color: 'bg-orange-500',
      action: () => navigateTo('trending'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          onClick={card.action}
          className="bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg cursor-pointer flex flex-col"
        >
          <div className={`${card.color} text-white p-3 rounded-full self-start mb-4`}>
            {card.icon}
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">{card.title}</h3>
          <p className="text-gray-600 text-sm mb-4 flex-grow">{card.description}</p>
          <div className="flex justify-end">
            <ChevronRight className="text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
}
