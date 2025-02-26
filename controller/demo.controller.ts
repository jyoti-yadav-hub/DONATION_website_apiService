import { Request, Response } from 'express';
import { Controller, Get, Req, Res } from '@nestjs/common';

@Controller()
export class DemoController {
  @Get('/post')
  async getApi(@Req() req: Request, @Res() res: Response): Promise<any> {
    return res.json({
      data: 'flooo',
    });
    // return 'Hello World!sadadasd';
  }

  @Get('create/new')
  createNew(): string {
    return 'Hello World!dsdfsdfsdsdfs';
  }
}
