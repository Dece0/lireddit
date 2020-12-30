import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { COOKIE_NAME, __prod__ } from "./constants";
import { MyContext } from "./types";
import cors from "cors";
import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from 'path';

const main = async () => {

    // db
    const conn = await createConnection({
        type: "postgres",
        database: "lireddit",
        username: "postgres",
        password: "root",
        logging: true,
        synchronize: true,
        migrationsRun: false,
        migrations: [path.join(__dirname, "./migrations/*")],
        entities: [Post, User]
    });

    // app
    const app = express();

    const RedisStore = connectRedis(session);
    const redis = new Redis();

    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true,
        })
    );

    // must be first before apollo server
    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redis,
                disableTouch: true,
                // disableTTL: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
                httpOnly: true,
                sameSite: "lax", // csrf
                secure: __prod__, // cookie only works in https, and localhost is https
            },
            saveUninitialized: false,
            secret: "random-string",
            resave: false,
        })
    );

    // graphql
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }): MyContext => ({ req, res, redis }),
    });

    apolloServer.applyMiddleware({
        app,
        cors: false,
    });

    app.listen(4000, () => console.log("Server started on localhost:4000"));
};

main().catch((err) => {
    console.log(err);
});
