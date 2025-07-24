// socket.js
import io from 'socket.io-client';
import { userId } from './userId';

const socket = io({ auth: { clientId: userId } }); // 連接 socket.io

export default socket;
