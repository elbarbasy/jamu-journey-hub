export type QuizAnswers = Record<string, string>; // questionKey -> tag

export type ProductWithMapping = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  ingredients: string[];
  flavor_tags: string[];
  experience_tags: string[];
  quiz_mapping: Record<string, string[]>;
};

// Score = number of matching tags across all answered dimensions
export function scoreProducts(products: ProductWithMapping[], answers: QuizAnswers) {
  return products
    .map((p) => {
      let score = 0;
      for (const [dim, tag] of Object.entries(answers)) {
        const list = p.quiz_mapping?.[dim];
        if (Array.isArray(list) && list.includes(tag)) score += 1;
      }
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score);
}

export const QUIZ_DIMENSIONS = ["drink", "flavor", "time", "frequency", "experience"] as const;
