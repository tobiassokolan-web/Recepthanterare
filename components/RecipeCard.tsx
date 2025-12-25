
import React from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  isSelected: boolean;
  onClick: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, isSelected, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`px-5 py-3 cursor-pointer transition-colors ${isSelected ? 'note-item-selected' : 'hover:bg-gray-50'}`}
    >
      <div className="flex justify-between items-baseline mb-0.5">
        <h3 className={`text-sm font-bold truncate pr-4 ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
          {recipe.title}
        </h3>
        <span className="text-[10px] text-gray-400 flex-shrink-0 uppercase font-bold tracking-tighter">
          {recipe.category}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400 font-medium">{recipe.prepTime}</span>
        <p className={`text-[11px] truncate flex-1 ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>
          {recipe.ingredients.slice(0, 3).map(i => i.item).join(', ')}...
        </p>
      </div>
    </div>
  );
};

export default RecipeCard;
