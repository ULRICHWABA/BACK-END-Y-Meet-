    import { Injectable, BadRequestException } from '@nestjs/common';
    import { InjectModel } from '@nestjs/mongoose';
    import { Model } from 'mongoose';
    import * as bcrypt from 'bcrypt';
    import * as jwt from 'jsonwebtoken';
    import * as nodemailer from 'nodemailer';
    import { User, UserDocument } from './users.schema';
    import { ConfigService } from '@nestjs/config';
    import { CreateUserDto } from './dto/create-user.dto';
    import { LoginDto } from './dto/login.dto';

    @Injectable()
    export class UsersService {
        private transporter;

        constructor(
            @InjectModel(User.name) private userModel: Model<UserDocument>,
            private configService: ConfigService,
        ) {
            // Configuration de Nodemailer
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: this.configService.get<string>('EMAIL_USER'),
                    pass: '7139 9555', // Remplacez par votre mot de passe d'application
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });
        }
        async login(loginDto: LoginDto): Promise<any> {
            const { email, password } = loginDto;
        
            // Vérifier si l'utilisateur existe
            const user = await this.userModel.findOne({ email });
            if (!user) {
            throw new BadRequestException('Email ou mot de passe incorrect.');
            }
        
            // Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
            throw new BadRequestException('Email ou mot de passe incorrect.');
            }
        
            // Vérifier si le compte est activé
            if (!user.isVerified) {
            throw new BadRequestException('Votre compte n’est pas encore vérifié.');
            }
        
            // Générer le token JWT
            const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
            const token = jwt.sign({ userId: user._id, email: user.email }, jwtSecret, {
            expiresIn: '24h',
            });
        
            return { message: 'Connexion réussie !', token };
        }

        async register(createUserDto: CreateUserDto): Promise<any> {
            const { name, email, password, username } = createUserDto;

            try {
                // Vérifier si l'email ou le nom d'utilisateur existe déjà
                const existingUserByEmail = await this.userModel.findOne({ email });
                if (existingUserByEmail) {
                    throw new BadRequestException('Cet email est déjà utilisé.');
                }

                const existingUserByUsername = await this.userModel.findOne({ username });
                if (existingUserByUsername) {
                    throw new BadRequestException('Ce nom d\'utilisateur est déjà pris.');
                }

                // Hasher le mot de passe
                const hashedPassword = await bcrypt.hash(password, 10);

                // Générer un token de vérification
                const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
                const verificationToken = jwt.sign({ email }, jwtSecret, { expiresIn: '48h' });

                // Créer et enregistrer l'utilisateur
                const newUser = new this.userModel({
                    name,
                    email,
                    username: username || `user_${Date.now()}`,
                    password: hashedPassword,
                    isVerified: false,
                });

                await newUser.save();

                // Envoyer l'email de vérification
                const verificationUrl = `http://localhost:3000/users/verify/${verificationToken}`;
                await this.transporter.sendMail({
                    from: this.configService.get<string>('EMAIL_USER'),
                    to: email,
                    subject: 'Vérifiez votre email',
                    html: `<p>Veuillez cliquer sur le lien suivant pour vérifier votre email :</p>
                        <a href="${verificationUrl}">Vérifier mon compte</a>`,
                });

                return { message: 'Inscription réussie ! Vérifiez votre email pour l’activer.' };
            } catch (error) {
                if (error.code === 11000) {
                    throw new BadRequestException('Erreur lors de l\'enregistrement de l\'utilisateur. Nom d\'utilisateur ou email déjà pris.');
                }
                console.error('Erreur lors de l\'inscription:', error);
                throw new BadRequestException('Une erreur est survenue lors de l\'inscription.'); // Message générique pour d'autres erreurs
            }
        }

        async verifyEmail(token: string): Promise<any> {
            const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
            let decoded: any;

            try {
                decoded = jwt.verify(token, jwtSecret);
            } catch (error) {
                throw new BadRequestException('Token invalide ou expiré.');
            }

            const user = await this.userModel.findOne({ email: decoded.email });
            if (!user) {
                throw new BadRequestException('Utilisateur non trouvé.');
            }

            user.isVerified = true;
            await user.save();

            return { message: 'Email vérifié avec succès !' };
        }
    }