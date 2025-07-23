import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchInput from '../SearchInput'

describe('SearchInput', () => {
  const mockOnChange = jest.fn()
  const mockOnSearch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with default props', () => {
    render(
      <SearchInput 
        value="" 
        onChange={mockOnChange} 
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Search...')
  })

  it('should render with custom placeholder', () => {
    render(
      <SearchInput 
        value="" 
        onChange={mockOnChange}
        placeholder="Search meals..."
      />
    )
    
    const input = screen.getByPlaceholderText('Search meals...')
    expect(input).toBeInTheDocument()
  })

  it('should display the current value', () => {
    render(
      <SearchInput 
        value="test query" 
        onChange={mockOnChange} 
      />
    )
    
    const input = screen.getByDisplayValue('test query')
    expect(input).toBeInTheDocument()
  })

  it('should call onChange when typing', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchInput 
        value="" 
        onChange={mockOnChange}
        debounceMs={100}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'test')
    
    // Wait for debounce
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('test')
    }, { timeout: 200 })
  })

  it('should debounce onChange calls', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchInput 
        value="" 
        onChange={mockOnChange}
        debounceMs={100}
      />
    )
    
    const input = screen.getByRole('textbox')
    
    // Type multiple characters quickly
    await user.type(input, 'hello')
    
    // Should not call onChange immediately
    expect(mockOnChange).not.toHaveBeenCalled()
    
    // Wait for debounce
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('hello')
    }, { timeout: 200 })
    
    // Should only be called once after debounce
    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  it('should call onSearch when Enter is pressed', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchInput 
        value="test query" 
        onChange={mockOnChange}
        onSearch={mockOnSearch}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.type(input, '{enter}')
    
    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('should show clear button when there is a value', () => {
    render(
      <SearchInput 
        value="test" 
        onChange={mockOnChange} 
      />
    )
    
    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeInTheDocument()
  })

  it('should not show clear button when value is empty', () => {
    render(
      <SearchInput 
        value="" 
        onChange={mockOnChange} 
      />
    )
    
    const clearButton = screen.queryByRole('button', { name: /clear search/i })
    expect(clearButton).not.toBeInTheDocument()
  })

  it('should clear value when clear button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchInput 
        value="test" 
        onChange={mockOnChange} 
      />
    )
    
    const clearButton = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearButton)
    
    expect(mockOnChange).toHaveBeenCalledWith('')
  })

  it('should focus input when autoFocus is true', () => {
    render(
      <SearchInput 
        value="" 
        onChange={mockOnChange}
        autoFocus={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveFocus()
  })

  it('should apply custom className', () => {
    render(
      <SearchInput 
        value="" 
        onChange={mockOnChange}
        className="custom-class"
      />
    )
    
    const container = screen.getByRole('textbox').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('should update local value when prop value changes', () => {
    const { rerender } = render(
      <SearchInput 
        value="initial" 
        onChange={mockOnChange} 
      />
    )
    
    expect(screen.getByDisplayValue('initial')).toBeInTheDocument()
    
    rerender(
      <SearchInput 
        value="updated" 
        onChange={mockOnChange} 
      />
    )
    
    expect(screen.getByDisplayValue('updated')).toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchInput 
        value="" 
        onChange={mockOnChange}
        onSearch={mockOnSearch}
      />
    )
    
    const input = screen.getByRole('textbox')
    
    // Type some text
    await user.type(input, 'search term')
    
    // Press Enter
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('search term')
    })
  })
})