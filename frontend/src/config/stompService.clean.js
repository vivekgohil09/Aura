import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getJwtToken } from './getJwt';

class StompService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.listeners = new Set();
  }

  connect(onConnected, onError) {
    if (this.client?.active) {
      if (this.connected && onConnected) onConnected();
      return;
    }

    const token = getJwtToken();

    this.client = new Client({
      webSocketFactory: () => new SockJS('https://aura-vdcq.onrender.com/ws'),
      connectHeaders: { Authorization: token ? `Bearer ${token}` : '' },
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: (frame) => {
        console.log('STOMP connected');
        this.connected = true;
        this.notifyListeners(true);
        if (onConnected) onConnected(frame);
        this.subscriptions.forEach((entry, chatId) => {
          entry.sub = null;
          this._createSubscription(chatId, entry.callback);
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers?.message);
        console.error('STOMP body:', frame.body);
        this.connected = false;
        this.notifyListeners(false);
        if (onError) onError(frame);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        this.connected = false;
        this.notifyListeners(false);
      },
      onWebSocketClose: () => {
        console.log('WebSocket closed');
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
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('Connection listener error:', error);
      }
    });
  }

  subscribeToConversation(chatId, onMessageReceived) {
    if (!chatId) {
      console.error('chatId is required');
      return null;
    }

    this.unsubscribeFromConversation(chatId);

    const subscriptionData = { callback: onMessageReceived, sub: null };
    this.subscriptions.set(chatId, subscriptionData);

    if (this.client?.connected) this._createSubscription(chatId, onMessageReceived);

    return () => this.unsubscribeFromConversation(chatId);
  }

  _createSubscription(chatId, callback) {
    if (!this.client?.connected) return;

    const destination = `/topic/conversations/${chatId}`;
    console.log('Subscribing to:', destination);

    const sub = this.client.subscribe(destination, (message) => {
      try {
        const parsed = JSON.parse(message.body);
        console.log('Received message:', parsed);
        callback(parsed);
      } catch (error) {
        console.error('Failed to parse STOMP message:', error, message.body);
      }
    });

    const entry = this.subscriptions.get(chatId);
    if (entry) entry.sub = sub;
  }

  unsubscribeFromConversation(chatId) {
    const entry = this.subscriptions.get(chatId);
    if (!entry) return;
    if (entry.sub) {
      try {
        entry.sub.unsubscribe();
      } catch (error) {
        console.error('Failed to unsubscribe:', error);
      }
    }
    this.subscriptions.delete(chatId);
    console.log('Unsubscribed from:', `/topic/conversations/${chatId}`);
  }

  sendMessage(chatId, content, clientMessageId = null) {
    if (!this.client?.connected) throw new Error('WebSocket is not connected');
    if (!chatId) throw new Error('chatId is required');
    if (!content?.trim()) throw new Error('Message content is required');

    const messageId = clientMessageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const payload = { chatId, content: content.trim(), clientMessageId: messageId };

    console.log('Sending message:', payload);

    this.client.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });

    return messageId;
  }

  isConnected() {
    return this.client?.connected === true;
  }

  disconnect() {
    if (!this.client) return;
    console.log('Disconnecting STOMP');
    this.subscriptions.forEach((entry) => {
      if (entry.sub) {
        try {
          entry.sub.unsubscribe();
        } catch (error) {
          console.error(error);
        }
      }
    });
    this.subscriptions.clear();
    this.client.deactivate();
    this.client = null;
    this.connected = false;
    this.notifyListeners(false);
  }
}

export const stompService = new StompService();
