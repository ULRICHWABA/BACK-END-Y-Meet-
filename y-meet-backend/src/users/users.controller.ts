import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.usersService.register(createUserDto);
    }

    @Get('verify/:token')
    async verifyEmail(@Param('token') token: string) {
        return this.usersService.verifyEmail(token);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
      return this.usersService.login(loginDto);
    }
}

