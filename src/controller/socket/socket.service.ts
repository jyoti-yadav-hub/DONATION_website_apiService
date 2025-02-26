/* eslint-disable prettier/prettier */
import _ from 'lodash';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  FoodRequestModel,
  FoodRequestDocument,
} from '../request/entities/food-request.entity';
import { WsException } from '@nestjs/websockets';
import { ErrorlogServiceForCron } from '../error-log/error-log.service';
import { User, UserDocument } from '../users/entities/user.entity';
import {
  UserToken,
  UserTokenDocument,
} from '../users/entities/user-token.entity';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectID = require('mongodb').ObjectID;
@Injectable()
export class SocketService {
  constructor(
    private readonly errorlogService: ErrorlogServiceForCron,
    @InjectModel(FoodRequestModel.name)
    private foodRequestModel: Model<FoodRequestDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserToken.name)
    private userTokenModel: Model<UserTokenDocument>,
  ) {}

  //This function is used to authorize user when socket connected
  async getUserFromSocket(socket: Socket) {
    try {
      // Extract the authentication token from the socket handshake query
      const authenticationToken: any = socket.handshake.query.token;
      if (authenticationToken && !_.isUndefined(authenticationToken)) {
        // Find the user by their access token
        const findUser = await this.userTokenModel
          .findOne({ access_token: authenticationToken })
          .select({ _id: 1 })
          .lean();

        if (!findUser) {
          return { error: 'Invalid credentials.' };
        } else {
          // Store the socket ID in the user's profile
          const socketId = socket.id;
          await this.userModel
            .updateOne({ _id: findUser.user_id }, { socket_id: socketId })
            .lean();
        }
      }
    } catch (error) {
      // Log errors and handle exceptions
      this.errorlogService.errorLog(
        error,
        'src/controller/socket/socket.service.ts-getUserFromSocket',
        socket.handshake.query.token,
      );
      return;
    }
  }

  //This function is used for update current location of user in user profile
  async updateCurrentLocation(data) {
    try {
      if (data.id) {
        const findUser = await this.userModel
          .findOne({ _id: data.id })
          .select({ _id: 1 })
          .lean();
        if (!_.isEmpty(findUser)) {
          const currentLocation = [Number(data.lng), Number(data.lat)];

          await this.userModel
            .findByIdAndUpdate(
              { _id: data.id },
              { $set: { current_location: currentLocation } },
              { new: true },
            )
            .select({ _id: 1 })
            .lean();

          //update volunteer location in request table if user is volunteer for that request
          const findRequest = await this.foodRequestModel
            .find({
              volunteer_id: ObjectID(data.id),
              status: { $in: ['volunteer_accept', 'pickup'] },
            })
            .select({ _id: 1 })
            .lean();
          if (!_.isEmpty(findRequest)) {
            await findRequest.map(async (item: any) => {
              // const lat1 = data.lat;
              // const lng1 = data.lng;
              // let lat2 = 0;
              // let lng2 = 0;
              // if (item.status === 'volunteer_accept') {
              //     lat2 = item.donor_accept.lat;
              //     lng2 = item.donor_accept.lng;
              // } else {
              //     lat2 = item.location.coordinates[1];
              //     lng2 = item.location.coordinates[0];
              // }
              // const geoDistance:any = await this.commonService.getDistanceTime(lat1,lng1,lat2,lng2);
              const updateData = {
                $set: {
                  'volunteer_accept.lat': data.lat,
                  'volunteer_accept.lng': data.lng,
                  // distance: geoDistance.distance?geoDistance.distance:0,
                  // duration:geoDistance.time?geoDistance.time:0,
                },
              };
              await this.foodRequestModel
                .findByIdAndUpdate(item._id, updateData)
                .select({ _id: 1 })
                .lean();
            });
          }
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/socket/socket.service.ts-updateCurrentLocation',
        data,
      );
      return;
    }
  }
}
