import { useEffect } from 'react'
import { isTauri } from '../mock-tauri'

/**
 * Checks for OTA updates on app startup (Tauri only).
 * If an update is available, shows a native confirm dialog and
 * downloads + installs + relaunches if the user accepts.
 */
export function useUpdater() {
  useEffect(() => {
    if (!isTauri()) return

    const checkForUpdates = async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater')
        const { relaunch } = await import('@tauri-apps/plugin-process')

        const update = await check()
        if (!update) return

        const yes = window.confirm(
          `A new version (${update.version}) is available.\n\n` +
            (update.body ? `${update.body}\n\n` : '') +
            'Do you want to update and restart now?'
        )
        if (!yes) return

        await update.downloadAndInstall()
        await relaunch()
      } catch (err) {
        // Silently log — update check failures should never block the app
        console.warn('[updater] Failed to check for updates:', err)
      }
    }

    // Delay slightly so the app can render first
    const timer = setTimeout(checkForUpdates, 3000)
    return () => clearTimeout(timer)
  }, [])
}
