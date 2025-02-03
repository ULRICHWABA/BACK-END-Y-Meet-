import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MeetingsModule } from './meetings/meetings.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Rendre les variables d'environnement accessibles dans toute l'application
    }),
    MongooseModule.forRoot(getMongoUri()),
    UsersModule,
    MeetingsModule,
    MeetingsModule,
  
  ],
  controllers: [ ],
})
export class AppModule {}

function getMongoUri(): string {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in the environment variables');
  }
  
  return mongoUri;
}
