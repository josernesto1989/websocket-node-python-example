import asyncio
import json
import websockets

async def subscribe_and_listen():
    uri = "ws://localhost:8080"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            
            # Receive the initial welcome message
            welcome = await websocket.recv()
            try:
                print(f"Server Welcome: {json.loads(welcome)}")
            except json.JSONDecodeError:
                print(f"Server Welcome: {welcome}")
            
            # 1. Send subscription request using JSON format
            subscribe_req = {
                "action": "subscribe",
                "topic": "ticker"
            }
            print(f"Sending subscription request: {subscribe_req}")
            await websocket.send(json.dumps(subscribe_req))
            
            # 2. Enter a continuous loop to listen for background updates on the topic
            print("Listening for updates on 'ticker' topic... (press Ctrl+C to exit)")
            async for message in websocket:
                data = json.loads(message)
                
                # Check if it's the subscription success message or a data update
                if "status" in data and data["status"] == "success":
                    print(f"✅ {data['message']}")
                else:
                    print(f"🔔 Received update: {data}")
                
    except websockets.exceptions.ConnectionClosedError:
        print("Connection closed by the server.")
    except ConnectionRefusedError:
        print("Failed to connect. Is the Node.js WebSocket server running?")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(subscribe_and_listen())
    except KeyboardInterrupt:
        print("\nDisconnected by user limit.")
