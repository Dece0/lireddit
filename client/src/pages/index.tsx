import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Center,
    Heading,
    Spinner,
    Stack,
    Text,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import React from "react";
import { useState } from "react";
import Layout from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrlqClient";

const Index = () => {
    const [variables, setVariables] = useState({
        limit: 10,
        cursor: null as null | string,
    });
    const [{ data, fetching }] = usePostsQuery({
        variables,
    });

    if (!data && !fetching) {
        return (
            <Alert status="error">
                <AlertIcon />
                Something is wrong with graphql
            </Alert>
        );
    }

    return (
        <Layout variant="regular">
            {!data && fetching ? (
                <Center>
                    <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="blue.500"
                        size="xl"
                    />
                </Center>
            ) : (
                <Stack spacing={8}>
                    {data!.posts.posts.map((post) => (
                        <Box key={post.id} p={5} shadow="md" borderWidth="1px">
                            <Heading fontSize="xl">{post.title}</Heading>
                            <Text mt={4}>{post.textSnippet}</Text>
                        </Box>
                    ))}
                </Stack>
            )}
            {data && data.posts.hasMore ? (
                <Center my={4}>
                    <Button
                        isLoading={fetching}
                        colorScheme="red"
                        onClick={() => {
                            setVariables({
                                limit: variables.limit,
                                cursor:
                                    data.posts.posts[
                                        data.posts.posts.length - 1
                                    ].createdAt,
                            });
                        }}
                    >
                        Load more
                    </Button>
                </Center>
            ) : null}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient)(Index);
