import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { NewOrder } from './pages/NewOrder';
import { Clients } from './pages/Clients';
import { Items } from './pages/Items';
import { OrderHistory } from './pages/OrderHistory';
import { ClientLedger } from './pages/ClientLedger';

function AppContent() {
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

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
      <nav className="bg-white border-b px-4 py-3 flex gap-4 items-center">
        <Link to="/" className="font-bold text-xl">Warehouse</Link>
        <Link to="/" className="text-blue-600">New Order</Link>
        <Link to="/clients" className="text-blue-600">Clients</Link>
        <Link to="/items" className="text-blue-600">Items</Link>
        <Link to="/orders" className="text-blue-600">Orders</Link>
        <button onClick={handleLogout} className="ml-auto text-red-600">Logout</button>
      </nav>

      <Routes>
        <Route path="/" element={<NewOrder />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/items" element={<Items />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/ledger/:id" element={<ClientLedger />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}