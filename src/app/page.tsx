import { ChatSidebar, ChatView } from 'chat'
import { AppLayout, DocsPanel, Topbar } from 'common'
import { readFile } from 'fs/promises'
import path from 'path'

export default async function Home() {
  const docsContent = await readFile(path.join(process.cwd(), 'docs', 'documents-info.md'), 'utf-8')

  return (
    <AppLayout
      topbar={<Topbar />}
      sidebar={<ChatSidebar />}
      sidebarDrawer={<ChatSidebar fluid />}
      docsPanel={<DocsPanel content={docsContent} />}
      docsPanelDrawer={<DocsPanel content={docsContent} fluid />}
    >
      <ChatView />
    </AppLayout>
  )
}
