/**
 * AURA Auto-Permission & Web Audio Pre-warming Manager
 * Automatically requests and caches Browser Notifications, AudioContext unlocking,
 * and Microphone/Camera pre-authorization so users experience zero friction.
 */

class AutoPermissionManager {
  constructor() {
    this.audioContext = null;
    this.isAudioUnlocked = false;
    this.isMediaPrewarmed = false;
  }

  /**
   * Initializes auto-permissions on app startup / chat page mount.
   */
  init() {
    if (typeof window === 'undefined') return;

    // 1. Auto-request Browser Notification Permission immediately
    this.autoRequestNotification();

    // 2. Unlock AudioContext & Pre-warm permissions on the very first user interaction
    const unlockHandler = () => {
      this.unlockAudioContext();
      this.prewarmMediaPermissions();
      // Remove listeners once unlocked
      ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(evt => {
        window.removeEventListener(evt, unlockHandler, { capture: true });
      });
    };

    ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(evt => {
      window.addEventListener(evt, unlockHandler, { capture: true, once: true });
    });
  }

  /**
   * Proactively request notification permission without waiting for manual action.
   */
  async autoRequestNotification() {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            console.log('🔔 Notifications auto-granted!');
          }
        }
      }
    } catch (e) {
      console.warn('Auto notification request bypassed:', e?.message || e);
    }
  }

  /**
   * Unlocks Web Audio API AudioContext to bypass browser autoplay restrictions
   * for incoming call ringtones and message beeps.
   */
  unlockAudioContext() {
    if (this.isAudioUnlocked) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        // Play silent 0.001s buffer to guarantee full browser audio unlock
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);

        this.isAudioUnlocked = true;
        window.__auraAudioContext = this.audioContext;
      }
    } catch (e) {
      console.warn('AudioContext unlock bypassed:', e?.message || e);
    }
  }

  /**
   * Pre-warms Microphone & Camera permissions proactively so when a call or voice note begins,
   * the browser does not pause or block to ask for permissions.
   */
  async prewarmMediaPermissions() {
    if (this.isMediaPrewarmed) return;
    if (!navigator?.mediaDevices?.getUserMedia) return;

    try {
      // Check if permission is already granted via Permissions API
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const micStatus = await navigator.permissions.query({ name: 'microphone' });
          if (micStatus.state === 'granted') {
            this.isMediaPrewarmed = true;
            return;
          }
        } catch (e) {}
      }

      // Proactively request brief audio stream to trigger "Always Allow" in browser
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stream) {
        // Immediately release tracks so recording light turns off
        stream.getTracks().forEach(track => track.stop());
        this.isMediaPrewarmed = true;
        localStorage.setItem('aura_media_permissions', 'granted');
        console.log('🎤 Microphone permissions pre-authorized permanently!');
      }
    } catch (e) {
      // User declined or dismissed — will prompt on actual call click
      console.warn('Pre-warm mic check skipped:', e?.message || e);
    }
  }

  /**
   * Sends a rich native OS notification if allowed.
   */
  notify(title, options = {}) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          ...options
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return notif;
      }
    } catch (e) {}
    return null;
  }
}

export const autoPermissions = new AutoPermissionManager();
