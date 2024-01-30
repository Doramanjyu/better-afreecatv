;(() => {
  const writeArea = document.getElementById('write_area')
  if (!writeArea) {
    console.debug('write_area not found')
    return
  }
  writeArea.addEventListener('focus', () => {
    console.debug('clearing write_area paste blocker')
    $('#write_area').off('cut copy paste')
  })
})()
