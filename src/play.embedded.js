;(() => {
  const scriptId = 'better_afreeca_embedded_script'
  const pasteAllowIds = ['write_area', 'auqa_voice_textarea']

  let cleanups = []

  pasteAllowIds.forEach((id) => {
    const el = document.getElementById(id)
    if (!el) {
      console.debug(`${id} not found`)
      return
    }

    // Add notranslate class to make translation add-ons ignore the input area
    el.classList.add('notranslate')

    const unblock = () => {
      console.debug(`clearing ${id} paste blocker`)
      $(`#${id}`).off('cut copy paste')
    }
    el.addEventListener('focus', unblock)

    cleanups.push(() => el.removeEventListener('focus', unblock))
  })

  // Ignore chat forms from browser translation
  const notranslateAreaIds = ['actionbox', 'emoticonArea']
  notranslateAreaIds.forEach((id) => {
    const el = document.getElementById(id)
    if (!el) {
      console.debug(`${id} not found`)
      return
    }
    el.setAttribute("translate", "no")
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
