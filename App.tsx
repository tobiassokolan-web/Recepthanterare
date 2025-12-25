
import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, TabType } from './types';
import { BookOpen, Heart, Search, Sparkles, Plus, Sidebar as SidebarIcon, Edit3, Trash2, Check } from 'lucide-react';
import RecipeCard from './components/RecipeCard';
import RecipeDetail from './components/RecipeDetail';
import GenerateRecipe from './components/GenerateRecipe';

const INITIAL_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Krämig Kantarellpasta',
    description: 'En lyxig pasta med färska kantareller, grädde och persilja. Perfekt för höstkvällar.',
    prepTime: '15 min',
    cookTime: '15 min',
    servings: 2,
    category: 'Middag',
    isFavorite: true,
    imageUrl: 'https://picsum.photos/seed/kantarell/800/600',
    ingredients: [
      { item: 'Tagliatelle', amount: '250g' },
      { item: 'Kantareller', amount: '300g' },
      { item: 'Schalottenlök', amount: '2 st' },
      { item: 'Grädde', amount: '2.5 dl' }
    ],
    instructions: [
      { order: 1, instruction: 'Koka pastan enligt anvisningar.' },
      { order: 2, instruction: 'Fräs löken och kantarellerna i smör tills vätskan kokat bort.' },
      { order: 3, instruction: 'Häll på grädde och låt puttra några minuter.' }
    ]
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('smaklig_recipes');
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem('smaklig_recipes', JSON.stringify(recipes));
  }, [recipes]);

  const selectedRecipe = useMemo(() => 
    recipes.find(r => r.id === selectedRecipeId) || null
  , [recipes, selectedRecipeId]);

  const filteredRecipes = useMemo(() => {
    let result = recipes;
    if (activeTab === 'favorites') {
      result = result.filter(r => r.isFavorite);
    }
    if (searchQuery) {
      result = result.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [recipes, activeTab, searchQuery]);

  const toggleFavorite = (id: string) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  };

  const deleteRecipe = (id: string) => {
    if (confirm('Vill du ta bort detta recept?')) {
      setRecipes(prev => prev.filter(r => r.id !== id));
      if (selectedRecipeId === id) setSelectedRecipeId(null);
    }
  };

  const handleAddRecipe = (newRecipe: Recipe) => {
    setRecipes(prev => [newRecipe, ...prev]);
    setSelectedRecipeId(newRecipe.id);
    setActiveTab('library');
    setIsEditing(false);
  };

  const handleUpdateRecipe = (updated: Recipe) => {
    setRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  return (
    <div className="flex h-screen w-full bg-[#F6F6F6] overflow-hidden">
      
      {/* SIDEBAR */}
      {isSidebarOpen && (
        <aside className="w-64 macos-sidebar flex flex-col pt-12 px-4 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Mappar</h2>
          </div>
          <nav className="space-y-1">
            <button 
              onClick={() => { setActiveTab('library'); setSelectedRecipeId(null); setIsEditing(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'library' ? 'bg-[#DCDCDC] text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'library' ? 'text-[#E5A500]' : 'text-gray-400'}`} />
              Alla Recept
            </button>
            <button 
              onClick={() => { setActiveTab('favorites'); setSelectedRecipeId(null); setIsEditing(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'favorites' ? 'bg-[#DCDCDC] text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'text-[#E5A500]' : 'text-gray-400'}`} />
              Favoriter
            </button>
            <button 
              onClick={() => { setActiveTab('generate'); setSelectedRecipeId(null); setIsEditing(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'generate' ? 'bg-[#DCDCDC] text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === 'generate' ? 'text-[#E5A500]' : 'text-gray-400'}`} />
              AI Lab
            </button>
          </nav>
        </aside>
      )}

      {/* LIST VIEW */}
      <section className="w-80 macos-list flex flex-col">
        <header className="h-12 flex items-center px-4 border-b border-gray-200 gap-2">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
            <SidebarIcon className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Sök..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 py-1 pl-7 pr-3 rounded text-xs focus:ring-1 focus:ring-[#E5A500]"
            />
          </div>
          <button 
            onClick={() => { setActiveTab('generate'); setSelectedRecipeId(null); setIsEditing(false); }}
            className="p-1.5 hover:bg-gray-100 rounded text-[#E5A500]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map(recipe => (
              <RecipeCard 
                key={recipe.id}
                recipe={recipe}
                isSelected={selectedRecipeId === recipe.id}
                onClick={() => { setSelectedRecipeId(recipe.id); setActiveTab('library'); setIsEditing(false); }}
              />
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm">Inga recept hittades.</div>
          )}
        </div>
      </section>

      {/* CONTENT VIEW */}
      <main className="flex-1 macos-content flex flex-col relative overflow-hidden">
        {activeTab === 'generate' ? (
          <div className="flex-1 overflow-y-auto">
            <GenerateRecipe onRecipeGenerated={handleAddRecipe} />
          </div>
        ) : selectedRecipe ? (
          <>
            <header className="h-12 border-b border-gray-200 flex items-center justify-end px-4 gap-2">
              <button 
                onClick={() => toggleFavorite(selectedRecipe.id)} 
                className={`p-1.5 hover:bg-gray-100 rounded ${selectedRecipe.isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                title="Favorit"
              >
                <Heart className={`w-4 h-4 ${selectedRecipe.isFavorite ? 'fill-current' : ''}`} />
              </button>
              
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className={`p-1.5 rounded transition-colors ${isEditing ? 'bg-[#FFE59E] text-[#E5A500]' : 'text-gray-400 hover:bg-gray-100'}`}
                title={isEditing ? "Klar" : "Redigera"}
              >
                {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>

              <div className="w-px h-4 bg-gray-200 mx-1"></div>

              <button 
                onClick={() => deleteRecipe(selectedRecipe.id)} 
                className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"
                title="Ta bort"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-12">
              <RecipeDetail 
                recipe={selectedRecipe} 
                isEditing={isEditing}
                onUpdate={handleUpdateRecipe}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300">
            <BookOpen className="w-24 h-24 opacity-10" />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
