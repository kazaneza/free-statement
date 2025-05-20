import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterForm from './pages/RegisterForm';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import IssuedHistory from './pages/IssuedHistory';
import logo from './images/bk-logo.png';

function App() {
  return (
    <AuthProvider>
      <Provider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="register" element={<RegisterForm />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="/issued-history" element={<IssuedHistory />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </Provider>
    </AuthProvider>
  );
}

export default App;