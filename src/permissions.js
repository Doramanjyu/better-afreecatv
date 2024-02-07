const ubrowser = chrome || browser
const origins = [
  'https://play.afreecatv.com/*',
  'https://afevent.afreecatv.com/api/*',
]
const button = document.getElementById('enableLiveNotification')

const updateButton = async () => {
  const permitted = await ubrowser.permissions.contains({ origins })
  if (permitted) {
    button.innerHTML = 'Live Notification Feature is enabled'
    button.disabled = true
  }
}

button.addEventListener('click', async () => {
  console.log('asking API host permission')
  await ubrowser.permissions.request({
    origins,
  })
  updateButton()
})

updateButton()
