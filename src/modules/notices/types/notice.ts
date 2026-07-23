export type NoticeType = 'info' | 'warning'

export interface Notice {
  id: string
  type: NoticeType
  message: string
}
