import { Question } from "./types";

// Helper to generate generic questions for other units (placeholder data)
const generateGenericQuestions = (unitId: number): Question[] => [
  { id: 1, text: `Unit ${unitId}: What is your favorite animal?`, hint: "My favorite animal is..." },
  { id: 2, text: `Unit ${unitId}: What do you like to eat?`, hint: "I like to eat..." },
  { id: 3, text: `Unit ${unitId}: Can you swim?`, hint: "Yes, I can / No, I cannot" },
];

// Define questions specifically for Unit 1 (as requested previously)
const UNIT_1_QUESTIONS: Question[] = [
  { id: 1, text: "How old are you?", hint: "I am..." },
  { id: 2, text: "What color is the house?", hint: "The house is..." },
  { id: 3, text: "What is your mom's name?", hint: "My mom's name is..." },
  { id: 4, text: "What is your dad's name?", hint: "My dad's name is..." },
];

// Create a map of Unit ID to Questions
export const UNIT_QUESTIONS: Record<number, Question[]> = {
  1: UNIT_1_QUESTIONS,
  // Generate placeholders for Units 2-40 so the UI works
  ...Object.fromEntries(
    Array.from({ length: 39 }, (_, i) => [i + 2, generateGenericQuestions(i + 2)])
  )
};

export const POSITIVE_STICKERS = ["🌟", "🏆", "🦄", "🚀", "🌈", "🎈"];