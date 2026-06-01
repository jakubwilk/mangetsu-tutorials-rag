import Topbar from './Topbar'

interface AppLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  docsPanel: React.ReactNode
}

export default function AppLayout({ children, sidebar, docsPanel }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <main className="flex-1 overflow-auto">{children}</main>
        {docsPanel}
      </div>
    </div>
  )
}
