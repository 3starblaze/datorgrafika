import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import hljs from "highlight.js";
import "highlight.js/styles/stackoverflow-light.min.css";
import { H3 } from "./typography";

export const SourceCode = function ({
    title,
    contentString,
}: {
    title: string,
    contentString: string,
}) {
    const highlightedElement = hljs.highlight(contentString, {
        language: "tsx",
    }).value;

    return (
        <Collapsible
            className="border-l-4 border-black"
        >
            <CollapsibleTrigger
                className="px-2 pb-0 font-bold underline cursor-pointer"
            >
                <span>{title}</span>
            </CollapsibleTrigger>
            <CollapsibleContent
                className="p-4 overflow-x-scroll"
            >
                <pre dangerouslySetInnerHTML={{ __html: highlightedElement }} />
            </CollapsibleContent>
        </Collapsible>
    );
};

export const SourceCodeSection = function ({
    sources,
}: {
    sources: {title: string, contentString: string}[]
}) {
    return (
        <>
            <H3>Pirmkods</H3>
            {sources.map((props) => (<SourceCode key={props.title} {...props} />))}
        </>
    );
};
