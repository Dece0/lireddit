import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../components/InputField";
import Layout from "../components/Layout";
import { useRegisterMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrlqClient";
import { toErrorMap } from "../utils/toErrorMap";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
    const router = useRouter();
    const [, register] = useRegisterMutation();

    return (
        <Layout variant="small">
            <Formik
                initialValues={{ email: "", username: "", password: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const resp = await register({ options: values });

                    if (resp.data?.register.errors) {
                        setErrors(toErrorMap(resp.data.register.errors));
                    }

                    if (resp.data?.register.user) {
                        router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Box my={4}>
                            <InputField
                                name="email"
                                placeholder="Set email"
                                label="Email"
                                type="email"
                            />
                        </Box>
                        <Box my={4}>
                            <InputField
                                name="username"
                                placeholder="Set username"
                                label="Username"
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
                            <Button
                                type="submit"
                                colorScheme="teal"
                                isLoading={isSubmitting}
                            >
                                Register
                            </Button>
                        </Box>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient)(Register);
