import { Alert, AlertIcon, Center, Heading, Spinner } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import Layout from "../../components/Layout";
import { usePostQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrlqClient";

export const Post = () => {
    const router = useRouter();
    const id =
        typeof router.query.id === "string" ? parseInt(router.query.id) : -1;

    const [{ data, fetching }] = usePostQuery({
        pause: id === -1,
        variables: {
            id,
        },
    });

    if (fetching) {
        return (
            <Layout variant="small">
                <Center>
                    <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="blue.500"
                        size="xl"
                    />
                </Center>
            </Layout>
        );
    }

    if (!data?.post) {
        <Layout variant="small">
            <Center>
                <Alert status="error">
                    <AlertIcon />
                    Could not find post
                </Alert>
            </Center>
        </Layout>;
    }

    return (
        <Layout variant="small">
            <Heading>{data?.post?.title}</Heading>
            {data?.post?.text}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
