export default function Navbar() {
  return (
    <nav className="flex flex-col items-center md:flex-row md:justify-between">
      <a href="/" className="text-2xl text-white font-bold">
        <img src="/logo.png" alt="Logo" className="logo float-start"></img>
        SparrowX
      </a>
      <ul className="flex space-x-4 mt-2">
        <li>
          <a href="/dashboard" className="text-white">Dashboard</a>
        </li>
        <li>
          <a href="/backtester" className="text-white">Backtester</a>
        </li>        
      </ul>
      <ul className="flex space-x-4 mt-2">
        <li className="px-3 py-1 rounded bg-emerald-900 hover:bg-emerald-800 cursor-pointer">
          <a href="/backtester" className="text-white">
            My account <img src="/avatar.png" className="avatar float-end" alt="Profile avatar"/>
          </a>
        </li>
      </ul>
    </nav>
  );
}