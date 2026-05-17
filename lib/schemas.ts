// lib/schemas.ts
import { z } from 'zod'

const unitSchema = z.enum(['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'cup'])

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: unitSchema,
})

const mealSchema = z.object({
  name: z.string().min(1),
  prepTime: z.string().optional(),
  cuisine: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1),
})

export const singleMealResponseSchema = z.object({
  name: z.string().min(1),
  prepTime: z.string().optional(),
  cuisine: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1),
})

export const weekMealsResponseSchema = z.object({
  meals: z.array(mealSchema).length(7),
})

export type MealResponse = z.infer<typeof singleMealResponseSchema>
export type WeekMealsResponse = z.infer<typeof weekMealsResponseSchema>
