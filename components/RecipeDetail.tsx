
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Recipe, Ingredient, Step } from '../types';
import { Clock, Users, Eye, EyeOff, Plus, Trash2, ChevronDown, Minus, LayoutList, Focus, Bold, Italic } from 'lucide-react';

interface EditableFieldProps {
  html: string;
  onUpdate: (val: string) => void;
  fieldKey: string;
  className: string;
  placeholder?: string;
  isEditing: boolean;
  focusedFieldRef: React.MutableRefObject<string | null>;
  activeEditorRef: React.MutableRefObject<HTMLDivElement | null>;
}

// IMPORTANT: This component MUST be outside the main RecipeDetail component
// to prevent it from unmounting and losing state/focus during re-renders.
const EditableField: React.FC<EditableFieldProps> = ({ 
  html, 
  onUpdate, 
  fieldKey, 
  className, 
  placeholder,
  isEditing,
  focusedFieldRef,
  activeEditorRef
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initial load and external updates
  useEffect(() => {
    if (editorRef.current && focusedFieldRef.current !== fieldKey) {
      // Only update DOM if it's different to avoid cursor jumps
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
  }, [html, fieldKey, focusedFieldRef]);

  return (
    <div 
      ref={editorRef}
      className={`${className} outline-none instruction-body`}
      contentEditable={isEditing}
      suppressContentEditableWarning
      data-key={fieldKey}
      onInput={(e) => {
        focusedFieldRef.current = fieldKey;
        onUpdate(e.currentTarget.innerHTML);
      }}
      onFocus={(e) => {
        focusedFieldRef.current = fieldKey;
        activeEditorRef.current = e.currentTarget;
      }}
      onBlur={() => {
        focusedFieldRef.current = null;
      }}
      placeholder={placeholder}
    />
  );
};

interface RecipeDetailProps {
  recipe: Recipe;
  isEditing: boolean;
  onUpdate: (recipe: Recipe) => void;
}

type UnitSystem = 'metric' | 'imperial';

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, isEditing, onUpdate }) => {
  const [showAmountsInSteps, setShowAmountsInSteps] = useState(false);
  const [currentServings, setCurrentServings] = useState(recipe.servings);
  const [hideIngredients, setHideIngredients] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  
  const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null);
  const activeEditorRef = useRef<HTMLDivElement | null>(null);
  const focusedFieldRef = useRef<string | null>(null);

  const scaleFactor = useMemo(() => {
    if (!recipe.servings || recipe.servings === 0) return 1;
    return currentServings / recipe.servings;
  }, [currentServings, recipe.servings]);

  const convertValue = (num: number, unit: string): { num: number; unit: string } => {
    if (unitSystem === 'metric') return { num, unit };
    const u = unit.toLowerCase().trim();
    if (u === 'g') return { num: num * 0.035274, unit: 'oz' };
    if (u === 'kg') return { num: num * 2.20462, unit: 'lb' };
    if (u === 'ml') return { num: num * 0.033814, unit: 'fl oz' };
    if (u === 'dl') return { num: num * 0.422675, unit: 'cups' };
    if (u === 'l') return { num: num * 4.22675, unit: 'cups' };
    return { num, unit };
  };

  const scaleAmount = (amountStr: string) => {
    if (isEditing) return amountStr;
    const match = amountStr.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
    if (!match) return amountStr;
    let num = parseFloat(match[1].replace(',', '.'));
    let unit = match[2];
    if (isNaN(num)) return amountStr;
    num = num * scaleFactor;
    const converted = convertValue(num, unit);
    num = converted.num;
    unit = converted.unit;
    const formattedNum = Number.isInteger(num) ? num : num.toFixed(1).replace(/\.0$/, '');
    return `${formattedNum}${unit ? ' ' + unit : ''}`;
  };

  const handleChange = (field: keyof Recipe, value: any) => {
    onUpdate({ ...recipe, [field]: value });
    if (field === 'servings') {
      setCurrentServings(value);
    }
  };

  const adjustServings = (delta: number) => {
    setCurrentServings(prev => Math.max(1, prev + delta));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    handleChange('ingredients', newIngredients);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...recipe.instructions];
    newSteps[index] = { ...newSteps[index], instruction: value };
    onUpdate({ ...recipe, instructions: newSteps });
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      if (!isEditing) {
        setMenuPos(null);
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setMenuPos(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (rect.width > 0) {
        let node: Node | null = selection.anchorNode;
        let isInsideEditable = false;
        while (node) {
          if (node instanceof HTMLElement && node.hasAttribute('contenteditable')) {
            isInsideEditable = true;
            break;
          }
          node = node.parentNode;
        }

        if (isInsideEditable) {
          setMenuPos({
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY - 65
          });
        } else {
          setMenuPos(null);
        }
      } else {
        setMenuPos(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [isEditing]);

  const execCommand = (command: string) => {
    document.execCommand(command, false);
    if (activeEditorRef.current) {
      const html = activeEditorRef.current.innerHTML;
      const key = activeEditorRef.current.dataset.key;
      if (key === 'description') {
        handleChange('description', html);
      } else if (key?.startsWith('step-')) {
        const idx = parseInt(key.split('-')[1]);
        updateStep(idx, html);
      }
    }
  };

  const addIngredient = () => handleChange('ingredients', [...recipe.ingredients, { item: '', amount: '' }]);
  const removeIngredient = (index: number) => handleChange('ingredients', recipe.ingredients.filter((_, i) => i !== index));
  const addStep = () => {
    const newSteps = [...recipe.instructions, { order: recipe.instructions.length + 1, instruction: '' }];
    handleChange('instructions', newSteps);
  };
  const removeStep = (index: number) => {
    const newSteps = recipe.instructions.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i + 1 }));
    handleChange('instructions', newSteps);
  };

  const renderInstructionContent = (html: string) => {
    let processedText = html;
    const replacements: Record<string, string> = {};
    const searchTerms = recipe.ingredients.flatMap((ing, index) => {
      if (!ing.item || ing.item.length < 2) return [];
      const parts = ing.item.split(' ').filter(p => p.length > 2);
      const terms = [ing.item]; 
      if (parts.length > 1) terms.push(parts[parts.length - 1]); 
      return terms.map(term => ({ term: term.toLowerCase(), originalIng: ing, index }));
    });

    const sortedTerms = searchTerms.sort((a, b) => b.term.length - a.term.length);
    const usedRanges: [number, number][] = [];

    sortedTerms.forEach(({ term, originalIng, index }) => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(\\b${escapedTerm}(?:en|et|na|arna|erna|a|s|ans|ens)?\\b)`, 'gi');
      
      let match;
      while ((match = regex.exec(processedText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        const textBefore = processedText.substring(0, start);
        const isInTag = (textBefore.match(/</g) || []).length > (textBefore.match(/>/g) || []).length;
        const isOverlap = usedRanges.some(([uStart, uEnd]) => (start >= uStart && start < uEnd) || (end > uStart && end <= uEnd));

        if (!isOverlap && !isInTag) {
          const placeholder = `__ING_${index}_${Math.random().toString(36).substr(2, 5)}__`;
          const amountDisplay = showAmountsInSteps 
            ? ` <span class="amount-tag">(${scaleAmount(originalIng.amount)})</span>` 
            : '';
          // Using <b> tag here to leverage the global CSS rule for gold/yellow color
          replacements[placeholder] = `<b>${match[0]}</b>${amountDisplay}`;
          processedText = processedText.substring(0, start) + placeholder + processedText.substring(end);
          usedRanges.push([start, start + placeholder.length]);
          regex.lastIndex = 0; 
        }
      }
    });

    Object.entries(replacements).forEach(([placeholder, replacement]) => {
      processedText = processedText.split(placeholder).join(replacement);
    });

    return processedText;
  };

  const categories: Recipe['category'][] = ['Frukost', 'Lunch', 'Middag', 'Efterrätt', 'Mellanmål'];

  return (
    <div className="max-w-5xl mx-auto pb-32">
      {/* Floating IOS Menu */}
      {isEditing && menuPos && (
        <div 
          className="fixed z-[9999] bg-[#1A1A1A] text-white shadow-2xl rounded-2xl px-1.5 py-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          style={{ 
            left: `${menuPos.x}px`, 
            top: `${menuPos.y}px`, 
            transform: 'translateX(-50%)' 
          }}
        >
          <button 
            onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
            className="px-4 py-2 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2"
          >
            <Bold className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Fet</span>
          </button>
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          <button 
            onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
            className="px-4 py-2 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2"
          >
            <Italic className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Kursiv</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start gap-8 mb-12 pb-8 border-b border-gray-100">
        <div className="w-full md:w-48 h-48 flex-shrink-0 rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 w-full">
          {isEditing ? (
            <div className="relative inline-block mb-2">
              <select 
                value={recipe.category}
                onChange={e => handleChange('category', e.target.value)}
                className="appearance-none bg-[#FFE59E] px-4 py-1.5 rounded-full text-[10px] font-black text-[#E5A500] uppercase tracking-widest outline-none pr-10"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-4 top-1/2 -translate-y-1/2 text-[#E5A500] pointer-events-none" />
            </div>
          ) : (
            <span className="text-[10px] font-black text-[#E5A500] uppercase tracking-[0.2em] mb-2 block">
              {recipe.category}
            </span>
          )}

          {isEditing ? (
            <input 
              type="text" 
              value={recipe.title}
              onChange={e => handleChange('title', e.target.value)}
              className="w-full text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4 bg-transparent outline-none border-none p-0 focus:ring-0"
              placeholder="Namnge receptet..."
            />
          ) : (
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              {recipe.title}
            </h1>
          )}

          <EditableField 
            html={recipe.description}
            onUpdate={(val) => handleChange('description', val)}
            fieldKey="description"
            className={`text-gray-500 italic leading-relaxed text-sm mb-6 outline-none min-h-[1.5em] ${isEditing ? 'cursor-text' : ''}`}
            placeholder="Beskriv receptet..."
            isEditing={isEditing}
            focusedFieldRef={focusedFieldRef}
            activeEditorRef={activeEditorRef}
          />
          
          <div className="flex flex-wrap gap-8 text-[11px] font-black text-gray-400 uppercase tracking-widest items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E5A500]" />
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input className="w-20 bg-transparent outline-none text-gray-900 font-bold border-none p-0 focus:ring-0" value={recipe.prepTime} onChange={e => handleChange('prepTime', e.target.value)} placeholder="0 min" />
                  <span className="text-gray-200">+</span>
                  <input className="w-20 bg-transparent outline-none text-gray-900 font-bold border-none p-0 focus:ring-0" value={recipe.cookTime} onChange={e => handleChange('cookTime', e.target.value)} placeholder="0 min" />
                </div>
              ) : (
                <span>{recipe.prepTime} + {recipe.cookTime}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E5A500]" />
              {isEditing ? (
                <input type="number" className="w-12 bg-transparent outline-none text-gray-900 font-bold border-none p-0 focus:ring-0" value={recipe.servings} onChange={e => handleChange('servings', parseInt(e.target.value) || 1)} />
              ) : (
                <div className="flex items-center bg-gray-100 rounded-full px-4 py-1.5 gap-4 shadow-sm">
                   <button onClick={() => adjustServings(-1)} className="hover:text-gray-900 transition-colors"><Minus className="w-3 h-3" /></button>
                   <span className="min-w-[40px] text-center text-gray-900 font-bold">{currentServings} port</span>
                   <button onClick={() => adjustServings(1)} className="hover:text-gray-900 transition-colors"><Plus className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {!isEditing && (
        <div className="flex flex-wrap items-center gap-4 mb-10 py-4 border-y border-gray-100">
          <button 
            onClick={() => setHideIngredients(!hideIngredients)}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all ${hideIngredients ? 'bg-[#FFE59E] text-[#E5A500]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutList className="w-4 h-4" />
            {hideIngredients ? 'Visa allt' : 'Endast instruktioner'}
          </button>
          
          <button 
            onClick={() => { setFocusMode(!focusMode); setActiveStepIndex(focusMode ? null : 0); }}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all ${focusMode ? 'bg-[#FFE59E] text-[#E5A500]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Focus className="w-4 h-4" />
            {focusMode ? 'Normalt läge' : 'Starta matlagning'}
          </button>

          <div className="flex-1"></div>

          <div className="bg-gray-100 p-1 rounded-full flex gap-1 shadow-inner">
            <button 
              onClick={() => setUnitSystem('metric')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${unitSystem === 'metric' ? 'bg-white text-[#E5A500] shadow-sm' : 'text-gray-400'}`}
            >
              Metric
            </button>
            <button 
              onClick={() => setUnitSystem('imperial')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${unitSystem === 'imperial' ? 'bg-white text-[#E5A500] shadow-sm' : 'text-gray-400'}`}
            >
              Imperial
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`grid grid-cols-1 ${hideIngredients ? 'md:grid-cols-1' : 'md:grid-cols-12'} gap-16 items-start`}>
        {!hideIngredients && (
          <section className="md:col-span-5 lg:col-span-4 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1.5 bg-[#E5A500] rounded-full"></div>
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Ingredienser</h2>
              </div>
              {isEditing && (
                <button onClick={addIngredient} className="text-[#E5A500] p-2 hover:bg-yellow-50 rounded-full transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
            <ul className="space-y-6">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start gap-4 text-[15px]">
                  {isEditing ? (
                    <div className="flex-1 flex gap-4 items-center group">
                      <button onClick={() => removeIngredient(idx)} className="text-red-400 p-1.5 hover:bg-red-50 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      <input 
                        className="w-20 font-bold text-[#E5A500] text-right bg-transparent outline-none border-none p-0 focus:ring-0" 
                        value={ing.amount} 
                        onChange={e => updateIngredient(idx, 'amount', e.target.value)} 
                        placeholder="Mängd"
                      />
                      <input 
                        className="flex-1 text-gray-700 bg-transparent outline-none border-none p-0 focus:ring-0" 
                        value={ing.item} 
                        onChange={e => updateIngredient(idx, 'item', e.target.value)} 
                        placeholder="Ingrediens"
                      />
                    </div>
                  ) : (
                    <>
                      <span className="w-24 flex-shrink-0 font-bold text-[#E5A500] text-right">{scaleAmount(ing.amount)}</span>
                      <span className="text-gray-700 leading-snug flex-1">{ing.item}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={`${hideIngredients ? 'md:col-span-1' : 'md:col-span-7 lg:col-span-8'} space-y-8`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 bg-[#E5A500] rounded-full"></div>
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Gör så här</h2>
            </div>
            <div className="flex items-center gap-8">
              {!isEditing && (
                <button 
                  onClick={() => setShowAmountsInSteps(!showAmountsInSteps)}
                  className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"
                >
                  {showAmountsInSteps ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showAmountsInSteps ? 'Dölj mått' : 'Visa mått'}
                </button>
              )}
              {isEditing && (
                <button onClick={addStep} className="text-[#E5A500] p-2 hover:bg-yellow-50 rounded-full transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-10">
            {recipe.instructions.map((step, idx) => {
              const currentKey = `step-${idx}`;
              return (
                <div 
                  key={idx} 
                  onClick={() => !isEditing && focusMode && setActiveStepIndex(idx)}
                  className={`flex gap-8 transition-all duration-300 p-6 rounded-[2rem] relative ${
                    focusMode && activeStepIndex === idx 
                      ? 'bg-white ring-4 ring-[#FFE59E] z-10 shadow-xl' 
                      : focusMode ? 'opacity-30 grayscale' : ''
                  } ${isEditing ? 'bg-white border border-gray-100' : ''}`}
                >
                  <span className="text-2xl font-black text-[#E5A500] leading-none select-none min-w-[50px] pt-1">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex gap-4 items-start w-full group">
                        <EditableField 
                          html={step.instruction}
                          onUpdate={(val) => updateStep(idx, val)}
                          fieldKey={currentKey}
                          className="flex-1 text-[17px] text-gray-700 leading-relaxed outline-none min-h-[2em] cursor-text"
                          placeholder="Beskriv steget..."
                          isEditing={isEditing}
                          focusedFieldRef={focusedFieldRef}
                          activeEditorRef={activeEditorRef}
                        />
                        <button onClick={() => removeStep(idx)} className="text-red-400 p-2 hover:bg-red-50 rounded-xl opacity-40 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <div className="text-[17px] text-gray-700 leading-relaxed pt-1 instruction-body" dangerouslySetInnerHTML={{ __html: renderInstructionContent(step.instruction) }} />
                        {focusMode && activeStepIndex === idx && (
                          <div className="mt-8 flex gap-4">
                             {idx > 0 && (
                               <button onClick={(e) => { e.stopPropagation(); setActiveStepIndex(idx - 1); }} className="text-[10px] font-black text-gray-400 uppercase px-6 py-2.5 rounded-full border border-gray-100 bg-white shadow-sm">Föregående</button>
                             )}
                             {idx < recipe.instructions.length - 1 && (
                               <button onClick={(e) => { e.stopPropagation(); setActiveStepIndex(idx + 1); }} className="text-[10px] font-black text-[#E5A500] bg-[#FFE59E] uppercase px-8 py-2.5 rounded-full shadow-sm">Nästa steg</button>
                             )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RecipeDetail;
