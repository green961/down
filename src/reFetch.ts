import fsp from 'fs/promises'
import path from 'path'
import config from './config'
import { mk } from './util'
;(async function () {
  const { source } = config

  let categorys = await fsp.readdir(source)

  let needFetchAgain: { currentDir: string; category: string }[] = []
  for (let i = 0; i < categorys.length; i++) {
    const category = categorys[i]
    let currentDir = path.resolve(source, category)
    let ee = await fsp.readdir(currentDir)
    if (ee.length < 2) {
      needFetchAgain.push({ currentDir, category })
    }
  }

  console.log(`total ${needFetchAgain.length}`)
  let destinationPath = path.resolve(config.out, 'again')
  await mk(destinationPath)

  await Promise.all(
    needFetchAgain.map(async ({ currentDir, category }) =>
      fsp.rename(currentDir, path.resolve(destinationPath, category))
    )
  )
})()
