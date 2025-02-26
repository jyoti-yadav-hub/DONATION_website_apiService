/* eslint-disable prettier/prettier */
import _ from 'lodash';
import {
    ArgumentsHost,
    HttpException,
    Catch,
    ExceptionFilter,
    ValidationPipe,
} from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { Request, Response } from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
const dotenv = require("dotenv");
dotenv.config({
    path: "./.env",
  });
// Format validation message
@Catch(HttpException)
export class ValidationExceptionFilter
    implements ExceptionFilter<HttpException>
{
    public catch(exception, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        let rstatus = status;
        if (status === 400 && exception.response.error === "Bad Request") {
            rstatus = 200;
        }

        response.status(rstatus).json({
            success: false,
            message: _.isArray(exception.response.message)
                ? exception.response.message[0]
                : exception.response.error,
        });
    }
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    if (process.env.NODE_ENV === 'production') {
        // Disable console logging in production
        app.useLogger(false);
    }
    
    app.setGlobalPrefix('api');
    app.enableCors();
    app.use('/uploads', express.static('uploads'));
    app.use('/.well-known', express.static('.well-known'));
    app.use('/pdf', express.static('pdf'));

    //Add validation
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            // whitelist: true,
        }),
    );
    app.useGlobalFilters(new ValidationExceptionFilter());
    const config = new DocumentBuilder()
        .setTitle('Saayam API')
        .setDescription('API list of Saayam')
        .setVersion('1.0')
        .addBearerAuth(
            {
                // I was also testing it without prefix 'Bearer ' before the JWT
                description: `[just text field] Please enter token in following format: Bearer <JWT>`,
                name: 'Authorization',
                bearerFormat: 'Bearer', // I`ve tested not to use this field, but the result was the same
                scheme: 'Bearer',
                type: 'http', // I`ve attempted type: 'apiKey' too
                in: 'Header',
            },
            'access-token', // This name here is important for matching up with @ApiBearerAuth() in your controller!
        )
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(process.env.PORT);
}
bootstrap();
