import  Navbar  from '../components/navbar';
import PageTitle from '../components/pageTitle';
import Sidebar from '../components/sidebar';
import "./globals.css";

export default function MainLayout({ children }) {
  const pageTitle = "Dashboard";
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SparrowX - {pageTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap"></link>
      </head>
      <body>
        <header className="p-6 fixed top-0 right-0 left-0">
          <Navbar/>
        </header>
        
        <div className="flex flex-row h-screen">
          <main className="w-3/4 p-6 bg-gray-900 overflow-y-auto">
            <PageTitle title={pageTitle}/>
            {children}
          </main>

          <aside className="w-1/4 p-6 border-l border-emerald-700 overflow-y-auto">
            <Sidebar/>
          </aside>
        </div>
      </body>
    </html>
  )
}