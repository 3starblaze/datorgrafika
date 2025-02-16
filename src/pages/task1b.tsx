import { useEffect, useRef } from "react";

export default function () {
    const canvasEl = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasEl.current) return;
        const ctx = canvasEl.current.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#aa0000";
        ctx.fillRect(0, 0, canvasEl.current.width, canvasEl.current.height);
    }, []);

    return (
        <div>
            <h2 className="text-4xl mb-4">Uzdevums (1b)</h2>

            <canvas
                ref={canvasEl}
                style={{
                    width: 100,
                    height: 100,
                }}
            >
            </canvas>
        </div>
    );
};
