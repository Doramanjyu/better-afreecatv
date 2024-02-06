console.log('Better Afreeca')

const scriptId = 'better_afreeca_embedded_script'
const styleId = 'better_afreeca_embedded_style'

const oldScript = document.getElementById(scriptId)
if (oldScript) {
  console.debug('Removing old script')
  oldScript.remove()
}
const oldStyle = document.getElementById(styleId)
if (oldStyle) {
  console.debug('Removing old style')
  oldStyle.remove()
}

const runtime = chrome?.runtime || browser?.runtime

const script = document.createElement('script')
script.src = runtime.getURL('src/play.embedded.js')
script.id = scriptId

const style = document.createElement('link')
style.href = runtime.getURL('src/play.css')
style.rel = 'stylesheet'
style.type = 'text/css'
style.id = styleId

const head = document.head || document.documentElement
head.appendChild(script)
head.appendChild(style)

if (Notification.permission !== 'granted') {
  document.addEventListener('click', 
    () => Notification.requestPermission(),
    {once: true},
  )
}

const registerWorker = async () => {
  try {
    const registration = await navigator.serviceWorker.register(
      runtime.getURL('src/notification.worker.js'),
      {
        scope: "/",
      },
    )
    if (registration.installing) {
      console.log("Service worker installing")
    } else if (registration.waiting) {
      console.log("Service worker installed")
    } else if (registration.active) {
      console.log("Service worker active")
    }
    registration.showNotification('Sample', {
      body: 'test',
    })
  } catch (error) {
    console.error(`Registration failed with ${error}`)
  }
}
registerWorker()
