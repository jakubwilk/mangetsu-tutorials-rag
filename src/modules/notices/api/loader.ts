import fs from 'fs/promises'
import path from 'path'

import type { Notice } from '../types'

export async function loadNotices(): Promise<Notice[]> {
  const filePath = path.join(process.cwd(), 'docs', 'notices.json')
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw) as Notice[]
}
