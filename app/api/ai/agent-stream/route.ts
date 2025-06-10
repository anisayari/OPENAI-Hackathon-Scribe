import { NextRequest, NextResponse } from 'next/server';

// Store active SSE connections
const activeConnections = new Map<string, ReadableStreamController>();

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this session
      activeConnections.set(sessionId, controller);
      
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
      
      // Keep connection alive with periodic pings
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (error) {
          clearInterval(pingInterval);
        }
      }, 30000);
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        activeConnections.delete(sessionId);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

// Helper function to send events to connected clients
export function sendAgentEvent(sessionId: string, eventType: string, data: any) {
  const controller = activeConnections.get(sessionId);
  if (controller) {
    try {
      const encoder = new TextEncoder();
      const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(eventData));
    } catch (error) {
      console.error('Error sending agent event:', error);
      activeConnections.delete(sessionId);
    }
  }
}