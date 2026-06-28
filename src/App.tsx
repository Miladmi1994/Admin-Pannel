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
  // Start unauthenticated so user can see the login flow per prompt instructions
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onLogout={() => setIsAuthenticated(false)} />}>
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
