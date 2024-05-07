import { main } from './main'
let stars = []
;(async function () {
  for (let i = 0; i < stars.length; i++) {
    console.time()
    let config = stars[i]
    await main(config)
    console.log('end')
    console.timeEnd()
  }
})()
