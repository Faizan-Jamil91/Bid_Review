import { useState, useEffect, useRef, useCallback } from 'react';
import websocketService from '../services/websocket';

export const useWebSocket = (autoConnect = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(async () => {
    try {
      setError(null);
      await websocketService.connect();
    } catch (err) {
      setError(err.message || 'Failed to connect');
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  const send = useCallback((data) => {
    return websocketService.send(data);
  }, []);

  const subscribe = useCallback((event, callback) => {
    websocketService.subscribe(event, callback);
  }, []);

  const unsubscribe = useCallback((event, callback) => {
    websocketService.unsubscribe(event, callback);
  }, []);

  useEffect(() => {
    // Subscribe to connection events
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleError = (err) => {
      setError(err);
      setConnectionStatus('error');
    };

    const handleMessage = (data) => {
      setLastMessage(data);
    };

    websocketService.subscribe('connected', handleConnected);
    websocketService.subscribe('disconnected', handleDisconnected);
    websocketService.subscribe('error', handleError);
    websocketService.subscribe('message', handleMessage);

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Cleanup
    return () => {
      websocketService.unsubscribe('connected', handleConnected);
      websocketService.unsubscribe('disconnected', handleDisconnected);
      websocketService.unsubscribe('error', handleError);
      websocketService.unsubscribe('message', handleMessage);
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe
  };
};

export const useBidsWebSocket = () => {
  const [bids, setBids] = useState([]);
  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleBidCreated = (bid) => {
      setBids(prev => [bid, ...prev]);
    };

    const handleBidUpdated = (bid) => {
      setBids(prev => prev.map(b => b.id === bid.id ? bid : b));
    };

    const handleBidDeleted = (bidId) => {
      setBids(prev => prev.filter(b => b.id !== bidId));
    };

    const handleBidStatusChanged = ({ id, status }) => {
      setBids(prev => prev.map(b => 
        b.id === id ? { ...b, status } : b
      ));
    };

    // Subscribe to bid events
    subscribe('bid_created', handleBidCreated);
    subscribe('bid_updated', handleBidUpdated);
    subscribe('bid_deleted', handleBidDeleted);
    subscribe('bid_status_changed', handleBidStatusChanged);

    return () => {
      unsubscribe('bid_created', handleBidCreated);
      unsubscribe('bid_updated', handleBidUpdated);
      unsubscribe('bid_deleted', handleBidDeleted);
      unsubscribe('bid_status_changed', handleBidStatusChanged);
    };
  }, [isConnected, subscribe, unsubscribe]);

  return { bids, isConnected };
};

export const useCustomersWebSocket = () => {
  const [customers, setCustomers] = useState([]);
  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleCustomerCreated = (customer) => {
      setCustomers(prev => [customer, ...prev]);
    };

    const handleCustomerUpdated = (customer) => {
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    };

    const handleCustomerDeleted = (customerId) => {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    };

    // Subscribe to customer events
    subscribe('customer_created', handleCustomerCreated);
    subscribe('customer_updated', handleCustomerUpdated);
    subscribe('customer_deleted', handleCustomerDeleted);

    return () => {
      unsubscribe('customer_created', handleCustomerCreated);
      unsubscribe('customer_updated', handleCustomerUpdated);
      unsubscribe('customer_deleted', handleCustomerDeleted);
    };
  }, [isConnected, subscribe, unsubscribe]);

  return { customers, isConnected };
};
