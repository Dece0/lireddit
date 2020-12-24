import {
    Arg,
    Ctx,
    Field,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { em, redis, req }: MyContext
    ): Promise<UserResponse> {
        const userId = await redis.get(FORGET_PASSWORD_PREFIX + token);
        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "Token expired",
                    },
                ],
            };
        }

        const user = await em.findOne(User, { id: +userId });

        if (!user) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "User no longer exists",
                    },
                ],
            };
        }

        if (newPassword.length <= 3) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "Password must be greater than 3",
                    },
                ],
            };
        }

        const newHashedPasword = await argon2.hash(newPassword);
        user.password = newHashedPasword;

        await em.persistAndFlush(user);

        req.session.userId = user.id;

        await redis.del(FORGET_PASSWORD_PREFIX + token);

        return { user };
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { em, redis }: MyContext
    ): Promise<boolean> {
        const user = await em.findOne(User, { email });
        if (!user) {
            return true;
        }

        const token = v4();

        await redis.set(
            FORGET_PASSWORD_PREFIX + token,
            user.id,
            "ex",
            1000 * 60 * 60 * 24 * 3
        ); // 3 days

        await sendEmail(
            email,
            `<a href="http://localhost:3000/change-password/${token}">Reset password</a>`
        );
        return true;
    }

    @Query(() => User, { nullable: true }) async me(
        @Ctx() { req, em }: MyContext
    ): Promise<User | null> {
        if (!req.session.userId) {
            return null;
        }

        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options", () => UsernamePasswordInput)
        { username, password, email }: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister({ username, password, email });
        if (errors) {
            return { errors };
        }
        const hashedPassword = await argon2.hash(password);
        const user = em.create(User, {
            email,
            username,
            password: hashedPassword,
        });
        try {
            await em.persistAndFlush(user);
        } catch (error) {
            if (error.detail.include("already exists")) {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username already taken",
                        },
                    ],
                };
            }
        }

        req.session.userId = user.id;

        return {
            user,
        };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(
            User,
            usernameOrEmail.includes("@")
                ? { email: usernameOrEmail }
                : { username: usernameOrEmail }
        );
        if (!user) {
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "Username or email does not exist",
                    },
                ],
            };
        }

        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                errors: [{ field: "password", message: "Incorrect password" }],
            };
        }

        req.session.userId = user.id;

        return {
            user,
        };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
        return new Promise<boolean>((resolve) =>
            req.session.destroy((err: any) => {
                res.clearCookie(COOKIE_NAME);
                if (err) {
                    resolve(false);
                }
                resolve(true);
            })
        );
    }
}
