// Simple notification service (event emitter style)
const listeners = new Set();

export const subscribeNotifications = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const publish = (n) => {
  for (const cb of Array.from(listeners)) {
    try { cb(n); } catch (e) { console.error('Notification listener error', e); }
  }
};

export const notify = ({ type = 'info', message = '', timeout = 4000 } = {}) => {
  publish({ id: Date.now() + Math.random(), type, message, timeout });
};

export const notifySuccess = (message, timeout) => notify({ type: 'success', message, timeout });
export const notifyError = (message, timeout) => notify({ type: 'error', message, timeout });
export const notifyInfo = (message, timeout) => notify({ type: 'info', message, timeout });

const NotificationService = {
  subscribeNotifications,
  notify,
  notifySuccess,
  notifyError,
  notifyInfo
};

export default NotificationService;
