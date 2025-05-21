import { JSX } from "react";

export function H2(props: JSX.IntrinsicElements["h2"]) {
    return (
        <h2
            className="text-4xl mb-4 mt-8"
            {...props}
        />
    );
};

export function H3(props: JSX.IntrinsicElements["h3"]) {
    return (
        <h3
            className="text-2xl my-4 mt-8"
            {...props}
        />
    );
};

export function H4(props: JSX.IntrinsicElements["h4"]) {
    return (
        <h4
            className="text-xl my-4 mt-8"
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
