import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EditUserDto } from "./dto";

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async editUser(userId: number, dto: EditUserDto) {
    if (!dto || Object.keys(dto).length === 0) {
      const user = await this.prismaService.user.findFirstOrThrow({
        where: { id: userId },
      });
      delete user.hash;
      return user;
    }

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: { ...dto },
    });

    delete user.hash;
    return user;
  }
}
