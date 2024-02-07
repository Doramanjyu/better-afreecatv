setInterval(() => {
  console.log('test')

  console.log(Notification.permission)
  if (Notification.permission === 'granted') {
    const notice = new Notification('Hi there!')
    notice.onerror = (e) => console.error(e)
    console.log(notice)
  }
}, 10000)
