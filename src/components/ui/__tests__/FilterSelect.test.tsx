import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterSelect from '../FilterSelect'

const mockOptions = [
  { value: '', label: 'All Categories' },
  { value: 'appetizers', label: 'Appetizers', count: 5 },
  { value: 'main-course', label: 'Main Course', count: 12 },
  { value: 'desserts', label: 'Desserts', count: 8 },
]

describe('FilterSelect', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with options', () => {
    render(
      <FilterSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()

    // Check that all options are present
    mockOptions.forEach(option => {
      expect(screen.getByRole('option', { name: new RegExp(option.label) })).toBeInTheDocument()
    })
  })

  it('should render with label', () => {
    render(
      <FilterSelect
        label="Category Filter"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('Category Filter')).toBeInTheDocument()
  })

  it('should display current value', () => {
    render(
      <FilterSelect
        options={mockOptions}
        value="appetizers"
        onChange={mockOnChange}
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('appetizers')
  })

  it('should call onChange when selection changes', async () => {
    const user = userEvent.setup()

    render(
      <FilterSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    )

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'appetizers')

    expect(mockOnChange).toHaveBeenCalledWith('appetizers')
  })

  it('should show counts when showCounts is true', () => {
    render(
      <FilterSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        showCounts={true}
      />
    )

    expect(screen.getByRole('option', { name: /Appetizers \(5\)/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Main Course \(12\)/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Desserts \(8\)/ })).toBeInTheDocument()
  })

  it('should not show counts when showCounts is false', () => {
    render(
      <FilterSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        showCounts={false}
      />
    )

    expect(screen.getByRole('option', { name: 'Appetizers' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Appetizers \(5\)/ })).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <FilterSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        className="custom-filter-class"
      />
    )

    const container = screen.getByRole('combobox').closest('.custom-filter-class')
    expect(container).toBeInTheDocument()
  })

  it('should handle options without counts', () => {
    const optionsWithoutCounts = [
      { value: '', label: 'All Items' },
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ]

    render(
      <FilterSelect
        options={optionsWithoutCounts}
        value=""
        onChange={mockOnChange}
        showCounts={true}
      />
    )

    expect(screen.getByRole('option', { name: 'All Items' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
  })

  it('should handle empty options array', () => {
    render(
      <FilterSelect
        options={[]}
        value=""
        onChange={mockOnChange}
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select.children).toHaveLength(0)
  })

  it('should be accessible', () => {
    render(
      <FilterSelect
        label="Filter by Category"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    )

    const select = screen.getByRole('combobox')
    const label = screen.getByText('Filter by Category')

    expect(select).toBeInTheDocument()
    expect(label).toBeInTheDocument()
    
    // Check that the select is properly labeled
    expect(select).toHaveAccessibleName('Filter by Category')
  })

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup()

    render(
      <FilterSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    )

    const select = screen.getByRole('combobox')
    
    // Focus the select
    await user.click(select)
    
    // Use arrow keys to navigate
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('should maintain selection state', () => {
    const { rerender } = render(
      <FilterSelect
        options={mockOptions}
        value="appetizers"
        onChange={mockOnChange}
      />
    )

    expect(screen.getByRole('combobox')).toHaveValue('appetizers')

    rerender(
      <FilterSelect
        options={mockOptions}
        value="main-course"
        onChange={mockOnChange}
      />
    )

    expect(screen.getByRole('combobox')).toHaveValue('main-course')
  })
})