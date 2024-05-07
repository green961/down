import axios, { AxiosRequestConfig } from 'axios'
import cheerio from 'cheerio'
import { sleep } from './util'

import axiosRetry from 'axios-retry'
import fs from 'fs'
import { HttpsProxyAgent } from 'https-proxy-agent'

const httpAgent = new HttpsProxyAgent('http://127.0.0.1:10809')
const base: AxiosRequestConfig = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  },
  httpsAgent: httpAgent,
}

export const requests = axios.create(base)

export async function handle_html(url: string, wait = true) {
  if (wait) await sleep(Math.floor(Math.random() * 100) + 200)

  try {
    const resp = await requests.get(url)
    return cheerio.load(resp.data)
  } catch (error) {
    console.log(`handle_html ${url} failed`)
  }
}

export async function getRetry(config: AxiosRequestConfig) {
  await sleep(Math.floor(Math.random() * 100) + 200)
  const instance = axios.create()

  axiosRetry(instance, { retries: 2 })

  return await instance(config)
}

export async function download_one_file(url: string, file_path: string) {
  try {
    let ee = await getRetry({
      ...base,
      method: 'get',
      url: url,
      timeout: 5000,
      responseType: 'stream', // 设置响应数据类型为流
    })

    ee.data.pipe(fs.createWriteStream(file_path))
  } catch (error) {
    console.log(`download_one_file failed`, url)
  }
}
