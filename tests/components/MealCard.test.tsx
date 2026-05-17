// tests/components/MealCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MealCard } from '@/components/MealCard'
import { Meal, Weekday } from '@/lib/types'

const mockMeal: Meal = {
  id: 'test-id',
  name: 'Stoofvlees',
  ingredients: [
    { name: 'beef', quantity: 500, unit: 'g' },
    { name: 'onion', quantity: 2, unit: 'pcs' },
  ],
  prepTime: '120 min',
  cuisine: 'Belgian',
}

const defaultProps = {
  day: 'mon' as Weekday,
  meal: null as Meal | null,
  loading: false,
  weekLoading: false,
  onRandomize: vi.fn(),
  onEdit: vi.fn(),
}

describe('MealCard', () => {
  it('shows empty state when no meal', () => {
    render(<MealCard {...defaultProps} />)
    expect(screen.getByText(/no meal/i)).toBeInTheDocument()
  })

  it('shows meal name when meal provided', () => {
    render(<MealCard {...defaultProps} meal={mockMeal} />)
    expect(screen.getByText('Stoofvlees')).toBeInTheDocument()
  })

  it('shows ingredients', () => {
    render(<MealCard {...defaultProps} meal={mockMeal} />)
    expect(screen.getByText(/beef/i)).toBeInTheDocument()
    expect(screen.getByText(/onion/i)).toBeInTheDocument()
  })

  it('calls onRandomize when randomize button clicked', () => {
    const onRandomize = vi.fn()
    render(<MealCard {...defaultProps} onRandomize={onRandomize} />)
    fireEvent.click(screen.getByRole('button', { name: /randomize/i }))
    expect(onRandomize).toHaveBeenCalledWith('mon')
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    render(<MealCard {...defaultProps} meal={mockMeal} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith('mon', mockMeal)
  })

  it('shows loading skeleton when loading', () => {
    render(<MealCard {...defaultProps} loading={true} />)
    expect(screen.getByTestId('meal-skeleton')).toBeInTheDocument()
  })

  it('disables randomize button during weekLoading', () => {
    render(<MealCard {...defaultProps} weekLoading={true} />)
    expect(screen.getByRole('button', { name: /randomize/i })).toBeDisabled()
  })
})
