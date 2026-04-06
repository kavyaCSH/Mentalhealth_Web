import { UserService } from '../api/services/user.service';

/**
 * Manages browser push notification registration and permission lifecycle
 */
export const PushNotificationManager = {
    /**
     * Request browser permissions and register service worker
     */
    async register() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push messaging is not supported in this browser');
            return false;
        }

        try {
            // Register SW from public folder
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            // Check current permission
            let permission = Notification.permission;
            
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }

            if (permission !== 'granted') {
                return false;
            }

            // In a real environment, we'd use a VAPID public key
            // For now, we'll simulate the subscription check logic
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                // If already subscribed, update the backend token
                await this.syncWithBackend(subscription);
            } else {
                // Need to create new subscription
                // NOTE: Using a placeholder VAPID key for demonstration parity
                const vapidPublicKey = 'BEl62i_SJnu79InPpH986l1N5601vE8mADe9w8u_S-81S-81S-81S-81S-81S';
                
                try {
                    const newSubscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
                    });
                    await this.syncWithBackend(newSubscription);
                } catch (e) {
                    console.log('Push subscription failed (VAPID key required for production)');
                }
            }

            return true;
        } catch (error) {
            console.error('Service worker registration failed:', error);
            return false;
        }
    },

    /**
     * Helper to sync the subscription object to our user database
     */
    async syncWithBackend(subscription: any) {
        try {
            const token = JSON.stringify(subscription);
            await UserService.updateMyProfile({ pushToken: token });
            console.log('Push notification channel synchronized with MindBalance servers');
        } catch (error) {
            console.error('Failed to sync push token with backend:', error);
        }
    },

    /**
     * Utility to convert VAPID base64 string to Uint8Array
     */
    urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
};
