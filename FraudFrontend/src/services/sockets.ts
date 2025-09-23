import { WebSocketMessage, WebSocketEvents } from '@/types/api';
import { WEBSOCKET_EVENTS } from '@/utils/constants';

type Handler = (data?: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private eventHandlers: Map<string, Set<Handler>> = new Map();
  private isConnecting = false;
  private shouldReconnect = true;
  // Track which channels you're subscribed to
  private subscribedChannels: Set<string> = new Set();
  // To know whether subscription ack has been received
  private subscriptionAck: Map<string, boolean> = new Map();

  constructor(url: string = 'ws://127.0.0.1:8000/ws/monitor') {
    this.url = url;
  }

  async connect(): Promise<void> {
    // If already open, return
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    // If connecting, wait until done or error
    if (this.isConnecting) {
      await this.waitUntilConnectedOrFailed();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        return;
      } else {
        throw new Error('Failed to connect');
      }
    }

    this.isConnecting = true;

    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
      } catch (err) {
        this.isConnecting = false;
        return reject(err);
      }

      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        // Re-subscribe to channels
        for (const ch of this.subscribedChannels) {
          this.subscriptionAck.set(ch, false);
          this.send({ type: 'subscribe', channel: ch });
        }
        this.emit(WEBSOCKET_EVENTS.CONNECT);
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.emit(WEBSOCKET_EVENTS.DISCONNECT);
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        reject(error);
      };
    });
  }

  private waitUntilConnectedOrFailed(): Promise<void> {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          resolve();
        } else if (!this.isConnecting && this.ws && this.ws.readyState === WebSocket.CLOSED) {
          reject(new Error('Connection failed'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(err => {
          console.error('Reconnection attempt failed:', err);
        });
      }
    }, delay);
  }

  private handleMessage(message: WebSocketMessage) {
    const { type, data } = message;

    switch (type) {
      case 'connection':
        console.log('WebSocket connection established:', data);
        this.emit(WEBSOCKET_EVENTS.CONNECT, data);
        break;
      case 'subscribed':
        if (message['channel']) {
          const ch = message['channel'];
          console.log(`Subscribed ack received for channel ${ch}`);
          this.subscriptionAck.set(ch, true);
        }
        break;
      case 'unsubscribed':
        if (message['channel']) {
          const ch = message['channel'];
          console.log(`Unsubscribed ack received for channel ${ch}`);
          this.subscriptionAck.set(ch, false);
        }
        break;
      case 'alert':
        // Only emit alert if subscription ack for alerts is true
        if (this.subscriptionAck.get('alerts')) {
          this.emit(WEBSOCKET_EVENTS.ALERT_NEW, data);
          console.log('Received alert:', data);
        } else {
          console.warn('Received alert before subscription ack for alerts, ignoring:', data);
        }
        break;
      case 'transaction':
        if (this.subscriptionAck.get('transactions')) {
          this.emit(WEBSOCKET_EVENTS.TRANSACTION_FLAGGED, data);
        }
        break;
      case 'status':
        this.emit(WEBSOCKET_EVENTS.SYSTEM_STATUS, data);
        break;
      case 'pong':
        console.log('Received pong from server');
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  }

  private emit(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  on(event: keyof WebSocketEvents, handler: Handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: keyof WebSocketEvents, handler: Handler) {
    const s = this.eventHandlers.get(event);
    if (s) {
      s.delete(handler);
    }
  }

  send(obj: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', obj);
      this.ws.send(JSON.stringify(obj));
    } else {
      console.warn('WebSocket is not connected (or not open), cannot send:', obj);
    }
  }

  subscribeAlerts() {
    this.subscribedChannels.add('alerts');
    this.subscriptionAck.set('alerts', false);
    this.send({ type: 'subscribe', channel: 'alerts' });
  }

  subscribeTransactions() {
    this.subscribedChannels.add('transactions');
    this.subscriptionAck.set('transactions', false);
    this.send({ type: 'subscribe', channel: 'transactions' });
  }

  subscribeCustomers() {
    this.subscribedChannels.add('customers');
    this.subscriptionAck.set('customers', false);
    this.send({ type: 'subscribe', channel: 'customers' });
  }

  unsubscribe(channel: string) {
    this.subscribedChannels.delete(channel);
    this.subscriptionAck.delete(channel);
    this.send({ type: 'unsubscribe', channel });
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close(1000, 'client disconnect');
      this.ws = null;
    }
    this.eventHandlers.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
export const socketService = new WebSocketService();

// Export convenience functions
export const connectMonitor = (onMessage: (message: WebSocketMessage) => void) => {
  return socketService.connect().then(() => {
    socketService.on('alert:new', (alert) => onMessage({ type: 'alert', data: alert, timestamp: new Date().toISOString() }));
    socketService.on('transaction:flagged', (transaction) => onMessage({ type: 'transaction', data: transaction, timestamp: new Date().toISOString() }));
    socketService.on('system:status', (status) => onMessage({ type: 'status', data: status, timestamp: new Date().toISOString() }));
  });
};

export const subscribeAlerts = () => {
  socketService.subscribeAlerts();
};

export const subscribeTransactions = () => {
  socketService.subscribeTransactions();
};

export const subscribeCustomers = () => {
  socketService.subscribeCustomers();
};

export const disconnect = () => {
  socketService.disconnect();
};

export default socketService;
