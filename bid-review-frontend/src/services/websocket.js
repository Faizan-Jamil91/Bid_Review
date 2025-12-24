class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    this.heartbeatInterval = 30000;
    this.heartbeatTimer = null;
    this.listeners = new Map();
    this.connectionStatus = 'disconnected';
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.connectionStatus = 'connecting';

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.connectionStatus = 'disconnected';
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatus = 'error';
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        this.connectionStatus = 'error';
        reject(error);
      }
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatus = 'disconnected';
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket not connected, message not sent:', data);
    return false;
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  handleMessage(data) {
    const { type, payload } = data;
    this.emit(type, payload);
    this.emit('message', data);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.connectionStatus !== 'connected') {
        this.connect().catch(error => {
          console.error('Reconnect failed:', error);
        });
      }
    }, delay);
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  // Real-time bid updates
  subscribeToBids(callback) {
    this.subscribe('bid_created', callback);
    this.subscribe('bid_updated', callback);
    this.subscribe('bid_deleted', callback);
    this.subscribe('bid_status_changed', callback);
  }

  // Real-time customer updates
  subscribeToCustomers(callback) {
    this.subscribe('customer_created', callback);
    this.subscribe('customer_updated', callback);
    this.subscribe('customer_deleted', callback);
  }

  // Join specific rooms/channels
  joinRoom(roomId) {
    this.send({ type: 'join_room', room: roomId });
  }

  leaveRoom(roomId) {
    this.send({ type: 'leave_room', room: roomId });
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
