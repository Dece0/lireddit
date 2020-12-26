import { Box, Button, Link } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../components/InputField";
import Layout from "../components/Layout";
import { useLoginMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrlqClient";
import { toErrorMap } from "../utils/toErrorMap";

interface LoginProps {}

const Login: React.FC<LoginProps> = ({}) => {
    const router = useRouter();
    const [, Login] = useLoginMutation();

    return (
        <Layout variant="small">
            <Formik
                initialValues={{ usernameOrEmail: "", password: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const resp = await Login(values);

                    if (resp.data?.login.errors) {
                        console.log(resp.data.login.errors);
                        setErrors(toErrorMap(resp.data.login.errors));
                    }

                    if (resp.data?.login.user) {
                        if (typeof router.query.next === "string") {
                            router.push(router.query.next);
                        } else {
                            router.push("/");
                        }
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Box my={4}>
                            <InputField
                                name="usernameOrEmail"
                                placeholder="Set username or email"
                                label="Username or email"
                            />
                        </Box>
                        <Box my={4}>
                            <InputField
                                name="password"
                                placeholder="Set password"
                                label="Password"
                                type="password"
                            />
                        </Box>
                        <Box my={4}>
                            <NextLink href="/forgot-password">
                                <Link>Forgot password? </Link>
                            </NextLink>
                        </Box>
                        <Box my={4}>
                            <Button
                                type="submit"
                                colorScheme="teal"
                                isLoading={isSubmitting}
                            >
                                Login
                            </Button>
                        </Box>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient)(Login);
