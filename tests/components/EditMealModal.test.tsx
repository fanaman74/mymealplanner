// tests/components/EditMealModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditMealModal } from '@/components/EditMealModal'
import { Meal } from '@/lib/types'

const mockMeal: Meal = {
  id: 'edit-test',
  name: 'Pasta Carbonara',
  ingredients: [
    { name: 'pasta', quantity: 400, unit: 'g' },
    { name: 'egg', quantity: 4, unit: 'pcs' },
  ],
}

describe('EditMealModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <EditMealModal open={false} meal={mockMeal} onSave={vi.fn()} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows meal name in input when open', () => {
    render(<EditMealModal open={true} meal={mockMeal} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Pasta Carbonara')).toBeInTheDocument()
  })

  it('calls onSave with updated meal when saved', () => {
    const onSave = vi.fn()
    render(<EditMealModal open={true} meal={mockMeal} onSave={onSave} onClose={vi.fn()} />)
    const nameInput = screen.getByDisplayValue('Pasta Carbonara')
    fireEvent.change(nameInput, { target: { value: 'Spaghetti Carbonara' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Spaghetti Carbonara', id: 'edit-test' })
    )
  })

  it('adds a new ingredient row when Add button clicked', () => {
    render(<EditMealModal open={true} meal={mockMeal} onSave={vi.fn()} onClose={vi.fn()} />)
    const addBtn = screen.getByRole('button', { name: /add ingredient/i })
    fireEvent.click(addBtn)
    // should now have 3 ingredient rows (2 original + 1 new)
    const nameInputs = screen.getAllByPlaceholderText(/ingredient name/i)
    expect(nameInputs).toHaveLength(3)
  })

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn()
    render(<EditMealModal open={true} meal={mockMeal} onSave={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
