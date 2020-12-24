import { withUrqlClient } from "next-urql";
import NavBar from "../components/NavBar";
import { createUrqlClient } from "../utils/createUrlqClient";
import { usePostsQuery } from "../generated/graphql";

const Index = () => {
    const [{ data }] = usePostsQuery();

    return (
        <>
            <NavBar />
            <p>Hello</p>
            {!data
                ? null
                : data.posts.map((post) => (
                      <div key={post.id}>{post.title}</div>
                  ))}
        </>
    );
};

export default withUrqlClient(createUrqlClient)(Index);
