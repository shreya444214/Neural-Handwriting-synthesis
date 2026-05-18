import { useAuth } from '../context/AuthContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

export default function Toast() {
  const { toasts, removeToast } = useAuth();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <Icon size={20} />
            <span style={{ flex: 1, fontSize: '0.9rem' }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
