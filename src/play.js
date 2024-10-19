console.log('Better Afreeca')

const scriptId = 'better_afreeca_embedded_script'
const styleId = 'better_afreeca_embedded_style'
const addedByUsClass = 'better_afreeca_added'

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
Array.from(document.getElementsByClassName(addedByUsClass)).forEach((e) => {
  console.debug('Removing', e)
  e.remove()
})

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

const setNoTranslate = (el) => {
  el.setAttribute('translate', 'no')
  el.classList.add('notranslate')
}

// Ignore chat forms from browser translation
const notranslateAreaIds = [
  'auqa_voice_textarea',
  'write_area',
  // Emoticon box
  'common_emoticon',
  'recent',
  'subscription_emoticon',
]
notranslateAreaIds.forEach((id) => {
  const el = document.getElementById(id)
  if (!el) {
    console.debug(`${id} not found`)
    return
  }
  setNoTranslate(el)
})

// Improve emoticon image resolution
const improveEmoticonResolution = async () => {
  const bjId = window.location.pathname.split('/')[1]
  const resp = await fetch(
    'https://live.sooplive.co.kr/api/signature_emoticon_api.php',
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
  const emoticons = new Map()
  if (data?.img_path) {
    // AfreecaTV uses both `//static...` and `https://static...` as URL.
    // Support both patterns.
    const emoticonBaseUrl = new URL(
      data.img_path.startsWith('//') ? 'https:' + data.img_path : data.img_path,
    )
    const emoticonBasePath = emoticonBaseUrl.toString()
    emoticonBaseUrl.protocol = ''
    const emoticonBasePathNoScheme = emoticonBaseUrl.toString()

    data.data.forEach((v) => {
      emoticons.set(
        emoticonBasePath + v.pc_img,
        emoticonBasePath + v.mobile_img,
      )
      emoticons.set(
        emoticonBasePathNoScheme + v.pc_img,
        emoticonBasePath + v.mobile_img,
      )
    })
  }

  const commonEmoticonUrlPattern = new RegExp(
    '^((https:)?//res.sooplive.co.kr/images/chat/emoticon)/small/(.*)$',
  )
  const largeImage = (url) => {
    const subscription = emoticons.get(url)
    if (subscription) {
      return subscription
    }
    const found = url.match(commonEmoticonUrlPattern)
    if (found) {
      return `${found[1]}/big/${found[3]}`
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
      setNoTranslate(e)
      e.classList.add('hiresEmoticon')
      e.referrerPolicy = 'no-referrer'
      e.src = to
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

// Add button to change opacity of overlay boxes
const addOverlayBoxesOpacityButton = () => {
  const addOpacityButton = (target, buttonParent) => {
    const elTarget = document.querySelector(target)
    if (!elTarget) {
      console.debug(`${target} not found`)
      return
    }
    const elButtonParent = document.querySelector(buttonParent)
    if (!elButtonParent) {
      console.debug(`${buttonParent} not found`)
      return
    }

    const handler = () => elTarget.classList.toggle('betterAfreecaTransparent')
    const button = document.createElement('button')
    button.className = `betterAfreecaChangeOpacity ${addedByUsClass}`
    button.innerHTML = 'Opacity'
    button.addEventListener('click', handler)
    elButtonParent.appendChild(button)
  }
  addOpacityButton('#emoticonContainer', '#emoticonContainer div.head h3')
  addOpacityButton('#layerStarGiftNew', '#layerStarGiftNew div.title-area')
}

addOverlayBoxesOpacityButton()
