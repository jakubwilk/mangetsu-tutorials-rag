'use client'

import { Drawer } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

import MobileNavBar from './MobileNavBar'

interface AppLayoutProps {
  children: React.ReactNode
  topbar: React.ReactNode
  sidebar: React.ReactNode
  sidebarDrawer: React.ReactNode
  docsPanel: React.ReactNode
  docsPanelDrawer: React.ReactNode
}

const drawerBodyStyles = {
  body: {
    padding: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
}

export default function AppLayout({
  children,
  topbar,
  sidebar,
  sidebarDrawer,
  docsPanel,
  docsPanelDrawer,
}: AppLayoutProps) {
  const [sidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false)
  const [docsPanelOpened, { open: openDocsPanel, close: closeDocsPanel }] = useDisclosure(false)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {topbar}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden md:contents">{sidebar}</div>
        <main
          className={`flex-1 ${sidebarOpened || docsPanelOpened ? 'overflow-hidden' : 'overflow-auto'}`}
        >
          {children}
        </main>
        <div className="hidden md:contents">{docsPanel}</div>
      </div>

      <MobileNavBar onOpenSidebar={openSidebar} onOpenDocsPanel={openDocsPanel} />

      <Drawer
        opened={sidebarOpened}
        onClose={closeSidebar}
        position="left"
        title="Historia czatów"
        size="xs"
        styles={drawerBodyStyles}
      >
        {sidebarDrawer}
      </Drawer>

      <Drawer
        opened={docsPanelOpened}
        onClose={closeDocsPanel}
        position="right"
        title="Baza wiedzy"
        size="sm"
        styles={drawerBodyStyles}
      >
        {docsPanelDrawer}
      </Drawer>
    </div>
  )
}
