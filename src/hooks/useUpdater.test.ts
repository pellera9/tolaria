import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useUpdater } from './useUpdater'

// Mock isTauri
vi.mock('../mock-tauri', () => ({
  isTauri: vi.fn(() => false),
}))

// Mock the dynamic imports
const mockCheck = vi.fn()
const mockRelaunch = vi.fn()

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: (...args: unknown[]) => mockCheck(...args),
}))

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: (...args: unknown[]) => mockRelaunch(...args),
}))

import { isTauri } from '../mock-tauri'

describe('useUpdater', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('does nothing when not in Tauri', () => {
    vi.mocked(isTauri).mockReturnValue(false)
    renderHook(() => useUpdater())
    vi.advanceTimersByTime(5000)
    expect(mockCheck).not.toHaveBeenCalled()
  })

  it('checks for updates after delay when in Tauri', async () => {
    vi.mocked(isTauri).mockReturnValue(true)
    mockCheck.mockResolvedValue(null) // no update

    renderHook(() => useUpdater())
    expect(mockCheck).not.toHaveBeenCalled()

    // Advance past the 3s delay, then flush microtasks for dynamic imports
    await vi.advanceTimersByTimeAsync(3500)
    // Dynamic imports are resolved by the mock, but need microtask flush
    await vi.waitFor(() => {
      expect(mockCheck).toHaveBeenCalledOnce()
    })
  })

  it('shows confirm dialog when update is available', async () => {
    vi.mocked(isTauri).mockReturnValue(true)
    mockCheck.mockResolvedValue({
      version: '1.2.0',
      body: 'Bug fixes and improvements',
      downloadAndInstall: vi.fn().mockResolvedValue(undefined),
    })
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderHook(() => useUpdater())
    await vi.advanceTimersByTimeAsync(3500)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('1.2.0')
    )
    expect(mockRelaunch).not.toHaveBeenCalled()
  })

  it('downloads, installs, and relaunches when user accepts', async () => {
    vi.mocked(isTauri).mockReturnValue(true)
    const mockDownloadAndInstall = vi.fn().mockResolvedValue(undefined)
    mockCheck.mockResolvedValue({
      version: '1.2.0',
      body: '',
      downloadAndInstall: mockDownloadAndInstall,
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockRelaunch.mockResolvedValue(undefined)

    renderHook(() => useUpdater())
    await vi.advanceTimersByTimeAsync(3500)

    expect(mockDownloadAndInstall).toHaveBeenCalled()
    expect(mockRelaunch).toHaveBeenCalled()
  })

  it('logs warning on check failure without crashing', async () => {
    vi.mocked(isTauri).mockReturnValue(true)
    mockCheck.mockRejectedValue(new Error('Network error'))

    renderHook(() => useUpdater())
    await vi.advanceTimersByTimeAsync(3500)

    expect(console.warn).toHaveBeenCalledWith(
      '[updater] Failed to check for updates:',
      expect.any(Error)
    )
  })
})
