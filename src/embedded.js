;(() => {
  const pasteAllowIds = [
    'write_area',
    'auqa_voice_textarea',
  ]

  pasteAllowIds.forEach((id) => {
    const el = document.getElementById(id)
    if (!el) {
      console.debug(`${id} not found`)
      return
    }
    el.addEventListener('focus', () => {
      console.debug(`clearing ${id} paste blocker`)
      $(`#${id}`).off('cut copy paste')
    })
  })
})()
