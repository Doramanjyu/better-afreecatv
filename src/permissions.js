const ubrowser = chrome || browser
const origins = [
  'https://api.m.sooplive.co.kr/noti/*',
  'https://play.sooplive.co.kr/*',
]
const enableButton = document.getElementById('enableLiveNotification')
const disableButton = document.getElementById('disableLiveNotification')

const updateButton = async () => {
  const enabled =
    (await ubrowser.storage.local.get('notification'))?.notification === true
  const apiPermitted = await ubrowser.permissions.contains({ origins })
  if (enabled && apiPermitted) {
    enableButton.disabled = true
    disableButton.disabled = false
  } else {
    enableButton.disabled = false
    disableButton.disabled = true
  }
}

enableButton.addEventListener('click', async () => {
  await ubrowser.permissions.request({
    origins,
  })
  await ubrowser.storage.local.set({ notification: true })
  updateButton()
})

disableButton.addEventListener('click', async () => {
  await ubrowser.storage.local.set({ notification: false })
  updateButton()
})

updateButton()
