/**
 * Nexus Code — Server-Authoritative Realtime Broadcaster
 *
 * Implements WebSocket connection handling and scoped room broadcasting
 * on port 3000 alongside Express per real-time-and-multi-user guidelines.
 * Pushes contest and leaderboard updates to connected clients without page refresh.
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface ClientConnection {
  ws: WebSocket;
  rooms: Set<string>;
  isAlive: boolean;
  userId?: string;
}

export class RealtimeBroadcaster {
  private wss: WebSocketServer | null = null;
  private clients = new Map<WebSocket, ClientConnection>();
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Initializes WebSocket server attached to the HTTP server.
   */
  public initialize(server: HttpServer) {
    if (this.wss) return;

    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      const client: ClientConnection = {
        ws,
        rooms: new Set<string>(),
        isAlive: true,
      };

      this.clients.set(ws, client);

      // Send initial welcome
      ws.send(JSON.stringify({
        event: 'connected',
        message: 'Nexus Code Realtime Engine connected.',
        timestamp: new Date().toISOString(),
      }));

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('message', (data: Buffer | string) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleClientMessage(client, msg);
        } catch {
          // Ignore invalid messages
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    // 30-second heartbeat to detect dead connections
    this.pingInterval = setInterval(() => {
      for (const [ws, client] of this.clients.entries()) {
        if (!client.isAlive) {
          ws.terminate();
          this.clients.delete(ws);
          continue;
        }
        client.isAlive = false;
        ws.ping();
      }
    }, 30000);
  }

  /**
   * Handles incoming client subscription requests.
   */
  private handleClientMessage(client: ClientConnection, msg: any) {
    if (msg.action === 'subscribe' && typeof msg.room === 'string') {
      client.rooms.add(msg.room);
      if (msg.userId) client.userId = msg.userId;
      client.ws.send(JSON.stringify({
        event: 'subscribed',
        room: msg.room,
        timestamp: new Date().toISOString(),
      }));
    } else if (msg.action === 'unsubscribe' && typeof msg.room === 'string') {
      client.rooms.delete(msg.room);
      client.ws.send(JSON.stringify({
        event: 'unsubscribed',
        room: msg.room,
        timestamp: new Date().toISOString(),
      }));
    } else if (msg.action === 'ping') {
      client.ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
    }
  }

  /**
   * Broadcasts contest-scoped leaderboard update strictly to subscribers of that contest room.
   */
  public broadcastContestLeaderboard(contestId: string, leaderboard: any[]) {
    const targetRoom = `contest:${contestId}`;
    const payload = JSON.stringify({
      event: 'contest_leaderboard:update',
      contestId,
      standings: leaderboard,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN && client.rooms.has(targetRoom)) {
        try {
          client.ws.send(payload);
        } catch {
          // Non-blocking per client
        }
      }
    }
  }

  /**
   * Broadcasts global chapter leaderboard update to chapter subscribers.
   */
  public broadcastChapterLeaderboard(standings: any[]) {
    const targetRoom = 'leaderboard:chapter';
    const payload = JSON.stringify({
      event: 'chapter_leaderboard:update',
      standings,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN && client.rooms.has(targetRoom)) {
        try {
          client.ws.send(payload);
        } catch {
          // Non-blocking
        }
      }
    }
  }

  /**
   * Shuts down broadcaster.
   */
  public shutdown() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

export const realtimeBroadcaster = new RealtimeBroadcaster();
