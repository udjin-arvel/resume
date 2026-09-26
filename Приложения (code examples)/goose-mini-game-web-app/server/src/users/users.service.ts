import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({where: {username}});
  }

  async createUser(username: string, password: string, role: string) {
    return this.prisma.user.create({data: {username, password, role}});
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({where: {id}});
  }
}
