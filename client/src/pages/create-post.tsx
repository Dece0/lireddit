import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../components/InputField";
import Layout from "../components/Layout";
import { useCreatePostMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrlqClient";
import { useIsAuth } from "../utils/userIsAuth";

const CreatePost = () => {
    const router = useRouter();
    const [, createPost] = useCreatePostMutation();
    useIsAuth();

    return (
        <Layout variant="small">
            <Formik
                initialValues={{ title: "", text: "" }}
                onSubmit={async (values) => {
                    const { error } = await createPost({
                        input: values,
                    });
                    if (!error) {
                        router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Box my={4}>
                            <InputField
                                name="title"
                                placeholder="Set title"
                                label="Title"
                            />
                        </Box>
                        <Box my={4}>
                            <InputField
                                textarea={true}
                                name="text"
                                placeholder="Set your text"
                                label="Text"
                            />
                        </Box>
                        <Box my={4}>
                            <Button
                                type="submit"
                                colorScheme="teal"
                                isLoading={isSubmitting}
                            >
                                Create post
                            </Button>
                        </Box>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(CreatePost);
