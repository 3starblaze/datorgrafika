import { JSX } from "react";

export function H3(props: JSX.IntrinsicElements["h3"]) {
    return (
        <h3
            className="text-2xl my-4"
            {...props}
        />
    );
};

export function P(props: JSX.IntrinsicElements["p"]) {
    return (
        <p
            className="max-w-[40rem] my-2"
            {...props}
        />
    );
}
