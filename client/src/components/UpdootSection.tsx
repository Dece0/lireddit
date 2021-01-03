import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import { PostSnippetFragment, useVoteMutation } from "../generated/graphql";

interface UpdootSectionProps {
    post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
    const [loadingState, setLoadingState] = useState<
        "updoot-loading" | "downdoot-loading" | "not-loading"
    >();
    const [, vote] = useVoteMutation();

    return (
        <Flex
            direction="column"
            justifyContent="center"
            alignItems="center"
            mr={4}
        >
            <IconButton
                variant={post.voteStatus === 1 ? "solid" : "outline"}
                isRound={true}
                aria-label="Search database"
                icon={<ChevronUpIcon />}
                onClick={async () => {
                    if (post.voteStatus === 1) {
                        return;
                    }
                    setLoadingState("updoot-loading");
                    await vote({
                        postId: post.id,
                        value: 1,
                    });
                    setLoadingState("not-loading");
                }}
                colorScheme={post.voteStatus === 1 ? "green" : "blue"}
                isLoading={loadingState === "updoot-loading"}
            />
            {post.points}
            <IconButton
                isRound={true}
                variant={post.voteStatus === -1 ? "solid" : "outline"}
                aria-label="Search database"
                icon={<ChevronDownIcon />}
                onClick={async () => {
                    if (post.voteStatus === -1) {
                        return;
                    }
                    setLoadingState("downdoot-loading");
                    await vote({
                        postId: post.id,
                        value: -1,
                    });
                    setLoadingState("not-loading");
                }}
                colorScheme={post.voteStatus === -1 ? "red" : "blue"}
                isLoading={loadingState === "downdoot-loading"}
            />
        </Flex>
    );
};
