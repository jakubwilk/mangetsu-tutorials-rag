import { readFile } from 'fs/promises'
import path from 'path'

import ChatView from '@/components/chat/ChatView'
import AppLayout from '@/components/layout/AppLayout'
import ChatSidebar from '@/components/layout/ChatSidebar'
import DocsPanel from '@/components/layout/DocsPanel'

export default async function Home() {
  const docsContent = await readFile(
    path.join(process.cwd(), 'docs', 'documents-info.md'),
    'utf-8'
  )

  return (
    <AppLayout sidebar={<ChatSidebar />} docsPanel={<DocsPanel content={docsContent} />}>
      <ChatView />
    </AppLayout>
  )
}
