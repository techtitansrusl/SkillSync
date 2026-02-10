import React from 'react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-6 py-2 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
    secondary: "bg-secondary text-gray-800 hover:bg-yellow-200 focus:ring-yellow-300 border border-secondary",
    outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    success: "bg-success text-gray-800 hover:bg-green-400 focus:ring-green-400",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        className={`w-full px-4 py-2 bg-gray-200 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// --- Card ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

// --- Badge ---
export const Badge: React.FC<{ status: string }> = ({ status }) => {
  let colorClass = "bg-gray-100 text-gray-800";
  switch (status.toLowerCase()) {
    case 'shortlisted':
      colorClass = "bg-green-100 text-green-800";
      break;
    case 'rejected':
      colorClass = "bg-red-100 text-red-800";
      break;
    case 'screening':
      colorClass = "bg-blue-100 text-blue-800";
      break;
    case 'pending':
      colorClass = "bg-yellow-100 text-yellow-800";
      break;
    case 'active':
      colorClass = "bg-green-100 text-green-800";
      break;
    case 'closed':
      colorClass = "bg-gray-300 text-gray-800";
      break;
  }
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${colorClass}`}>
      {status}
    </span>
  );
};

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">{title}</h3>
                <div className="mt-2">
                  {children}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Header ---
export const Header: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary">
            <i className="fa-solid fa-brain text-xl"></i>
          </div>
          <span className="font-bold text-xl tracking-wide">SKILLSYNC</span>
        </div>
        <nav className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 rounded-full bg-secondary text-primary font-bold flex items-center justify-center border-2 border-white">
                {user.name.charAt(0)}
             </div>
             <span className="hidden md:block font-medium">{user.name}</span>
          </div>
          <button onClick={onLogout} className="text-white hover:text-secondary transition">
            <i className="fa-solid fa-right-from-bracket text-lg"></i>
          </button>
        </nav>
      </div>
    </header>
  );
};