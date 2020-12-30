import { Box, Button, Flex, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = ({}) => {
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
    const [{ data, fetching }] = useMeQuery({
        pause: isServer(),
    });

    let body = null;

    if (!fetching) {
        body = null;
    }

    if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link mr={2} color="white">
                        Login
                    </Link>
                </NextLink>
                <NextLink href="/register">
                    <Link color="white">Register</Link>
                </NextLink>
            </>
        );
    }

    if (data?.me) {
        body = (
            <Flex alignItems="center">
                <Box color="white" mr={4}>
                    {data.me.username}
                </Box>
                <Box mr={4}>
                    <NextLink href="/create-post">
                        <Link color="white">Create new post</Link>
                    </NextLink>
                </Box>
                <Link
                    color="white"
                    onClick={() => logout()}
                    isLoading={logoutFetching}
                >
                    Logout
                </Link>
            </Flex>
        );
    }

    return (
        <Flex
            bg="tomato"
            position="sticky"
            zIndex={1}
            top={0}
            p={4}
            ml={"auto"}
        >
            <Box>
                <NextLink href="/">
                    <Link color="white">LiReddit</Link>
                </NextLink>
            </Box>
            <Box ml="auto">{body}</Box>
        </Flex>
    );
};

export default NavBar;
