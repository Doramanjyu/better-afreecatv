console.log('Better Afreeca')

const scriptId = 'better_afreeca_embedded_script'

const oldScript = document.getElementById(scriptId)
if (oldScript) {
  console.debug('Removing old script')
  oldScript.remove()
}

const runtime = chrome?.runtime || browser?.runtime
const script = document.createElement('script')
script.src = runtime.getURL('src/play.embedded.js')
script.id = scriptId

const head = document.head || document.documentElement
head.appendChild(script)
