/**
 * WebSocket Handler - Real-time updates for AMANA system
 *
 * This module provides WebSocket functionality for broadcasting real-time
 * updates about activities, HAI scores, and governance events.
 */

import { EventEmitter } from 'events';
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';

// ============================================================================
// Types
// ============================================================================

export interface WSMessage {
  type: MessageType;
  data: unknown;
  timestamp: number;
}

export enum MessageType {
  // Activity events
  ActivityProposed = 'activity.proposed',
  ActivityApproved = 'activity.approved',
  ActivityCompleted = 'activity.completed',
  ActivityRejected = 'activity.rejected',

  // Participant events
  ParticipantJoined = 'participant.joined',
  ParticipantExited = 'participant.exited',
  CapitalDeposited = 'capital.deposited',
  CapitalWithdrawn = 'capital.withdrawn',

  // HAI events
  HAIScoreUpdated = 'hai.score_updated',
  HAISnapshotCreated = 'hai.snapshot_created',

  // Governance events
  ProposalCreated = 'dao.proposal_created',
  ProposalExecuted = 'dao.proposal_executed',
  VoteCast = 'dao.vote_cast',

  // System events
  SystemPaused = 'system.paused',
  SystemUnpaused = 'system.unpaused',

  // Error events
  Error = 'error',
}

export interface WSClient {
  id: string;
  socket: WebSocket;
  subscriptions: Set<MessageType>;
  isAlive: boolean;
  lastPing: number;
}

export interface BroadcastOptions {
  filter?: (client: WSClient) => boolean;
  exclude?: string | string[];
}

// ============================================================================
// WebSocket Handler Configuration
// ============================================================================

export interface WSHandlerConfig {
  pingInterval?: number;
  pingTimeout?: number;
  maxClients?: number;
  messageQueueSize?: number;
}

const DEFAULT_CONFIG: Required<WSHandlerConfig> = {
  pingInterval: 30000, // 30 seconds
  pingTimeout: 60000, // 60 seconds
  maxClients: 1000,
  messageQueueSize: 100,
};

// ============================================================================
// WebSocket Handler
// ============================================================================

export class WebSocketHandler extends EventEmitter {
  private wss?: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();
  private config: Required<WSHandlerConfig>;
  private pingInterval?: NodeJS.Timeout;
  private messageQueues: Map<string, WSMessage[]> = new Map();

  constructor(config?: WSHandlerConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Attach WebSocket server to HTTP server
   */
  attach(httpServer: HttpServer, path = '/ws'): void {
    this.wss = new WebSocketServer({ server: httpServer, path });

    this.wss.on('connection', (socket, request) => this.handleConnection(socket, request));
    this.wss.on('error', (error) => this.emit('error', error));

    this.startPingInterval();

    this.emit('server_started');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: WebSocket, request: unknown): void {
    if (this.clients.size >= this.config.maxClients) {
      socket.close(1008, 'Server full');
      return;
    }

    const clientId = this.generateClientId();
    const client: WSClient = {
      id: clientId,
      socket,
      subscriptions: new Set(),
      isAlive: true,
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);
    this.messageQueues.set(clientId, []);

    socket.on('message', (data) => this.handleMessage(clientId, data));
    socket.on('close', () => this.handleDisconnect(clientId));
    socket.on('pong', () => {
      client.isAlive = true;
      client.lastPing = Date.now();
    });

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection.established',
      data: { clientId },
      timestamp: Date.now(),
    });

    this.emit('client_connected', clientId);
  }

  /**
   * Handle incoming message from client
   */
  private handleMessage(clientId: string, data: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message = JSON.parse(data.toString()) as WSMessage;

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(client, message.data as MessageType[]);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(client, message.data as MessageType[]);
          break;
        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            data: { timestamp: Date.now() },
            timestamp: Date.now(),
          });
          break;
        default:
          this.emit('message', clientId, message);
      }
    } catch (error) {
      this.sendError(clientId, 'Invalid message format');
    }
  }

  /**
   * Handle subscription request
   */
  private handleSubscribe(client: WSClient, types: MessageType[]): void {
    for (const type of types) {
      if (Object.values(MessageType).includes(type)) {
        client.subscriptions.add(type);
      }
    }

    this.sendToClient(client.id, {
      type: 'subscribed',
      data: { subscriptions: Array.from(client.subscriptions) },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(client: WSClient, types: MessageType[]): void {
    for (const type of types) {
      client.subscriptions.delete(type);
    }

    this.sendToClient(client.id, {
      type: 'unsubscribed',
      data: { subscriptions: Array.from(client.subscriptions) },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    this.clients.delete(clientId);
    this.messageQueues.delete(clientId);
    this.emit('client_disconnected', clientId);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: WSMessage): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Broadcast message to all subscribed clients
   */
  broadcast(type: MessageType, data: unknown, options?: BroadcastOptions): void {
    const message: WSMessage = { type, data, timestamp: Date.now() };

    for (const [clientId, client] of this.clients) {
      if (client.socket.readyState !== WebSocket.OPEN) continue;

      // Check if client is subscribed to this message type
      if (!client.subscriptions.has(type) && client.subscriptions.size > 0) {
        continue;
      }

      // Apply filter if provided
      if (options?.filter && !options.filter(client)) {
        continue;
      }

      // Check exclusion list
      if (options?.exclude) {
        const excludes = Array.isArray(options.exclude) ? options.exclude : [options.exclude];
        if (excludes.includes(clientId)) continue;
      }

      this.sendToClient(clientId, message);
    }

    this.emit('broadcast', type, data);
  }

  /**
   * Send error message to client
   */
  private sendError(clientId: string, error: string): void {
    this.sendToClient(clientId, {
      type: MessageType.Error,
      data: { error },
      timestamp: Date.now(),
    });
  }

  /**
   * Start ping interval for connection health
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();

      for (const [clientId, client] of this.clients) {
        if (!client.isAlive || now - client.lastPing > this.config.pingTimeout) {
          client.socket.terminate();
          this.handleDisconnect(clientId);
          continue;
        }

        client.isAlive = false;
        client.socket.ping();
      }
    }, this.config.pingInterval);
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get client info
   */
  getClient(clientId: string): WSClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all clients
   */
  getAllClients(): WSClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Disconnect all clients
   */
  disconnectAll(): void {
    for (const client of this.clients.values()) {
      client.socket.close();
    }
    this.clients.clear();
    this.messageQueues.clear();
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.disconnectAll();

    if (this.wss) {
      this.wss.close();
    }

    this.emit('server_shutdown');
  }
}

// ============================================================================
// Convenience Methods for AMANA Events
// ============================================================================

export class AmanaWebSocketHandler extends WebSocketHandler {
  // Activity events
  broadcastActivityProposed(data: unknown): void {
    this.broadcast(MessageType.ActivityProposed, data);
  }

  broadcastActivityApproved(data: unknown): void {
    this.broadcast(MessageType.ActivityApproved, data);
  }

  broadcastActivityCompleted(data: unknown): void {
    this.broadcast(MessageType.ActivityCompleted, data);
  }

  // Participant events
  broadcastParticipantJoined(data: unknown): void {
    this.broadcast(MessageType.ParticipantJoined, data);
  }

  broadcastCapitalDeposited(data: unknown): void {
    this.broadcast(MessageType.CapitalDeposited, data);
  }

  // HAI events
  broadcastHAIScoreUpdated(data: unknown): void {
    this.broadcast(MessageType.HAIScoreUpdated, data);
  }

  // Governance events
  broadcastProposalCreated(data: unknown): void {
    this.broadcast(MessageType.ProposalCreated, data);
  }

  broadcastVoteCast(data: unknown): void {
    this.broadcast(MessageType.VoteCast, data);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a WebSocket handler for AMANA
 */
export function createWebSocketHandler(config?: WSHandlerConfig): AmanaWebSocketHandler {
  return new AmanaWebSocketHandler(config);
}
