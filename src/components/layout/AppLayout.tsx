import Topbar from './Topbar'

interface AppLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  docsPanel: React.ReactNode
}

export default function AppLayout({ children, sidebar, docsPanel }: AppLayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sidebar}
        <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
        {docsPanel}
      </div>
    </div>
  )
}
