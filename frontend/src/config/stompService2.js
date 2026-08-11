import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getJwtToken } from './getJwt';

class StompService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map(); // conversation subscriptions (keyed by chatId)
    this.topicSubscriptions = new Map(); // generic topic subscriptions (keyed by topic)
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

        // restore conversation subscriptions
        this.subscriptions.forEach((entry, chatId) => {
          entry.sub = null;
          this._createSubscription(chatId, entry.callback);
        });

        // restore topic subscriptions
        this.topicSubscriptions.forEach((entry, topic) => {
          entry.sub = null;
          this._createTopicSubscription(topic, entry.callback);
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

  // Conversation-level subscription
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
        // console.log('Received message:', parsed);
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

  // Generic topic subscribe/unsubscribe helpers
  subscribeToTopic(topic, callback) {
    if (!topic) return null;
    this.unsubscribeFromTopic(topic);
    const entry = { callback, sub: null };
    this.topicSubscriptions.set(topic, entry);
    if (this.client?.connected) this._createTopicSubscription(topic, callback);
    return () => this.unsubscribeFromTopic(topic);
  }

  _createTopicSubscription(topic, callback) {
    if (!this.client?.connected) return;
    console.log('Subscribing to topic:', topic);
    const sub = this.client.subscribe(topic, (message) => {
      try {
        const parsed = JSON.parse(message.body);
        callback(parsed);
      } catch (error) {
        console.error('Failed to parse STOMP topic message:', error, message.body);
      }
    });
    const entry = this.topicSubscriptions.get(topic);
    if (entry) entry.sub = sub;
  }

  unsubscribeFromTopic(topic) {
    const entry = this.topicSubscriptions.get(topic);
    if (!entry) return;
    if (entry.sub) {
      try { entry.sub.unsubscribe(); } catch (e) { console.error(e); }
    }
    this.topicSubscriptions.delete(topic);
    console.log('Unsubscribed from topic:', topic);
  }

  // Convenience publishing methods
  sendTyping(chatId) {
    if (!this.client?.connected) return;
    this.client.publish({ destination: '/app/typing', body: JSON.stringify({ chatId }) });
  }

  sendStopTyping(chatId) {
    if (!this.client?.connected) return;
    this.client.publish({ destination: '/app/stop-typing', body: JSON.stringify({ chatId }) });
  }

  sendMessageRead(chatId, messageIds, readerId) {
    if (!this.client?.connected) return;
    const payload = { chatId, messageIds, readerId };
    this.client.publish({ destination: '/app/message.read', body: JSON.stringify(payload) });
  }

  // Call signalling helpers
  sendCallUser(signal) {
    if (!this.client?.connected) return;
    this.client.publish({ destination: '/app/call-user', body: JSON.stringify(signal) });
  }

  sendAnswerCall(signal) {
    if (!this.client?.connected) return;
    this.client.publish({ destination: '/app/answer-call', body: JSON.stringify(signal) });
  }

  sendIceCandidate(signal) {
    if (!this.client?.connected) return;
    this.client.publish({ destination: '/app/ice-candidate', body: JSON.stringify(signal) });
  }

  sendEndCall(signal) {
    if (!this.client?.connected) return;
    this.client.publish({ destination: '/app/end-call', body: JSON.stringify(signal) });
  }

  subscribeToCall(chatId, callback) {
    if (!chatId) return null;
    const topic = `/topic/call/${chatId}`;
    return this.subscribeToTopic(topic, callback);
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
        try { entry.sub.unsubscribe(); } catch (error) { console.error(error); }
      }
    });
    this.subscriptions.clear();
    this.topicSubscriptions.forEach((entry) => {
      if (entry.sub) {
        try { entry.sub.unsubscribe(); } catch (error) { console.error(error); }
      }
    });
    this.topicSubscriptions.clear();
    this.client.deactivate();
    this.client = null;
    this.connected = false;
    this.notifyListeners(false);
  }
}

export const stompService = new StompService();