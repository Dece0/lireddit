import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export const validateRegister = ({
    email,
    password,
    username,
}: UsernamePasswordInput) => {
    if (!email.includes("@")) {
        return [
            {
                field: "email",
                message: "Invalid email",
            },
        ];
    }

    if (username.includes("@")) {
        return [
            {
                field: "username",
                message: "Cannot include an @",
            },
        ];
    }

    if (username.length <= 2) {
        return [
            {
                field: "username",
                message: "Length must be greater than 2",
            },
        ];
    }

    if (password.length <= 3) {
        return [
            {
                field: "password",
                message: "Password must be greater than 3",
            },
        ];
    }

    return null;
};
