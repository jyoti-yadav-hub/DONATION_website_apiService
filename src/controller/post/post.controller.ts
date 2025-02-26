import {
  Get,
  Put,
  Res,
  Post,
  Body,
  Query,
  Param,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { LikeDislikeDto } from './dto/like-dislike.dto';
import { CommentDto } from './dto/comment.dto';
import { FeedListDto } from './dto/feed-list.dto';
import { GetReasonDto } from './dto/get-reason.dto';

@Controller('post')
@ApiTags('Post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  //Api for create post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async createPost(@Body() createPostDto: CreatePostDto, @Res() res: Response) {
    return await this.postService.createPost(createPostDto, res);
  }

  // Api for post like dislike
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('like-dislike')
  async likeDislike(
    @Body() likeDislikeDto: LikeDislikeDto,
    @Res() res: Response,
  ) {
    return await this.postService.likeDislike(likeDislikeDto, res);
  }

  // Api for post likes user list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('like-user-list/:post_id')
  async likeUserList(
    @Param('post_id', IdMissing) post_id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.postService.likeUserList(post_id, query, res);
  }

  //Api for feed list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('feed-list/:id')
  async feedList(
    @Param('id', IdMissing) id: string,
    @Query() feedListDto: FeedListDto,
    @Res() res: Response,
  ) {
    return await this.postService.feedList(id, feedListDto, res);
  }

  //Api for create comment in post
  @UseGuards(AuthGuard)
  @Post('add-comment')
  @ApiBearerAuth('access-token')
  async addComment(@Body() commentDto: CommentDto, @Res() res: Response) {
    return await this.postService.addComment(commentDto, res);
  }

  //Api for update comment in post
  @UseGuards(AuthGuard)
  @Put('update-comment/:id')
  @ApiBearerAuth('access-token')
  async updateComment(
    @Param('id') id: string,
    @Body('comment') comment: string,
    @Res() res: Response,
  ) {
    return await this.postService.updateComment(id, comment, res);
  }

  //Api for delete comment in post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-comment/:id')
  async deleteComment(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.postService.deleteComment(id, res);
  }

  // Api for list comments of post
  @UseGuards(AuthGuard)
  @Get('comment-list/:id')
  @ApiBearerAuth('access-token')
  async commentList(
    @Param('id', IdMissing) id: string,
    @Query() query: string,
    @Res() res: Response,
  ) {
    return await this.postService.commentList(id, query, res);
  }

  //Api for feed list for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/feed-list/:id')
  async adminFeedList(
    @Param('id', IdMissing) id: string,
    @Query() feedListDto: FeedListDto,
    @Res() res: Response,
  ) {
    return await this.postService.feedList(id, feedListDto, res);
  }

  // Api for post likes list for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/like-user-list/:id')
  async postLikeList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.postService.likeUserList(id, query, res);
  }

  // Api for post comment list for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/comment-list/:id')
  @ApiBearerAuth('access-token')
  async postCommentList(
    @Param('id') id: string,
    @Query() query: string,
    @Res() res: Response,
  ) {
    return await this.postService.commentList(id, query, res);
  }

  //Api for report post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('report')
  async reportPost(@Body() reportPostDto: GetReasonDto, @Res() res: Response) {
    return await this.postService.reportPost(reportPostDto, res);
  }

  // Api for delete post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async deletePost(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.postService.deletePost(id, res);
  }

  //Api for block post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('block')
  async blockPost(@Body('id', IdMissing) id: string, @Res() res: Response) {
    return await this.postService.blockPost(id, res);
  }
}
