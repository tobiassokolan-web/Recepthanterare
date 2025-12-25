
import React, { useState } from 'react';
import { generateRecipe, importRecipeFromTextOrUrl } from '../services/geminiService';
import { Recipe } from '../types';
import { Sparkles, Loader2, Wand2, ClipboardType, ClipboardPaste, Link as LinkIcon, Globe } from 'lucide-react';

interface GenerateRecipeProps {
  onRecipeGenerated: (recipe: Recipe) => void;
}

type Mode = 'create' | 'import';

const GenerateRecipe: React.FC<GenerateRecipeProps> = ({ onRecipeGenerated }) => {
  const [mode, setMode] = useState<Mode>('create');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isUrl = prompt.trim().toLowerCase().startsWith('http');

  const handleAction = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      const newRecipe = mode === 'create' 
        ? await generateRecipe(prompt)
        : await importRecipeFromTextOrUrl(prompt);
      
      onRecipeGenerated(newRecipe as Recipe);
      setPrompt('');
    } catch (err: any) {
      setError(err.message || 'Det gick inte att bearbeta receptet.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPrompt(text);
    } catch (err) {
      setError('Kunde inte läsa från urklipp.');
    }
  };

  const suggestions = [
    "Krämig pasta med citron och sparris",
    "Snabb vegetarisk tacos för vardagen",
    "Gammaldags äppelkaka med vaniljsås"
  ];

  return (
    <div className="max-w-2xl mx-auto py-20 px-6">
      <div className="flex flex-col items-center mb-16">
        <div className="w-20 h-20 bg-[#E5A500] rounded-[2rem] flex items-center justify-center mb-10 transform rotate-3 transition-transform hover:rotate-0">
          {mode === 'create' ? (
            <Sparkles className="w-10 h-10 text-white" />
          ) : (
            isUrl ? <LinkIcon className="w-10 h-10 text-white" /> : <ClipboardType className="w-10 h-10 text-white" />
          )}
        </div>
        
        <div className="bg-gray-100 p-1 rounded-2xl flex mb-10 w-64 border border-gray-200">
          <button 
            onClick={() => { setMode('create'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === 'create' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Skapa ny
          </button>
          <button 
            onClick={() => { setMode('import'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === 'import' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Importera
          </button>
        </div>

        <h2 className="text-3xl font-black text-gray-900 tracking-tight">AI Lab</h2>
        <p className="text-gray-400 mt-4 text-sm text-center max-w-sm leading-relaxed">
          {mode === 'create' 
            ? 'Beskriv en rätt eller en ingredienslista så skapar AI:n receptet.' 
            : 'Klistra in en länk till en sajt eller råtext från ett gammalt anteckningsblock.'}
        </p>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 relative mb-10 transition-all hover:border-[#FFE59E]">
        {mode === 'import' && isUrl && (
          <div className="absolute top-6 right-10 flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Globe className="w-3.5 h-3.5" />
            Länk detekterad
          </div>
        )}
        
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={mode === 'create' 
            ? "En kryddig linsgryta med kokosmjölk..." 
            : "Klistra in URL (t.ex. köket.se) eller recepttext här..."}
          className="w-full h-56 bg-transparent resize-none text-xl text-gray-800 placeholder-gray-200 leading-relaxed outline-none"
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-8 border-t border-gray-50 gap-4">
          <div className="flex gap-6">
            {mode === 'import' && (
              <button onClick={handlePaste} className="flex items-center gap-2 text-[#E5A500] text-xs font-bold hover:opacity-70 transition-opacity">
                <ClipboardPaste className="w-4 h-4" /> Klistra in
              </button>
            )}
            {prompt.trim() && (
              <button onClick={() => setPrompt('')} className="text-gray-300 text-xs font-bold hover:text-red-400 transition-colors">
                Rensa
              </button>
            )}
          </div>
          
          <button 
            disabled={loading || !prompt.trim()}
            onClick={handleAction}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-full font-black text-sm transition-all ${
              loading || !prompt.trim() 
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                : 'bg-[#E5A500] text-white active:scale-95'
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              mode === 'import' && isUrl ? <LinkIcon className="w-5 h-5" /> : <Wand2 className="w-5 h-5" />
            )}
            {loading ? 'Bearbetar...' : (mode === 'import' && isUrl ? 'Hämta Recept' : 'Kör AI')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 mb-10 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 animate-in shake-2">
          {error}
        </div>
      )}

      {mode === 'create' && !prompt.trim() && (
        <div className="flex flex-wrap justify-center gap-3 animate-in fade-in duration-700">
          {suggestions.map((s, i) => (
            <button 
              key={i} 
              onClick={() => setPrompt(s)}
              className="px-5 py-2.5 bg-gray-50 text-gray-400 text-[11px] font-bold rounded-full border border-gray-100 hover:border-[#E5A500] hover:text-[#E5A500] hover:bg-white transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenerateRecipe;
