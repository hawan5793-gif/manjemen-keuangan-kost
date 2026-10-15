import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Dashboard from '../pages/Dashboard';
import Transactions from '../pages/Transactions';
import Budget from '../pages/Budget';
import Savings from '../pages/Savings';
import Reports from '../pages/Reports';
import Debts from '../pages/Debts';
import Reminders from '../pages/Reminders';
import More from '../pages/More';
import Profile from '../pages/Profile';
import Login from '../pages/Login';
import AuthGuard from '../components/auth/AuthGuard';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'transactions', element: <Transactions /> },
          { path: 'budget', element: <Budget /> },
          { path: 'savings', element: <Savings /> },
          { path: 'reports', element: <Reports /> },
          { path: 'debts', element: <Debts /> },
          { path: 'reminders', element: <Reminders /> },
          { path: 'more', element: <More /> },
          { path: 'profile', element: <Profile /> },
        ],
      },
    ],
  },
]);
