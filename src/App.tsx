import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Login } from './pages/Login';
import { NewOrder } from './pages/NewOrder';
import { Clients } from './pages/Clients';
import { Items } from './pages/Items';
import { Categories } from './pages/Categories';
import { OrderHistory } from './pages/OrderHistory';
import { ClientLedger } from './pages/ClientLedger';
import { Payments } from './pages/Payments';
import { Toaster } from 'sonner';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link to={to} className={isActive ? 'text-blue-600 font-medium' : 'text-blue-600'}>
      {children}
    </Link>
  );
}

function AppContent() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setLoggedIn(true);
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3 flex gap-4 items-center flex-wrap">
        <Link to="/" className="font-bold text-xl">Warehouse</Link>
        <NavLink to="/">New Order</NavLink>
        <NavLink to="/clients">Clients</NavLink>
        <NavLink to="/items">Items</NavLink>
        <NavLink to="/categories">Categories</NavLink>
        <NavLink to="/orders">Orders</NavLink>
        <NavLink to="/payments">Payments</NavLink>
        <button onClick={handleLogout} className="ml-auto text-red-600 hover:underline">Logout</button>
      </nav>

      <Routes>
        <Route path="/" element={<NewOrder />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/items" element={<Items />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/ledger/:id" element={<ClientLedger />} />
        <Route path="/payments" element={<Payments />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AppContent />
    </BrowserRouter>
  );
}