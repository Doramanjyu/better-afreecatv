const ubrowser = chrome || browser

const NotificationTypes = Object.freeze({
  LiveStart: 'F01',
  NewPost: 'F02',
})

const openSettingPage = () => {
  ubrowser.tabs.create({
    url: ubrowser.runtime.getURL('src/index.html'),
    active: true,
  })
}

const isPermitted = async () => {
  const origins = [
    'https://play.afreecatv.com/*',
    'https://afevent.afreecatv.com/api/*',
  ]
  return ubrowser.permissions.contains({ origins })
}

const requestPermissions = async () => {
  if (await isPermitted()) {
    console.log('permissions are ok')
    return
  }
  openSettingPage()
}
ubrowser.runtime.onInstalled.addListener(requestPermissions)
ubrowser.action.onClicked.addListener(openSettingPage)

const checkNotifications = async () => {
  const enabled =
    (await ubrowser.storage.local.get('notification'))?.notification === true
  if (!enabled) {
    return
  }
  const permitted = await isPermitted()
  if (!permitted) {
    console.log('notification is not permitted')
    return
  }
  try {
    console.log('checking')
    const respCount = await fetch(
      'https://afevent.afreecatv.com/api/notification.php?szWork=getBadgeInfo',
      {
        method: 'GET',
      },
    )
    const count = await respCount.json()
    if (count.BADGE_COUNT === 0) {
      console.log('no new notification')
      return
    }

    console.log('getting details')
    const resp = await fetch(
      'https://afevent.afreecatv.com/api/notification.php?szWork=getNotifications&szWork=getNotifications&nPageNo=1',
      {
        method: 'GET',
      },
    )
    const data = await resp.json()

    let latestSeq =
      (await ubrowser.storage.local.get('latestSeq'))?.latestSeq || 0
    console.log(`last notified seq: ${latestSeq}`)

    const ops = data.DATA.reverse()
      .map((d) => {
        if (d.FROM_ID === 'afnotice' || d.SEQ <= latestSeq) {
          return null
        }
        switch (d.NOTI_TYPE) {
          case NotificationTypes.LiveStart:
            latestSeq = d.SEQ
            return () => {
              console.log(
                `notifying live start ${d.SEQ} ${d.FROM_ID} ${d.COMMON_NO}`,
              )
              return ubrowser.notifications.create(
                `${d.SEQ}/${d.FROM_ID}/${d.COMMON_NO}/live`,
                {
                  type: 'basic',
                  title: `📢${d.FROM_NICKNAME} is live!`,
                  message: d.HEAD_TEXT,
                  iconUrl: `https://stimg.afreecatv.com/LOGO/${d.FROM_ID.slice(0, 2)}/${d.FROM_ID}/m/${d.FROM_ID}.webp`,
                },
              )
            }
          case NotificationTypes.NewPost:
            latestSeq = d.SEQ
            return () => {
              console.log(
                `notifying new post ${d.SEQ} ${d.FROM_ID} ${d.COMMON_NO}`,
              )
              return ubrowser.notifications.create(
                `${d.SEQ}/${d.FROM_ID}/${d.COMMON_NO}/post`,
                {
                  type: 'basic',
                  title: `📝${d.FROM_NICKNAME} has new post!`,
                  message: d.HEAD_TEXT,
                  iconUrl: `https://stimg.afreecatv.com/LOGO/${d.FROM_ID.slice(0, 2)}/${d.FROM_ID}/m/${d.FROM_ID}.webp`,
                },
              )
            }
          default:
            console.log(
              `unknown notification type ${d.NOTI_TYPE} ${d.SEQ} ${d.FROM_ID} ${d.COMMON_NO}`,
            )
            return null
        }
      })
      .filter((p) => p)
    console.log(ops)
    for (const o of ops) {
      await o()
    }
    ubrowser.storage.local.set({ latestSeq })
  } catch (err) {
    console.error(err)
  }
}

console.log('register')
ubrowser.alarms.create('poll_notification', {
  delayInMinutes: 0,
  periodInMinutes: 1,
})

checkNotifications()
ubrowser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'poll_notification') {
    checkNotifications()
  }
})

ubrowser.notifications.onClicked.addListener((id) => {
  const args = id.split('/')
  switch (args[3]) {
    case 'live': {
      const url = `https://play.afreecatv.com/${args[1]}/${args[2]}`
      console.log(`opening ${url}`)
      ubrowser.tabs.create({ url })
      break
    }
    case 'post': {
      const url = `https://bj.afreecatv.com/${args[1]}/post/${args[2]}`
      ubrowser.tabs.create({ url })
      break
    }
  }
})
