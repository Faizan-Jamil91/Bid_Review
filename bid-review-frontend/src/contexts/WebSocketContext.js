import React, { createContext, useContext, useReducer, useEffect } from 'react';
import websocketService from '../services/websocket';

// WebSocket state reducer
const websocketReducer = (state, action) => {
  switch (action.type) {
    case 'CONNECTING':
      return {
        ...state,
        connectionStatus: 'connecting',
        error: null
      };
    
    case 'CONNECTED':
      return {
        ...state,
        connectionStatus: 'connected',
        isConnected: true,
        error: null
      };
    
    case 'DISCONNECTED':
      return {
        ...state,
        connectionStatus: 'disconnected',
        isConnected: false,
        error: null
      };
    
    case 'ERROR':
      return {
        ...state,
        connectionStatus: 'error',
        isConnected: false,
        error: action.payload
      };
    
    case 'NEW_MESSAGE':
      return {
        ...state,
        lastMessage: action.payload
      };
    
    case 'BID_CREATED':
      return {
        ...state,
        bids: [action.payload, ...state.bids]
      };
    
    case 'BID_UPDATED':
      return {
        ...state,
        bids: state.bids.map(bid => 
          bid.id === action.payload.id ? action.payload : bid
        )
      };
    
    case 'BID_DELETED':
      return {
        ...state,
        bids: state.bids.filter(bid => bid.id !== action.payload)
      };
    
    case 'CUSTOMER_CREATED':
      return {
        ...state,
        customers: [action.payload, ...state.customers]
      };
    
    case 'CUSTOMER_UPDATED':
      return {
        ...state,
        customers: state.customers.map(customer => 
          customer.id === action.payload.id ? action.payload : customer
        )
      };
    
    case 'CUSTOMER_DELETED':
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload)
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  isConnected: false,
  connectionStatus: 'disconnected',
  lastMessage: null,
  error: null,
  bids: [],
  customers: []
};

// Create context
const WebSocketContext = createContext();

// Provider component
export const WebSocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(websocketReducer, initialState);

  useEffect(() => {
    // Setup WebSocket event listeners
    const handleConnected = () => dispatch({ type: 'CONNECTED' });
    const handleDisconnected = () => dispatch({ type: 'DISCONNECTED' });
    const handleError = (error) => dispatch({ type: 'ERROR', payload: error });
    const handleMessage = (message) => dispatch({ type: 'NEW_MESSAGE', payload: message });
    
    const handleBidCreated = (bid) => dispatch({ type: 'BID_CREATED', payload: bid });
    const handleBidUpdated = (bid) => dispatch({ type: 'BID_UPDATED', payload: bid });
    const handleBidDeleted = (bidId) => dispatch({ type: 'BID_DELETED', payload: bidId });
    
    const handleCustomerCreated = (customer) => dispatch({ type: 'CUSTOMER_CREATED', payload: customer });
    const handleCustomerUpdated = (customer) => dispatch({ type: 'CUSTOMER_UPDATED', payload: customer });
    const handleCustomerDeleted = (customerId) => dispatch({ type: 'CUSTOMER_DELETED', payload: customerId });

    // Subscribe to WebSocket events
    websocketService.subscribe('connected', handleConnected);
    websocketService.subscribe('disconnected', handleDisconnected);
    websocketService.subscribe('error', handleError);
    websocketService.subscribe('message', handleMessage);
    
    websocketService.subscribe('bid_created', handleBidCreated);
    websocketService.subscribe('bid_updated', handleBidUpdated);
    websocketService.subscribe('bid_deleted', handleBidDeleted);
    
    websocketService.subscribe('customer_created', handleCustomerCreated);
    websocketService.subscribe('customer_updated', handleCustomerUpdated);
    websocketService.subscribe('customer_deleted', handleCustomerDeleted);

    // Connect to WebSocket
    websocketService.connect().catch(console.error);

    // Cleanup
    return () => {
      websocketService.unsubscribe('connected', handleConnected);
      websocketService.unsubscribe('disconnected', handleDisconnected);
      websocketService.unsubscribe('error', handleError);
      websocketService.unsubscribe('message', handleMessage);
      
      websocketService.unsubscribe('bid_created', handleBidCreated);
      websocketService.unsubscribe('bid_updated', handleBidUpdated);
      websocketService.unsubscribe('bid_deleted', handleBidDeleted);
      
      websocketService.unsubscribe('customer_created', handleCustomerCreated);
      websocketService.unsubscribe('customer_updated', handleCustomerUpdated);
      websocketService.unsubscribe('customer_deleted', handleCustomerDeleted);
      
      websocketService.disconnect();
    };
  }, []);

  // Context value
  const contextValue = {
    ...state,
    send: websocketService.send.bind(websocketService),
    subscribe: websocketService.subscribe.bind(websocketService),
    unsubscribe: websocketService.unsubscribe.bind(websocketService),
    joinRoom: websocketService.joinRoom.bind(websocketService),
    leaveRoom: websocketService.leaveRoom.bind(websocketService),
    connect: websocketService.connect.bind(websocketService),
    disconnect: websocketService.disconnect.bind(websocketService)
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use WebSocket context
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
