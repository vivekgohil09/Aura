import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getJwtToken } from './getJwt';

class StompService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map(); // chatId -> subscription object
    this.listeners = new Set(); // connection status listeners
    this.reconnectAttempts = 0;
  }

  connect(onConnected, onError) {
    if (this.client && this.client.active) {
      if (onConnected) onConnected();
      return;
    }

    const token = getJwtToken();
    const getWsBackendUrl = () => {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return '/ws';
      }
      return 'https://aura-vdcq.onrender.com/ws';
    };

    this.client = new Client({
      webSocketFactory: () => new SockJS(getWsBackendUrl()),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      debug: (str) => {
        // Disabled verbose debugging in production
      },
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: (frame) => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.notifyListeners(true);
        if (onConnected) onConnected(frame);

        // Resubscribe active chats on reconnect
        this.subscriptions.forEach((sub, chatId) => {
          this._createSubscription(chatId, sub.callback);
        });
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message'], frame.body);
        this.connected = false;
        this.notifyListeners(false);
        if (onError) onError(frame);
      },
      onWebSocketClose: () => {
        this.connected = false;
        this.notifyListeners(false);
      },
    });

    this.client.activate();
  }

  addConnectionListener(callback) {
    this.listeners.add(callback);
    callback(this.connected);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(status) {
    this.listeners.forEach((listener) => listener(status));
  }

  subscribeToConversation(chatId, onMessageReceived) {
    if (!chatId) return null;

    const destination = `/topic/conversations/${chatId}`;

    // Remove existing subscription if any
    if (this.subscriptions.has(chatId)) {
      const existing = this.subscriptions.get(chatId);
      if (existing && existing.sub) {
        try { existing.sub.unsubscribe(); } catch (e) {}
      }
    }

    const subObj = { callback: onMessageReceived, sub: null };
    this.subscriptions.set(chatId, subObj);

    if (this.client && this.client.connected) {
      this._createSubscription(chatId, onMessageReceived);
    }

    return () => {
      this.unsubscribeFromConversation(chatId);
    };
  }

  _createSubscription(chatId, callback) {
    if (!this.client || !this.client.connected) return;
    const destination = `/topic/conversations/${chatId}`;

    const sub = this.client.subscribe(destination, (message) => {
      try {
        const parsed = JSON.parse(message.body);
        callback(parsed);
      } catch (err) {
        console.error('Error parsing STOMP message body:', err);
      }
    });

    if (this.subscriptions.has(chatId)) {
      this.subscriptions.get(chatId).sub = sub;
    }
  }

  unsubscribeFromConversation(chatId) {
    if (this.subscriptions.has(chatId)) {
      const entry = this.subscriptions.get(chatId);
      if (entry && entry.sub) {
        try { entry.sub.unsubscribe(); } catch (e) {}
      }
      this.subscriptions.delete(chatId);
    }
  }

  sendMessage(chatId, content, clientMessageId = null) {
    if (!this.client || !this.client.connected) {
      throw new Error('WebSocket is not connected');
    }

    const payload = {
      chatId,
      content,
      clientMessageId: clientMessageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    });

    return payload.clientMessageId;
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.subscriptions.clear();
      this.notifyListeners(false);
    }
  }
}

export const stompService = new StompService();
