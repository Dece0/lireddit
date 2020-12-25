import argon2 from "argon2";
import {
    Arg,
    Ctx,
    Field,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";
import { getConnection } from "typeorm";
import { v4 } from "uuid";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { User } from "../entities/User";
import { MyContext } from "../types";
import { sendEmail } from "../utils/sendEmail";
import { validateRegister } from "../utils/validateRegister";
import { UsernamePasswordInput } from "./UsernamePasswordInput";

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
        @Ctx() { redis, req }: MyContext
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

        const user = await User.findOne(+userId);

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

        await user.save();

        req.session.userId = user.id;

        await redis.del(FORGET_PASSWORD_PREFIX + token);

        return { user };
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { redis }: MyContext
    ): Promise<boolean> {
        const user = await User.findOne({ where: { email } });
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
        @Ctx() { req }: MyContext
    ): Promise<User | undefined | null> {
        if (!req.session.userId) {
            return null;
        }

        return User.findOne(req.session.userId);
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options", () => UsernamePasswordInput)
        { username, password, email }: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister({ username, password, email });
        if (errors) {
            return { errors };
        }
        const hashedPassword = await argon2.hash(password);
        let user;
        try {
            const result = await getConnection()
                .createQueryBuilder()
                .insert()
                .into(User)
                .values({ email, username, password: hashedPassword })
                .returning("*")
                .execute();

            user = result.raw[0];
        } catch (error) {
            if (error.code = "23505") {
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
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(
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
