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
    'https://api.m.sooplive.co.kr/noti/*',
    'https://play.sooplive.co.kr/*',
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
    const resp = await fetch('https://api.m.sooplive.co.kr/noti/a/list', {
      method: 'GET',
    })
    const data = await resp.json()

    let latestSeq =
      (await ubrowser.storage.local.get('latestSeq'))?.latestSeq || 0
    console.log(`last notified seq: ${latestSeq}`)

    const ops = data.data
      .reverse()
      .map((d) => {
        if (
          d.read_flag === '1' ||
          d.from_id === 'afnotice' ||
          d.seq <= latestSeq
        ) {
          return null
        }
        switch (d.noti_type) {
          case NotificationTypes.LiveStart:
            latestSeq = d.SEQ
            return () => {
              console.log(
                `notifying live start ${d.seq} ${d.from_id} ${d.common_no}`,
              )
              return ubrowser.notifications.create(
                `${d.seq}/${d.from_id}/${d.common_no}/live`,
                {
                  type: 'basic',
                  title: `📢${d.from_nickname} is live!`,
                  message: d.head_text,
                  iconUrl: `https://stimg.sooplive.co.kr/LOGO/${d.from_id.slice(0, 2)}/${d.from_id}/m/${d.from_id}.webp`,
                },
              )
            }
          case NotificationTypes.NewPost:
            latestSeq = d.seq
            return () => {
              console.log(
                `notifying new post ${d.seq} ${d.from_id} ${d.common_no}`,
              )
              return ubrowser.notifications.create(
                `${d.seq}/${d.from_id}/${d.common_no}/post`,
                {
                  type: 'basic',
                  title: `📝${d.from_nickname} has new post!`,
                  message: d.head_text,
                  iconUrl: `https://stimg.sooplive.co.kr/LOGO/${d.from_id.slice(0, 2)}/${d.from_id}/m/${d.from_id}.webp`,
                },
              )
            }
          case NotificationTypes.Reply:
            latestSeq = d.seq
            return () => {
              console.log(
                `notifying reply ${d.seq} ${d.from_id} ${d.common_no}`,
              )
              return ubrowser.notifications.create(
                `${d.seq}/${d.from_id}/${d.common_no}/reply/${d.sub_common_no}`,
                {
                  type: 'basic',
                  title: `💬${d.from_nickname} replied!`,
                  message: d.head_text,
                  iconUrl: `https://stimg.sooplive.co.kr/LOGO/${d.from_id.slice(0, 2)}/${d.from_id}/m/${d.from_id}.webp`,
                },
              )
            }
          default:
            console.log(
              `unknown notification type ${d.noti_type} ${d.seq} ${d.from_id} ${d.common_no}`,
            )
            return null
        }
      })
      .filter((p) => p)
    for (const o of ops) {
      await o()
    }
    ubrowser.storage.local.set({ latestSeq })
  } catch (err) {
    console.error(err)
  }
}

const alarmHandler = (alarm) => {
  if (alarm.name === alarmName) {
    checkNotifications()
  }
}

const notificationClickHandler = (id) => {
  const args = id.split('/')
  switch (args[3]) {
    case 'live': {
      const url = `https://play.sooplive.co.kr/${args[1]}/${args[2]}`
      console.log(`opening ${url}`)
      ubrowser.tabs.create({ url })
      break
    }
    case 'post': {
      const url = `https://ch.sooplive.co.kr/${args[1]}/post/${args[2]}`
      console.log(`opening ${url}`)
      ubrowser.tabs.create({ url })
      break
    }
    case 'reply': {
      const url = `https://ch.sooplive.co.kr/${args[1]}/post/${args[2]}#reply_noti${args[4]}`
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
