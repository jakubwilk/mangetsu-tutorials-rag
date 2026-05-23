import { ChatView } from 'chat'
import { readFile } from 'fs/promises'
import { AppLayout, ChatSidebar, DocsPanel } from 'layout'
import path from 'path'

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
