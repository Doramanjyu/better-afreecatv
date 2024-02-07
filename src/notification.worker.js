const ubrowser = chrome || browser

const checkNotifications = async () => {
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
        if (
          d.READ_FLAG === '1' ||
          d.FROM_ID === 'afnotice' ||
          d.NOTI_TYPE !== 'F01' ||
          d.SEQ <= latestSeq
        ) {
          return null
        }
        latestSeq = d.SEQ
        return () => {
          console.log(`notifying ${d.SEQ} ${d.FROM_ID} ${d.COMMON_NO}`)
          return ubrowser.notifications.create(
            `${d.SEQ}/${d.FROM_ID}/${d.COMMON_NO}`,
            {
              type: 'basic',
              title: `${d.FROM_NICKNAME}: ${d.FROM_ID}`,
              message: d.HEAD_TEXT,
              iconUrl: `https://stimg.afreecatv.com/LOGO/${d.FROM_ID.slice(0, 2)}/${d.FROM_ID}/m/${d.FROM_ID}.webp`,
            },
          )
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

console.log('register')
ubrowser.alarms.create('poll_notification', {
  delayInMinutes: 0,
  periodInMinutes: 1,
})

ubrowser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'poll_notification') {
    checkNotifications()
  }
})

ubrowser.notifications.onClicked.addListener((id) => {
  const args = id.split('/')
  const url = `https://play.afreecatv.com/${args[1]}/${args[2]}`
  console.log(`opening ${url}`)
  ubrowser.tabs.create({ url })
})
