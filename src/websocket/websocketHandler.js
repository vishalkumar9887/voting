const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

// Store active connections by poll ID
const pollConnections = new Map();

// Store connection metadata
const connectionMetadata = new Map();

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    const connectionId = uuidv4();
    console.log(`New WebSocket connection: ${connectionId}`);

    // Store connection metadata
    connectionMetadata.set(connectionId, {
      ws,
      pollId: null,
      connectedAt: new Date()
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection_established',
      connectionId,
      message: 'Connected to polling WebSocket server',
      timestamp: new Date().toISOString()
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(connectionId, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid JSON message format',
          timestamp: new Date().toISOString()
        }));
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log(`WebSocket connection closed: ${connectionId}`);
      const metadata = connectionMetadata.get(connectionId);
      
      if (metadata && metadata.pollId) {
        removeConnectionFromPoll(connectionId, metadata.pollId);
      }
      
      connectionMetadata.delete(connectionId);
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for connection ${connectionId}:`, error);
      const metadata = connectionMetadata.get(connectionId);
      
      if (metadata && metadata.pollId) {
        removeConnectionFromPoll(connectionId, metadata.pollId);
      }
      
      connectionMetadata.delete(connectionId);
    });
  });

  console.log('WebSocket server setup complete');
};

const handleWebSocketMessage = (connectionId, message) => {
  const metadata = connectionMetadata.get(connectionId);
  if (!metadata) return;

  const { ws } = metadata;

  switch (message.type) {
    case 'subscribe_poll':
      handleSubscribePoll(connectionId, message.pollId);
      break;
    
    case 'unsubscribe_poll':
      handleUnsubscribePoll(connectionId, message.pollId);
      break;
    
    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString()
      }));
      break;
    
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type',
        timestamp: new Date().toISOString()
      }));
  }
};

const handleSubscribePoll = (connectionId, pollId) => {
  if (!pollId) {
    const metadata = connectionMetadata.get(connectionId);
    if (metadata) {
      metadata.ws.send(JSON.stringify({
        type: 'error',
        message: 'Poll ID is required for subscription',
        timestamp: new Date().toISOString()
      }));
    }
    return;
  }

  // Remove from previous poll if any
  const metadata = connectionMetadata.get(connectionId);
  if (metadata && metadata.pollId) {
    removeConnectionFromPoll(connectionId, metadata.pollId);
  }

  // Add to new poll
  addConnectionToPoll(connectionId, pollId);
  
  // Update metadata
  metadata.pollId = pollId;

  // Send confirmation
  metadata.ws.send(JSON.stringify({
    type: 'poll_subscribed',
    pollId,
    message: `Subscribed to poll ${pollId}`,
    timestamp: new Date().toISOString()
  }));
};

const handleUnsubscribePoll = (connectionId, pollId) => {
  removeConnectionFromPoll(connectionId, pollId);
  
  const metadata = connectionMetadata.get(connectionId);
  if (metadata) {
    metadata.pollId = null;
    metadata.ws.send(JSON.stringify({
      type: 'poll_unsubscribed',
      pollId,
      message: `Unsubscribed from poll ${pollId}`,
      timestamp: new Date().toISOString()
    }));
  }
};

const addConnectionToPoll = (connectionId, pollId) => {
  if (!pollConnections.has(pollId)) {
    pollConnections.set(pollId, new Set());
  }
  
  pollConnections.get(pollId).add(connectionId);
  console.log(`Connection ${connectionId} subscribed to poll ${pollId}`);
};

const removeConnectionFromPoll = (connectionId, pollId) => {
  const connections = pollConnections.get(pollId);
  if (connections) {
    connections.delete(connectionId);
    
    // Clean up empty poll sets
    if (connections.size === 0) {
      pollConnections.delete(pollId);
    }
    
    console.log(`Connection ${connectionId} unsubscribed from poll ${pollId}`);
  }
};

const broadcastPollUpdate = (pollId, pollResults) => {
  const connections = pollConnections.get(pollId);
  
  if (!connections || connections.size === 0) {
    console.log(`No active connections for poll ${pollId}`);
    return;
  }

  const updateMessage = {
    type: 'poll_update',
    pollId,
    data: pollResults,
    timestamp: new Date().toISOString()
  };

  let successCount = 0;
  let errorCount = 0;

  connections.forEach(connectionId => {
    const metadata = connectionMetadata.get(connectionId);
    
    if (metadata && metadata.ws.readyState === metadata.ws.OPEN) {
      try {
        metadata.ws.send(JSON.stringify(updateMessage));
        successCount++;
      } catch (error) {
        console.error(`Error sending update to connection ${connectionId}:`, error);
        errorCount++;
        
        // Remove failed connection
        connections.delete(connectionId);
        connectionMetadata.delete(connectionId);
      }
    } else {
      // Remove stale connection
      connections.delete(connectionId);
      if (metadata) {
        connectionMetadata.delete(connectionId);
      }
    }
  });

  // Clean up empty poll sets
  if (connections.size === 0) {
    pollConnections.delete(pollId);
  }

  console.log(`Broadcasted poll update for ${pollId}: ${successCount} successful, ${errorCount} failed`);
};

const getConnectionStats = () => {
  const stats = {
    totalConnections: connectionMetadata.size,
    pollSubscriptions: {},
    totalPolls: pollConnections.size
  };

  pollConnections.forEach((connections, pollId) => {
    stats.pollSubscriptions[pollId] = connections.size;
  });

  return stats;
};

module.exports = {
  setupWebSocket,
  broadcastPollUpdate,
  getConnectionStats
};
