import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5178';

const connection: HubConnection = new HubConnectionBuilder()
  .withUrl(`${API_URL}/choreHub`, {
    withCredentials: true, // Send cookies for authentication
  })
  .withAutomaticReconnect() // Auto-reconnect on connection loss
  .configureLogging(LogLevel.Information)
  .build();

// Function to start the SignalR connection with error handling
export const startSignalRConnection = async (): Promise<HubConnection> => {
  if (connection.state === HubConnectionState.Disconnected) {
    try {
      await connection.start();
      console.log('SignalR Connected successfully');
    } catch (error) {
      console.error('SignalR Connection failed:', error);
      // Retry connection after 5 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect SignalR...');
        startSignalRConnection();
      }, 5000);
    }
  }
  return connection;
};

// Function to get the connection instance
export const getConnection = (): HubConnection => {
  return connection;
};

// Handle connection state changes
connection.onclose((error) => {
  console.error('SignalR Connection closed:', error);
  console.log('Attempting to reconnect...');
  startSignalRConnection();
});

connection.onreconnecting((error) => {
  console.warn('SignalR Connection lost. Reconnecting...', error);
});

connection.onreconnected((connectionId) => {
  console.log('SignalR Reconnected. Connection ID:', connectionId);
});

export default connection;