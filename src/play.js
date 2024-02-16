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

// Improve emoticon image resolution on PC
const improveEmoticonResolution = async () => {
  const bjId = window.location.pathname.split('/')[1]
  const resp = await fetch(
    'https://live.afreecatv.com/api/signature_emoticon_api.php',
    {
      method: 'POST',
      body: new URLSearchParams({
        work: 'list',
        szBjId: bjId,
        nState: 2,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  )
  const data = await resp.json()
  const emoticonBasePath = data.img_path
  const emoticons = data.data.reduce(
    (acc, v) =>
      acc.set(emoticonBasePath + v.pc_img, emoticonBasePath + v.mobile_img),
    new Map(),
  )

  const commonEmoticonUrlPattern = new RegExp(
    '^(https://res.afreecatv.com/images/chat/emoticon)/small/(.*)$',
  )
  const largeImage = (url) => {
    const subscription = emoticons.get(url)
    if (subscription) {
      return subscription
    }
    const found = url.match(commonEmoticonUrlPattern)
    if (found) {
      return `${found[1]}/big/${found[2]}`
    }
    return null
  }

  const replaceEmoticons = (n) =>
    Array.from(n.getElementsByTagName('img')).forEach((e) => {
      const to = largeImage(e.src)
      if (!to) {
        return
      }
      console.debug(
        `Replacing ${e.src.split('/').pop()} by ${to.split('/').pop()}`,
      )
      e.src = to
      e.classList.add('hiresEmoticon')
    })

  const chatArea = document.getElementById('chat_area')
  const chatObserver = new MutationObserver((mrs) =>
    mrs.forEach((mr) => mr.addedNodes.forEach((n) => replaceEmoticons(n))),
  )
  replaceEmoticons(chatArea)
  chatObserver.observe(chatArea, { childList: true })

  const emoticonBox = document.getElementById('emoticonBox')
  const emoticonAreaObserver = new MutationObserver(() =>
    replaceEmoticons(emoticonBox),
  )
  replaceEmoticons(emoticonBox)
  emoticonAreaObserver.observe(emoticonBox, { childList: true, subtree: true })
}

improveEmoticonResolution()
