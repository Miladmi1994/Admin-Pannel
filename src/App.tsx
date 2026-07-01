/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import Plans from './pages/Plans';
import Users from './pages/Users';
import Finance from './pages/Finance';
import Marketing from './pages/Marketing';
import Admins from './pages/Admins';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('adminToken')
  );

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminTelegramId');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onLogout={handleLogout} />}>
          <Route index element={<Dashboard />} />
          <Route path="servers" element={<Servers />} />
          <Route path="plans" element={<Plans />} />
          <Route path="users" element={<Users />} />
          <Route path="finance" element={<Finance />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="admins" element={<Admins />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
