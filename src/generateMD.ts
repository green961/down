import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import config from './config'
import { INFO } from './types'
import { mk } from './util'

const info = 'info.json'

;(async function () {
  let categorys = await fsp.readdir(config.source)

  let page = 20
  const out = 'mdd'
  await mk(out)

  let count = 0
  for (let i = 0; i < categorys.length; i += page) {
    const tt = categorys.slice(i, i + page)

    count++
    let pp = path.resolve(out, `page${count}.md`)
    let result = []
    for (let j = 0; j < tt.length; j++) {
      const category = tt[j]
      let currentDir = path.resolve(config.source, category)
      let allFiles = await fsp.readdir(currentDir)

      let images = allFiles.filter((e) => e !== info)

      images = await Promise.all(
        images.map(async (e) => {
          let eChange = ''
          let dst = path.resolve(out, e)
          if (fs.existsSync(dst)) {
            let base = path.basename(e)
            let ext = path.extname(e)
            eChange = `${path.basename(base, ext)}_${Math.floor(Math.random() * 1000000)}${ext}`
            console.log(`change ${e} ==> ${eChange}`)
            dst = path.resolve(out, eChange)
          }
          await fsp.copyFile(path.resolve(currentDir, e), dst)
          return eChange || e
        })
      )

      let { file_size, magnet, title } = JSON.parse(
        await fsp.readFile(path.resolve(currentDir, info), 'utf-8')
      ) as INFO
      let replace = config.resolution.exec(title)[0]
      title = title.replace(replace, `\`${replace}\``)
      title = `### ${title}`

      file_size = `### 视频大小：\`${file_size}\``
      let cc = images.map((e) => `![示例图片](${e})`).join('\n')
      result.push([title, file_size, magnet, cc].join('\n'))
    }
    await fsp.writeFile(pp, result.join('\n***\n'))
  }
})()
