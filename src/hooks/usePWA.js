import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Real-time notification service using Service Worker
export const useNotificationService = () => {
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const notificationsSupported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(notificationsSupported);

    if (notificationsSupported) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const sendNotification = async (title, options = {}) => {
    if (!isSupported || notificationPermission !== 'granted') {
      console.log('Cannot send notification');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const subscribeToPushNotifications = async () => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_PUBLIC_VAPID_KEY
      });
      
      // Send subscription to backend
      // await fetch('/api/subscribe-to-notifications', {
      //   method: 'POST',
      //   body: JSON.stringify(subscription),
      //   headers: { 'Content-Type': 'application/json' }
      // });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  };

  return {
    isSupported,
    notificationPermission,
    requestPermission,
    sendNotification,
    subscribeToPushNotifications
  };
};

// Real-time updates hook using WebSocket simulation
export const useRealtimeUpdates = () => {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    // In production, connect to actual WebSocket server
    // const ws = new WebSocket('wss://api.cherrydance.com/realtime');
    
    // Simulate real-time data updates
    const interval = setInterval(() => {
      // Update attendance
      setAttendance(prev => [...prev].slice(-10));
      
      // Update revenue
      setRevenue(prev => prev + Math.random() * 50);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    attendance,
    students,
    revenue
  };
};

// Service Worker registration and update handling
export const useServiceWorkerUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        setRegistration(reg);

        // Check for updates periodically
        setInterval(() => {
          reg.update();
        }, 60000); // Check every minute

        // Listen for new service worker
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, []);

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    updateAvailable,
    updateServiceWorker,
    registration
  };
};

// PWA install prompt handling
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  return {
    showInstallPrompt,
    isInstalled,
    installApp,
    deferredPrompt
  };
};

// Dark mode preference handler
export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    const savedMode = localStorage.getItem('dark-mode');
    if (savedMode !== null) return JSON.parse(savedMode);
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('dark-mode', JSON.stringify(isDarkMode));
    
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return { isDarkMode, toggleDarkMode };
};

// Session storage for offline form data
export const useOfflineFormStorage = (formKey) => {
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem(`form-${formKey}`);
    return saved ? JSON.parse(saved) : null;
  });

  const saveFormData = (data) => {
    sessionStorage.setItem(`form-${formKey}`, JSON.stringify(data));
    setFormData(data);
  };

  const clearFormData = () => {
    sessionStorage.removeItem(`form-${formKey}`);
    setFormData(null);
  };

  return { formData, saveFormData, clearFormData };
};
