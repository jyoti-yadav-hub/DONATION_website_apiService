import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { Bookmark, BookmarkSchema} from './entities/bookmark.entity';
import { BookmarkItems, BookmarkItemsSchema } from './entities/bookmark-items.entity';
import { BookmarkService } from './bookmark.service';
import { BookmarkController } from './bookmark.controller';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [
        { name: Bookmark.name, schema: BookmarkSchema },
        { name: BookmarkItems.name, schema: BookmarkItemsSchema },
      ],
      'main_db',
    ),
  ],
  controllers: [BookmarkController],
  providers: [BookmarkService],
})
export class BookmarkModule {}
