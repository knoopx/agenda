import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateTime, Settings } from 'luxon'
import { Store } from '../../models'
import Task from './Task'
import { ITask } from '../../models/Task'

// Set up timezone and mock time
Settings.defaultZone = 'Europe/Madrid'
const mockNow = DateTime.local(2024, 1, 15, 10, 0, 0)
Settings.now = () => mockNow.toMillis()

// Global store variable for tests
let store: any

// Mock hooks
vi.mock('../../hooks', () => ({
  useStore: () => store,
  useFocus: () => false,
  useEnterKey: vi.fn(),
  useEscapeKey: vi.fn(),
  useEventListener: vi.fn(),
}))

// Mock wrapper - wrap in table for proper rendering
const MockWrapper = ({ children }: { children: React.ReactNode }) => (
  <table><tbody>{children}</tbody></table>
)

describe('Task Component', () => {
  let mockTask: ITask

  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
    })
    
    mockTask = store.addTask({ expression: 'Test task' })!
    vi.clearAllMocks()
  })

  describe('Task Rendering', () => {
    it('renders task with subject', () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      expect(screen.getByDisplayValue('Test task')).toBeInTheDocument()
    })

    it('renders task with checkbox', () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()
    })

    it('applies proper CSS classes to task row', () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      const taskRow = screen.getByDisplayValue('Test task').closest('tr')
      expect(taskRow).toHaveClass('align-middle')
      expect(taskRow).not.toHaveClass('opacity-50')
    })
  })

  describe('Task Completion', () => {
    it('renders checked checkbox for completed task', () => {
      mockTask.complete()
      
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('applies dimmed styling to completed tasks', () => {
      mockTask.complete()
      
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      const taskRow = screen.getByDisplayValue('Test task').closest('tr')
      expect(taskRow).toHaveClass('opacity-50')
    })

    it('toggles task completion when checkbox is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      const checkbox = screen.getByRole('checkbox')
      expect(mockTask.isCompleted).toBe(false)

      await user.click(checkbox)
      
      expect(mockTask.isCompleted).toBe(true)
    })

    it('uncompletes task when clicking completed task checkbox', async () => {
      const user = userEvent.setup()
      mockTask.complete() // Start with completed task
      
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      const checkbox = screen.getByRole('checkbox')
      expect(mockTask.isCompleted).toBe(true)

      await user.click(checkbox)
      
      expect(mockTask.isCompleted).toBe(false)
    })
  })

  describe('Task Editing', () => {
    it('shows task input field', () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      const input = screen.getByDisplayValue('Test task')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('allows text input in task field', async () => {
      const user = userEvent.setup()
      
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      const input = screen.getByDisplayValue('Test task')
      fireEvent.change(input, { target: { value: 'Updated task' } })

      expect(input).toHaveValue('Updated task')
    })
  })

  describe('Task Properties', () => {
    it('handles tasks with different completion states', () => {
      const incompleteTask = store.addTask({ expression: 'Task 1' })!
      const completeTask = store.addTask({ expression: 'Completed task' })!
      completeTask.complete()

      // Test incomplete task
      render(
        <MockWrapper>
          <Task task={incompleteTask} />
        </MockWrapper>
      )
      expect(screen.getByRole('checkbox')).not.toBeChecked()

      // Clean up and test complete task
      cleanup()
      render(
        <MockWrapper>
          <Task task={completeTask} />
        </MockWrapper>
      )
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('maintains task state correctly', () => {
      expect(mockTask.isCompleted).toBe(false)
      expect(mockTask.subject).toBe('Test task')
      expect(mockTask.isValid).toBe(true)
    })
  })

  describe('Component Structure', () => {
    it('renders within table row structure', () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      const taskRow = screen.getByDisplayValue('Test task').closest('tr')
      expect(taskRow).toBeInTheDocument()
      
      const cells = taskRow?.querySelectorAll('td')
      expect(cells).toHaveLength(2) // Time cell and content cell
    })

    it('contains required task elements', () => {
      render(
        <MockWrapper>
          <Task task={mockTask} />
        </MockWrapper>
      )

      expect(screen.getByDisplayValue('Test task')).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })
  })
})