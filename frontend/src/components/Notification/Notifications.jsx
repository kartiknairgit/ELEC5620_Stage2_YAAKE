import React, { useEffect, useState } from 'react';
import { subscribeNotifications } from '../../services/notification.service';

const Toast = ({ n, onClose }) => {
  const bg = n.type === 'success' ? 'bg-green-600' : n.type === 'error' ? 'bg-red-600' : 'bg-gray-800';
  useEffect(() => {
    const t = setTimeout(() => onClose(n.id), n.timeout || 4000);
    return () => clearTimeout(t);
  }, [n, onClose]);

  return (
    <div className={`text-white ${bg} rounded shadow px-4 py-2 mb-2 max-w-xs`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm">{n.message}</div>
        <button onClick={() => onClose(n.id)} className="ml-2 opacity-90 hover:opacity-100">✕</button>
      </div>
    </div>
  );
};

const Notifications = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = subscribeNotifications((n) => {
      setItems(prev => [n, ...prev]);
    });
    return () => unsub();
  }, []);

  const handleClose = (id) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {items.map(n => <Toast key={n.id} n={n} onClose={handleClose} />)}
    </div>
  );
};

export default Notifications;
