import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable({})
export class AuthService {
    constructor( private prismaService: PrismaService ){}

    signup(){
        return {msg: "i am signup"};
    }

    signin(){
        return {msg: "i am signin"};
    }

}