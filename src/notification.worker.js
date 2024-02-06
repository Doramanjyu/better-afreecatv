self.addEventListener('activate', (e) => {
  console.log(e)
  setInterval(() => {
    console.log('worker polling')
    if (Notification.permission !== 'granted') {
      return
    }
    const notice = new Notification("Hi there!")
  }, 5000)
})
