import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import config from './config'
import { download_one_file, handle_html } from './request.js'
import { HREF_SIZE, INFO_MAP, NamePage } from './types.js'
import { mk, sleep } from './util.js'

let starDir = ''
export async function main(cc: NamePage) {
  let { name: starName, page } = cc

  let urlName = starName.split(' ').filter(Boolean).join('+')
  starDir = path.resolve(config.out, starName)
  await mk(starDir)

  let items = new Set()
  let isLastPage = false
  let i = page || 1
  do {
    let url = `${config.baseUrl}/search/${urlName}/${i}/`
    console.log(`get ${url}`)

    let $ = await handle_html(url)

    if ($('li.last').length === 0) {
      isLastPage = true
    }

    let trs = $('tbody tr')
    let result: INFO_MAP = new Map()
    for (let i = 0; i < trs.length; i++) {
      const $element = $(trs[i])
      const collName = $element.find('.name a:nth-child(2)')
      const title = collName.text().replace('...', '')

      const file_size = $element
        .find('.coll-4.size')
        .contents()
        .filter(function () {
          return this.nodeType === 3
        })
        .text()

      if (!config.resolution.test(title)) {
        continue
      }

      const href = config.baseUrl + collName.attr().href
      if (!items.has(title)) {
        items.add(title)
        result.set(title, { href, file_size })
      } else {
        console.log(`${title} already exist`)
      }
    }

    console.log(`${url} has ${result.size} items.`)
    const cObj = await getDetails(result)
    i++
  } while (!isLastPage)

  console.log(`total ${items.size}`)
}

async function getDetails(myMap: INFO_MAP) {
  let arr = Array.from(myMap)

  let concurrencies = 2
  let cc = []
  for (let i = 0; i < arr.length; i += concurrencies) {
    const tt = arr.slice(i, i + concurrencies)
    cc.push(...(await executeTasks(tt)))
    await sleep(1000)
  }
  return cc
}

async function executeTasks(tt: [string, HREF_SIZE][]) {
  return await Promise.all(
    tt.map(async ([title, { href: url, file_size }], i: number) => {
      const rr = path.resolve(starDir, title)
      await mk(rr)

      let $ = await handle_html(url)

      let magnet = $('div.clearfix').eq(2).find('li a').eq(0).attr().href

      let cObj = { title, url, file_size, magnet }
      await fsp.writeFile(path.resolve(rr, 'info.json'), JSON.stringify(cObj, null, 4))

      let imageUrls = $('.js-modal-url')
        .map((_, e) => $(e).attr('href'))
        .get()
        .filter((e) => e.startsWith(config.pacific_prefix))

      if (imageUrls.length) {
        await Promise.all(
          imageUrls.map(async (url, i) => {
            let $ = await handle_html(url)
            let src = $('.fimg.full_img').attr().src
            let file_name = path.basename(src)

            const file_path = path.resolve(rr, file_name)
            if (fs.existsSync(file_path)) {
            } else {
              await download_one_file(src, file_path)
            }
          })
        )
      } else {
        imageUrls = $('img.lazy')
          .map((_, e) => $(e).attr('data-original'))
          .get()
          .filter((e) => e.startsWith(config.pacific_prefix))
        if (imageUrls.length) {
          await Promise.all(
            imageUrls.map(async (url, i) => {
              let file_name = path.basename(url)

              const file_path = path.resolve(rr, file_name)
              if (fs.existsSync(file_path)) {
              } else {
                await download_one_file(url, file_path)
              }
            })
          )
        } else {
          let src = ''

          try {
            let fourUrls = $('a.js-modal-url')

            if (fourUrls.length) {
              let allInOne = fourUrls.eq(fourUrls.length - 1).attr().href
              if (['.jpg', '.jpeg'].includes(path.extname(allInOne))) {
                src = allInOne
              } else if (allInOne.startsWith(config.baseUrlUser)) {
                src = $('img.lazy')
                  .map((_, e) => $(e).attr('data-original'))
                  .get()[0]
              } else {
                let $2 = await handle_html(allInOne)
                src = $2('center a img').attr()?.src
                if (!src || src.endsWith('logo.gif')) {
                  src = $2('#image-viewer-container img').attr()?.src.replace('.md.', '.')
                }
              }
            } else {
              src = $('img.lazy')
                .map((_, e) => $(e).attr('data-original'))
                .get()[0]
            }
          } catch (error) {
            console.log('center a img failed', url)
            return
          }

          const file_name = path.basename(src)
          const file_path = path.resolve(rr, file_name)

          if (fs.existsSync(file_path)) {
          } else {
            await download_one_file(src, file_path)
          }
        }
      }
    })
  )
}
