/* eslint-disable prettier/prettier */
import {
  MessageBody,
  WebSocketServer,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { SocketService } from './socket.service';
import { Injectable, UseInterceptors } from '@nestjs/common';
//gives us access to the socket.io functionality.
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
//we log when a new client connects to the server or when a current client disconnects.
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // @WebsocketServer() which gives us access to the websockets server instance.
  @WebSocketServer() server: Server;

  constructor(private readonly socketService: SocketService) {}

  //@SubscribeMessage() which makes it listen to an event named msgToServer.
  @SubscribeMessage('updateLocation')
  async updateLocation(@MessageBody() data: Object) {
    await this.socketService.updateCurrentLocation(data);
  }

  //This method is called when a client disconnects from the WebSocket server
  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
  }

  //This method is called when a new client connects to the WebSocket server
  @UseInterceptors()
  async handleConnection(client: Socket) {
    await this.socketService.getUserFromSocket(client);
  }
}
