// tests/components/ShoppingListModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShoppingListModal } from '@/components/ShoppingListModal'
import { ShoppingList } from '@/lib/types'

const mockList: ShoppingList = {
  generatedAt: '2026-05-17T10:00:00Z',
  categories: [
    {
      name: 'produce',
      items: [
        { name: 'tomato', quantity: 300, unit: 'g' },
        { name: 'onion', quantity: 2, unit: 'pcs' },
      ],
    },
    {
      name: 'meat',
      items: [{ name: 'chicken breast', quantity: 1.2, unit: 'kg' }],
    },
  ],
}

describe('ShoppingListModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ShoppingListModal open={false} list={mockList} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows category headers when open', () => {
    render(<ShoppingListModal open={true} list={mockList} onClose={vi.fn()} />)
    expect(screen.getByText(/produce/i)).toBeInTheDocument()
    expect(screen.getByText(/meat/i)).toBeInTheDocument()
  })

  it('shows ingredient names', () => {
    render(<ShoppingListModal open={true} list={mockList} onClose={vi.fn()} />)
    expect(screen.getByText(/tomato/i)).toBeInTheDocument()
    expect(screen.getByText(/chicken breast/i)).toBeInTheDocument()
  })

  it('has Copy, txt, csv, and Print buttons', () => {
    render(<ShoppingListModal open={true} list={mockList} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\.txt/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\.csv/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()
  })
})
