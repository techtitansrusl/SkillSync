import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Header, ChangePasswordModal } from './components/UI';
import { NotificationPanel } from './components/NotificationPanel';
import { AuthPage } from './pages/Auth';
import { ApplicantDashboard } from './pages/ApplicantDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { api } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Check local storage for session simulation
  useEffect(() => {
    const storedUser = localStorage.getItem('skillSyncUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem('skillSyncUser', JSON.stringify(user));
    localStorage.setItem('skillSyncToken', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('skillSyncUser');
    localStorage.removeItem('skillSyncToken');
  };

  const handlePasswordChange = async (oldPass: string, newPass: string) => {
    await api.auth.changePassword({ oldPassword: oldPass, newPassword: newPass });
    alert("Password updated successfully!");
  };

  return (
    <div className="min-h-screen bg-bg-offwhite flex flex-col font-sans text-gray-800">

      {user && (
        <Header
          user={user}
          onLogout={handleLogout}
          onChangePassword={() => setShowChangePasswordModal(true)}
          notificationNode={<NotificationPanel />}
        />
      )}

      <main className="flex-grow">
        {!user ? (
          <AuthPage onLogin={handleLogin} />
        ) : user.role === UserRole.RECRUITER ? (
          <RecruiterDashboard user={user} />
        ) : (
          <ApplicantDashboard user={user} />
        )}
      </main>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onConfirm={handlePasswordChange}
      />

      <footer className="bg-gray-100 py-6 text-center text-gray-500 text-sm mt-auto">
        <p>&copy; 2025 SkillSync. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;