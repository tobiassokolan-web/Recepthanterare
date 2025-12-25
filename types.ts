
export interface Ingredient {
  item: string;
  amount: string;
}

export interface Step {
  order: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  category: 'Frukost' | 'Lunch' | 'Middag' | 'Efterrätt' | 'Mellanmål';
  ingredients: Ingredient[];
  instructions: Step[];
  imageUrl: string;
  isFavorite: boolean;
}

export type TabType = 'library' | 'favorites' | 'generate' | 'search';
