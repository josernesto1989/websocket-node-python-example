const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server is listening on ws://localhost:8080');

// Map to hold topics and the set of connected WebSockets subscribed to them
const subscriptions = new Map();

wss.on('connection', function connection(ws) {
  console.log('A new client connected!');
  
  // Track this client's topics to easily unsubscribe them on disconnect
  ws.clientTopics = new Set();

  ws.on('message', function incoming(message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log('Received non-JSON message:', message.toString());
      return;
    }

    if (data.action === 'subscribe' && data.topic) {
      // Create the topic set if it doesn't exist yet
      if (!subscriptions.has(data.topic)) {
        subscriptions.set(data.topic, new Set());
      }
      subscriptions.get(data.topic).add(ws);
      ws.clientTopics.add(data.topic);
      
      console.log(`Client subscribed to topic: ${data.topic}`);
      ws.send(JSON.stringify({ status: 'success', message: `Subscribed to ${data.topic}` }));
    } 
    else if (data.action === 'unsubscribe' && data.topic) {
      if (subscriptions.has(data.topic)) {
        subscriptions.get(data.topic).delete(ws);
      }
      ws.clientTopics.delete(data.topic);
      
      console.log(`Client unsubscribed from topic: ${data.topic}`);
      ws.send(JSON.stringify({ status: 'success', message: `Unsubscribed from ${data.topic}` }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Remove the disconnected client from all topics they were subscribed to
    if (ws.clientTopics) {
      ws.clientTopics.forEach(topic => {
        if (subscriptions.has(topic)) {
          subscriptions.get(topic).delete(ws);
        }
      });
    }
  });

  ws.send(JSON.stringify({ message: 'Welcome! Send {"action": "subscribe", "topic": "<topic_name>"} to subscribe.' }));
});

// --- SIMULATED DATA PUBLISHER ---
// Every 2 seconds, publish to the "ticker" topic
let counter = 0;
setInterval(() => {
  counter++;
  const topic = 'ticker';
  const pubMessage = JSON.stringify({
    event: 'update',
    topic: topic,
    data: `Ticker update #${counter}`,
    timestamp: new Date().toISOString()
  });

  // If there are subscribers to the 'ticker' topic, send them the message
  if (subscriptions.has(topic)) {
    subscriptions.get(topic).forEach(clientWs => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(pubMessage);
      }
    });
  }
}, 2000);
