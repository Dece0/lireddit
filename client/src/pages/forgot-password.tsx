import { Alert, AlertIcon, Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useForgotPasswordMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrlqClient";

const ForgotPassword = () => {
    const [complete, setComplete] = useState(false);
    const [, forgotPassword] = useForgotPasswordMutation();

    return (
        <>
            <Wrapper variant="small">
                <Formik
                    initialValues={{ email: "" }}
                    onSubmit={async ({ email }) => {
                        await forgotPassword({ email });
                        setComplete(true);
                    }}
                >
                    {({ isSubmitting }) =>
                        complete ? (
                            <Alert status="success">
                                <AlertIcon />
                                If an account with that email exists, we sent
                                you can email
                            </Alert>
                        ) : (
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
                                    <Button
                                        type="submit"
                                        colorScheme="teal"
                                        isLoading={isSubmitting}
                                    >
                                        Forgot password
                                    </Button>
                                </Box>
                            </Form>
                        )
                    }
                </Formik>
            </Wrapper>
        </>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(ForgotPassword);
