import fsp from 'fs/promises'

export function string_to_int(s: string) {
  if (s.endsWith('万')) {
    return +s.slice(0, s.length - 1) * 10_000
  } else {
    return +s
  }
}

export async function sleep(n) {
  await new Promise((r) => setTimeout(r, n))
}

export function randInt() {
  return Math.floor(Math.random() * 100) + 200
}

export async function mk(p: string) {
  await fsp.mkdir(p, { recursive: true })
}
