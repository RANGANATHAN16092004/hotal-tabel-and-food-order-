import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
    socket = null;

    connect(hotelId, customerId) {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
            });

            this.socket.on('connect', () => {
                console.log('Connected to socket server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from socket server');
            });
        }

        // Automatically join hotel or customer rooms if IDs are provided
        if (hotelId) {
            this.joinHotel(hotelId);
        }

        if (customerId) {
            this.joinCustomer(customerId);
        }

        return this.socket;
    }

    joinHotel(hotelId) {
        if (this.socket) {
            this.socket.emit('join-hotel', hotelId);
        }
    }

    joinCustomer(customerId) {
        if (this.socket) {
            this.socket.emit('join-customer', customerId);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event, handler) {
        if (this.socket) {
            this.socket.on(event, handler);
        }
    }

    off(event, handler) {
        if (this.socket) {
            if (handler) {
                this.socket.off(event, handler);
            } else {
                this.socket.off(event);
            }
        }
    }
}

const socketService = new SocketService();
export default socketService;
export { socketService };