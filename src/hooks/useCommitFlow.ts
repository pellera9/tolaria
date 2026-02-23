import { useCallback, useState } from 'react'

interface CommitFlowConfig {
  savePending: () => Promise<void>
  loadModifiedFiles: () => Promise<void>
  commitAndPush: (message: string) => Promise<string>
  setToastMessage: (msg: string | null) => void
}

/** Manages the Commit & Push dialog state and the save→commit→push flow. */
export function useCommitFlow({ savePending, loadModifiedFiles, commitAndPush, setToastMessage }: CommitFlowConfig) {
  const [showCommitDialog, setShowCommitDialog] = useState(false)

  const openCommitDialog = useCallback(async () => {
    await savePending()
    await loadModifiedFiles()
    setShowCommitDialog(true)
  }, [savePending, loadModifiedFiles])

  const handleCommitPush = useCallback(async (message: string) => {
    setShowCommitDialog(false)
    try {
      await savePending()
      const result = await commitAndPush(message)
      setToastMessage(result)
      loadModifiedFiles()
    } catch (err) {
      console.error('Commit failed:', err)
      setToastMessage(`Commit failed: ${err}`)
    }
  }, [savePending, commitAndPush, loadModifiedFiles, setToastMessage])

  const closeCommitDialog = useCallback(() => setShowCommitDialog(false), [])

  return { showCommitDialog, openCommitDialog, handleCommitPush, closeCommitDialog }
}
