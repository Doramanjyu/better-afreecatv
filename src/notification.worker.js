const ubrowser = chrome || browser

const alarmName = 'poll_notification'
const NotificationTypes = Object.freeze({
  LiveStart: 'F01',
  NewPost: 'F02',
  Reply: 'A04',
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
    console.log('getting notifications')
    const resp = await fetch(
      'https://afevent.afreecatv.com/api/notification.php?szWork=getNotifications&szWork=getNotifications&nPageNo=1',
      {
        method: 'GET',
      },
    )
    const data = await resp.json()

    let latestSeq =
      (await ubrowser.storage.local.get('latestSeq'))?.latestSeq || 0
    latestSeq = 7004958363
    console.log(`last notified seq: ${latestSeq}`)

    const ops = data.DATA.reverse()
      .map((d) => {
        if (
          d.READ_FLAG === '1' ||
          d.FROM_ID === 'afnotice' ||
          d.SEQ <= latestSeq
        ) {
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
          case NotificationTypes.Reply:
            latestSeq = d.SEQ
            return () => {
              console.log(
                `notifying reply ${d.SEQ} ${d.FROM_ID} ${d.COMMON_NO}`,
              )
              return ubrowser.notifications.create(
                `${d.SEQ}/${d.FROM_ID}/${d.COMMON_NO}/reply/${d.SUB_COMMON_NO}`,
                {
                  type: 'basic',
                  title: `💬${d.FROM_NICKNAME} replied!`,
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

const alarmHandler = (alarm) => {
  console.log("alarm", alarm)
  if (alarm.name === alarmName) {
    checkNotifications()
  }
}

const notificationClickHandler = (id) => {
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
      console.log(`opening ${url}`)
      ubrowser.tabs.create({ url })
      break
    }
    case 'reply': {
      const url = `https://bj.afreecatv.com/${args[1]}/post/${args[2]}#reply_noti${args[4]}`
      console.log(`opening ${url}`)
      ubrowser.tabs.create({ url })
      break
    }
  }
}

console.log('registering notification poller')

ubrowser.alarms.create(alarmName, {
  delayInMinutes: 0,
  periodInMinutes: 1,
})
ubrowser.alarms.onAlarm.addListener(alarmHandler)
ubrowser.notifications.onClicked.addListener(notificationClickHandler)

ubrowser.runtime.onStartup.addListener(() => {
  console.log('browser started')
  checkNotifications()
})
