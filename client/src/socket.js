// socket.js
import io from 'socket.io-client';
import { userId, onUserIdChange } from './userId';

const socket = io({ auth: { clientId: userId } }); // 連接 socket.io

onUserIdChange(() => {
  location.reload();
})

export default socket;
