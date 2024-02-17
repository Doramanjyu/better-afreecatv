;(() => {
  const scriptId = 'better_afreeca_embedded_script'
  const pasteAllowIds = ['write_area', 'auqa_voice_textarea']

  let cleanups = []

  // Allow pasting to chat and gift text area
  //
  // note:
  //  This uses jQuery on the document context to clear the paste blocker handler.
  //  It should be done in the embedded script on the document context
  //  instead of the content script on the isolated context.
  pasteAllowIds.forEach((id) => {
    const el = document.getElementById(id)
    if (!el) {
      console.debug(`${id} not found`)
      return
    }

    const unblock = () => {
      console.debug(`clearing ${id} paste blocker`)
      $(`#${id}`).off('cut copy paste')
    }
    el.addEventListener('focus', unblock)

    cleanups.push(() => el.removeEventListener('focus', unblock))
  })

  const script = document.getElementById(scriptId)
  const observer = new MutationObserver((mrs) => {
    mrs.forEach((mr) => {
      if (!mr?.removedNodes) {
        return
      }
      mr.removedNodes.forEach((n) => {
        if (n.id === script.id) {
          observer.disconnect()
          cleanups.forEach((f) => f())
        }
      })
    })
  })
  observer.observe(script.parentElement, { childList: true })
})()
