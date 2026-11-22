import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import UpdatePassword from './pages/common/UpdatePassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStores from './pages/admin/AdminStores';
import UserStores from './pages/user/UserStores';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import { homePathFor } from './utils/validators';

function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/stores" element={<AdminStores />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['USER']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/user/stores" element={<UserStores />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['STORE_OWNER']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/password" element={<UpdatePassword />} />
        </Route>
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
