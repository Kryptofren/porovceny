
import React from 'react';

interface StoreBadgeProps {
  name: string;
}

const StoreBadge: React.FC<StoreBadgeProps> = ({ name }) => {
  const colors: Record<string, string> = {
    'tesco': 'bg-blue-600',
    'lidl': 'bg-blue-800',
    'kaufland': 'bg-red-600',
    'jednota': 'bg-red-700',
    'billa': 'bg-yellow-400 text-black',
    'coop': 'bg-red-700',
  };

  const lowerName = name.toLowerCase();
  const matchedKey = Object.keys(colors).find(key => lowerName.includes(key));
  const bgColor = matchedKey ? colors[matchedKey] : 'bg-slate-500';

  return (
    <span className={`${bgColor} text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider`}>
      {name}
    </span>
  );
};

export default StoreBadge;
