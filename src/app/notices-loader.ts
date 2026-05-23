import fs from 'fs/promises'
import path from 'path'

export type NoticeType = 'info' | 'warning'

export interface Notice {
  id: string
  type: NoticeType
  message: string
}

export async function loadNotices(): Promise<Notice[]> {
  const filePath = path.join(process.cwd(), 'docs', 'notices.json')
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw) as Notice[]
}
