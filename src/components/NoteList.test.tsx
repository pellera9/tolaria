import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { NoteList } from './NoteList'
import type { VaultEntry, SidebarSelection } from '../types'

const allSelection: SidebarSelection = { kind: 'filter', filter: 'all' }
const noopSelect = vi.fn()

const mockEntries: VaultEntry[] = [
  {
    path: '/Users/luca/Laputa/project/26q1-laputa-app.md',
    filename: '26q1-laputa-app.md',
    title: 'Build Laputa App',
    isA: 'Project',
    aliases: [],
    belongsTo: [],
    relatedTo: ['[[topic/software-development]]'],
    status: 'Active',
    owner: 'Luca',
    cadence: null,
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 1024,
    snippet: 'Build a personal knowledge management app.',
  },
  {
    path: '/Users/luca/Laputa/note/facebook-ads-strategy.md',
    filename: 'facebook-ads-strategy.md',
    title: 'Facebook Ads Strategy',
    isA: 'Note',
    aliases: [],
    belongsTo: ['[[project/26q1-laputa-app]]'],
    relatedTo: ['[[topic/growth]]'],
    status: null,
    owner: null,
    cadence: null,
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 847,
    snippet: 'Lookalike audiences convert 3x better.',
  },
  {
    path: '/Users/luca/Laputa/person/matteo-cellini.md',
    filename: 'matteo-cellini.md',
    title: 'Matteo Cellini',
    isA: 'Person',
    aliases: [],
    belongsTo: [],
    relatedTo: [],
    status: null,
    owner: null,
    cadence: null,
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 320,
    snippet: 'Sponsorship manager.',
  },
  {
    path: '/Users/luca/Laputa/event/2026-02-14-kickoff.md',
    filename: '2026-02-14-kickoff.md',
    title: 'Kickoff Meeting',
    isA: 'Event',
    aliases: [],
    belongsTo: [],
    relatedTo: [],
    status: null,
    owner: null,
    cadence: null,
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 512,
    snippet: 'Project kickoff meeting notes.',
  },
  {
    path: '/Users/luca/Laputa/topic/software-development.md',
    filename: 'software-development.md',
    title: 'Software Development',
    isA: 'Topic',
    aliases: [],
    belongsTo: [],
    relatedTo: [],
    status: null,
    owner: null,
    cadence: null,
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 256,
    snippet: 'Frontend, backend, and systems programming.',
  },
]

describe('NoteList', () => {
  it('shows empty state when no entries', () => {
    render(<NoteList entries={[]} selection={allSelection} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    expect(screen.getByText('No notes found')).toBeInTheDocument()
  })

  it('renders all entries with All Notes filter', () => {
    render(<NoteList entries={mockEntries} selection={allSelection} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    expect(screen.getByText('Build Laputa App')).toBeInTheDocument()
    expect(screen.getByText('Facebook Ads Strategy')).toBeInTheDocument()
    expect(screen.getByText('Matteo Cellini')).toBeInTheDocument()
  })

  it('filters by People (section group)', () => {
    render(<NoteList entries={mockEntries} selection={{ kind: 'sectionGroup', type: 'Person' }} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    expect(screen.getByText('Matteo Cellini')).toBeInTheDocument()
    expect(screen.queryByText('Build Laputa App')).not.toBeInTheDocument()
  })

  it('filters by Events (section group)', () => {
    render(<NoteList entries={mockEntries} selection={{ kind: 'sectionGroup', type: 'Event' }} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    expect(screen.getByText('Kickoff Meeting')).toBeInTheDocument()
    expect(screen.queryByText('Build Laputa App')).not.toBeInTheDocument()
  })

  it('filters by section group type', () => {
    render(<NoteList entries={mockEntries} selection={{ kind: 'sectionGroup', type: 'Project' }} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    expect(screen.getByText('Build Laputa App')).toBeInTheDocument()
    expect(screen.queryByText('Matteo Cellini')).not.toBeInTheDocument()
  })

  it('shows entity pinned at top with grouped children', () => {
    const { container } = render(
      <NoteList entries={mockEntries} selection={{ kind: 'entity', entry: mockEntries[0] }} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />
    )
    // Entity title appears in header and pinned card
    expect(screen.getAllByText('Build Laputa App').length).toBeGreaterThanOrEqual(1)
    // Child entry in "Children" group
    expect(screen.getByText('Facebook Ads Strategy')).toBeInTheDocument()
    // Unrelated entries not shown
    expect(screen.queryByText('Matteo Cellini')).not.toBeInTheDocument()
    // Group headers shown
    expect(screen.getByText('Children')).toBeInTheDocument()
    expect(screen.getByText('Related To')).toBeInTheDocument()
    // Type pills hidden in entity view
    expect(container.querySelector('.note-list__pills')).toBeNull()
  })

  it('filters by topic (relatedTo references)', () => {
    render(
      <NoteList entries={mockEntries} selection={{ kind: 'topic', entry: mockEntries[4] }} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />
    )
    // Build Laputa App has relatedTo: [[topic/software-development]]
    expect(screen.getByText('Build Laputa App')).toBeInTheDocument()
    expect(screen.queryByText('Facebook Ads Strategy')).not.toBeInTheDocument()
  })

  it('shows search input when search icon is clicked', () => {
    render(<NoteList entries={mockEntries} selection={allSelection} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    // Search is hidden by default
    expect(screen.queryByPlaceholderText('Search notes...')).not.toBeInTheDocument()
    // Click search icon to show it
    fireEvent.click(screen.getByTitle('Search notes'))
    expect(screen.getByPlaceholderText('Search notes...')).toBeInTheDocument()
  })

  it('filters by search query (case-insensitive substring)', () => {
    render(<NoteList entries={mockEntries} selection={allSelection} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    // Open search
    fireEvent.click(screen.getByTitle('Search notes'))
    const input = screen.getByPlaceholderText('Search notes...')
    fireEvent.change(input, { target: { value: 'facebook' } })
    expect(screen.getByText('Facebook Ads Strategy')).toBeInTheDocument()
    expect(screen.queryByText('Build Laputa App')).not.toBeInTheDocument()
  })

  it('sorts entries by last modified descending', () => {
    const entriesWithDifferentDates: VaultEntry[] = [
      { ...mockEntries[0], modifiedAt: 1000, title: 'Oldest' },
      { ...mockEntries[1], modifiedAt: 3000, title: 'Newest', path: '/p2' },
      { ...mockEntries[2], modifiedAt: 2000, title: 'Middle', path: '/p3' },
    ]
    render(<NoteList entries={entriesWithDifferentDates} selection={allSelection} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    const titles = screen.getAllByText(/Oldest|Newest|Middle/)
    const titleTexts = titles.map((el) => el.textContent)
    expect(titleTexts).toEqual(['Newest', 'Middle', 'Oldest'])
  })

  it('renders type filter pills with counts and hides empty types', () => {
    const { container } = render(<NoteList entries={mockEntries} selection={allSelection} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    const pills = container.querySelectorAll('.note-list__pill')
    const labels = Array.from(pills).map((p) => p.textContent)
    // Pills show label + count (CSS uppercase applies visually but not in textContent)
    expect(labels).toContain('All 5')
    expect(labels).toContain('Projects 1')
    expect(labels).toContain('Notes 1')
    expect(labels).toContain('Events 1')
    expect(labels).toContain('People 1')
    // Empty types should be hidden
    expect(labels.some((l) => l?.startsWith('Experiments'))).toBe(false)
    expect(labels.some((l) => l?.startsWith('Procedures'))).toBe(false)
    expect(labels.some((l) => l?.startsWith('Responsibilities'))).toBe(false)
    // Verify pills have IBM Plex Mono font and uppercase class
    const firstPill = pills[0] as HTMLElement
    expect(firstPill.style.fontFamily).toContain('IBM Plex Mono')
    expect(firstPill.className).toContain('uppercase')
  })

  it('filters by type pill', () => {
    const { container } = render(<NoteList entries={mockEntries} selection={allSelection} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    const projectsPill = Array.from(container.querySelectorAll('.note-list__pill')).find((p) => p.textContent?.startsWith('Projects'))!
    fireEvent.click(projectsPill)
    expect(screen.getByText('Build Laputa App')).toBeInTheDocument()
    expect(screen.queryByText('Matteo Cellini')).not.toBeInTheDocument()
    expect(screen.queryByText('Facebook Ads Strategy')).not.toBeInTheDocument()
  })

  it('clicking All pill resets type filter', () => {
    const { container } = render(<NoteList entries={mockEntries} selection={allSelection} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    const peoplePill = Array.from(container.querySelectorAll('.note-list__pill')).find((p) => p.textContent?.startsWith('People'))!
    fireEvent.click(peoplePill)
    expect(screen.queryByText('Build Laputa App')).not.toBeInTheDocument()
    const allPill = Array.from(container.querySelectorAll('.note-list__pill')).find((p) => p.textContent?.startsWith('All'))!
    fireEvent.click(allPill)
    expect(screen.getByText('Build Laputa App')).toBeInTheDocument()
  })

  it('does not render type badge or status on note items', () => {
    render(<NoteList entries={mockEntries} selection={allSelection} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    // Type badges like "Project", "Note" etc. should not appear as separate badge elements
    // The word "Project" should only appear in the ALL CAPS pill "PROJECTS 1", not as a standalone badge
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('header shows search and plus icons instead of count badge', () => {
    render(<NoteList entries={mockEntries} selection={allSelection} selectedNote={null} onSelectNote={noopSelect} allContent={{}} onCreateNote={vi.fn()} />)
    expect(screen.getByTitle('Search notes')).toBeInTheDocument()
    expect(screen.getByTitle('Create new note')).toBeInTheDocument()
  })
})
