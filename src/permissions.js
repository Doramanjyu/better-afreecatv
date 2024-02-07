const ubrowser = chrome || browser
const origins = [
  'https://play.afreecatv.com/*',
  'https://afevent.afreecatv.com/api/*',
]
const button = document.getElementById('enableLiveNotification')

const updateButton = async () => {
  const apiPermitted = await ubrowser.permissions.contains({ origins })
  if (apiPermitted) {
    button.innerHTML = 'Live Notification Feature is enabled'
    button.disabled = true
  }
}

button.addEventListener('click', () => {
  console.log('asking permissions')
  ubrowser.permissions
    .request({
      origins,
    })
    .then(() => updateButton())
})

updateButton()
