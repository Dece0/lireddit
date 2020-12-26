import { Box, Button, Link } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { useState } from "react";
import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";
import { useChangePasswordMutation } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrlqClient";
import { toErrorMap } from "../../utils/toErrorMap";
import NextLink from "next/link";

const ChangePassword: NextPage = () => {
    const [, changePassword] = useChangePasswordMutation();
    const router = useRouter();
    const [tokenError, setTokenError] = useState("");

    return (
        <>
            <Wrapper variant="small">
                <Formik
                    initialValues={{ newPassword: "" }}
                    onSubmit={async ({ newPassword }, { setErrors }) => {
                        const resp = await changePassword({
                            newPassword,
                            token:
                                typeof router.query.token === "string"
                                    ? router.query.token
                                    : "",
                        });

                        if (resp.data?.changePassword.errors) {
                            const errorMap = toErrorMap(
                                resp.data.changePassword.errors
                            );
                            if ("token" in errorMap) {
                                setTokenError(errorMap.token);
                            } else {
                                setErrors(errorMap);
                            }
                        }

                        if (resp.data?.changePassword.user) {
                            router.push("/");
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <Box my={4}>
                                <InputField
                                    name="newPassword"
                                    placeholder="Set new password"
                                    label="New Password"
                                    type="password"
                                />
                            </Box>
                            {!tokenError ? null : (
                                <Box>
                                    <Box style={{ color: "red" }}>
                                        {tokenError}
                                    </Box>
                                    <Box>
                                        <NextLink href="/forgot-password">
                                            <Link>Go forget it again</Link>
                                        </NextLink>
                                    </Box>
                                </Box>
                            )}
                            <Box my={4}>
                                <Button
                                    type="submit"
                                    colorScheme="teal"
                                    isLoading={isSubmitting}
                                >
                                    Change password
                                </Button>
                            </Box>
                        </Form>
                    )}
                </Formik>
            </Wrapper>
        </>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(ChangePassword);
