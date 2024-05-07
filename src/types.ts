export type NamePage = {
  name: string
  page?: number
}

export type HREF_SIZE = {
  href: string
  file_size: string
}

export type INFO_MAP = Map<string, HREF_SIZE>

export type INFO = {
  title: string
  file_size: string
  magnet: string
}
