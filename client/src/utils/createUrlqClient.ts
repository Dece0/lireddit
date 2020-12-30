import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import Router from "next/router";
import {
    dedupExchange,
    Exchange,
    fetchExchange,
    stringifyVariables,
} from "urql";
import { pipe, tap } from "wonka";
import {
    LoginMutation,
    LogoutMutation,
    MeDocument,
    MeQuery,
    RegisterMutation,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";

const errorExchange: Exchange = ({ forward }) => (ops$) => {
    return pipe(
        forward(ops$),
        tap(({ error }) => {
            if (error?.message.includes("Not authenticated")) {
                Router.replace("/login");
            }
        })
    );
};

const cursorPagination = (): Resolver => {
    return (_parent, fieldArgs, cache, info) => {
        const { parentKey: entityKey, fieldName } = info;
        const allFields = cache.inspectFields(entityKey);
        console.log("allFields: ", allFields);
        const fieldInfos = allFields.filter(
            (info) => info.fieldName === fieldName
        );
        const size = fieldInfos.length;
        if (size === 0) {
            return undefined;
        }

        const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
        const isItInTheCache = cache.resolve(
            cache.resolve(entityKey, fieldKey) as string,
            "posts"
        );
        info.partial = !isItInTheCache;
        const results: string[] = [];
        let hasMore = true;
        fieldInfos.forEach((fi) => {
            const key = cache.resolve(entityKey, fi.fieldKey) as string;
            const data = cache.resolve(key, "posts") as string[];
            const _hasMore = cache.resolve(key, "hasMore");
            console.log("key", key);
            console.log("data", data);
            console.log("hasMore", _hasMore);
            if (!_hasMore) {
                hasMore = _hasMore as boolean;
            }
            results.push(...data);
        });
        return {
            // typename is very important key to return with data
            __typename: "PaginatedPosts",
            hasMore,
            posts: results
        };

        // const visited = new Set();
        // let result: NullArray<string> = [];
        // let prevOffset: number | null = null;

        // for (let i = 0; i < size; i++) {
        //   const { fieldKey, arguments: args } = fieldInfos[i];
        //   if (args === null || !compareArgs(fieldArgs, args)) {
        //     continue;
        //   }

        //   const links = cache.resolveFieldByKey(entityKey, fieldKey) as string[];
        //   const currentOffset = args[cursorArgument];

        //   if (
        //     links === null ||
        //     links.length === 0 ||
        //     typeof currentOffset !== "number"
        //   ) {
        //     continue;
        //   }

        //   if (!prevOffset || currentOffset > prevOffset) {
        //     for (let j = 0; j < links.length; j++) {
        //       const link = links[j];
        //       if (visited.has(link)) continue;
        //       result.push(link);
        //       visited.add(link);
        //     }
        //   } else {
        //     const tempResult: NullArray<string> = [];
        //     for (let j = 0; j < links.length; j++) {
        //       const link = links[j];
        //       if (visited.has(link)) continue;
        //       tempResult.push(link);
        //       visited.add(link);
        //     }
        //     result = [...tempResult, ...result];
        //   }

        //   prevOffset = currentOffset;
        // }

        // const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
        // if (hasCurrentPage) {
        //   return result;
        // } else if (!(info as any).store.schema) {
        //   return undefined;
        // } else {
        //   info.partial = true;
        //   return result;
        // }
    };
};

export const createUrqlClient = (ssrExchange: any) => ({
    url: "http://localhost:4000/graphql",
    fetchOptions: {
        credentials: "include" as const,
    },
    exchanges: [
        dedupExchange,
        cacheExchange({
            keys: {
                PaginatedPosts: () => null
            },
            resolvers: {
                Query: {
                    posts: cursorPagination(),
                },
            },
            updates: {
                Mutation: {
                    logout: (_result, args, cache) => {
                        betterUpdateQuery<LogoutMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            () => ({ me: null })
                        );
                    },
                    login: (_result, args, cache) => {
                        betterUpdateQuery<LoginMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.login.errors) {
                                    return query;
                                }
                                if (result.login.user) {
                                    return {
                                        me: result.login.user,
                                    };
                                }
                            }
                        );
                    },
                    register: (_result, args, cache) => {
                        betterUpdateQuery<RegisterMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.register.errors) {
                                    return query;
                                }
                                if (result.register.user) {
                                    return {
                                        me: result.register.user,
                                    };
                                }
                            }
                        );
                    },
                },
            },
        }),
        errorExchange,
        ssrExchange,
        fetchExchange,
    ],
});
