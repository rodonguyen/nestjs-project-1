import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBookmarkDto, EditBookmarkDto } from "./dto";
import { Bookmark } from "@prisma/client";

@Injectable()
export class BookmarkService {
  constructor(private prismaService: PrismaService) {}

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    const bookmark = await this.prismaService.bookmark.create({
      data: {
        userId,
        ...dto,
      },
    });
    return bookmark;
  }

  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return this.prismaService.bookmark.findMany({
      where: {
        userId,
      },
    });
  }

  async getBookmarkById(userId: number, bookmarkId: number): Promise<Bookmark> {
    const bookmark = await this.prismaService.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    });

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found");
    }

    return bookmark;
  }

  async editBookmarkById(
    userId: number,
    bookmarkId: number,
    dto: EditBookmarkDto,
  ): Promise<Bookmark> {
    const bookmark = await this.prismaService.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    });

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found");
    }

    return this.prismaService.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...dto,
      },
    });
  }
  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prismaService.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found");
    }

    if (bookmark.userId !== userId) {
      throw new ForbiddenException("Access to resources denied");
    }

    await this.prismaService.bookmark.delete({
      where: {
        id: bookmarkId,
        userId,
      },
    });
  }
}
