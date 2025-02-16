import { JSX, useEffect, useRef } from "react";
import { newParticleSystemState, ParticleSystem, ParticleSystemState, tick } from "./particle_system";

export const Canvas = function<Particle>({
    particleSystem,
    width,
    height,
    ...props
}: {
    particleSystem: ParticleSystem<Particle>,
    width: number,
    height: number,
} & JSX.IntrinsicElements["canvas"]) {
    const canvasEl = useRef<HTMLCanvasElement>(null);
    const systemState = useRef<ParticleSystemState<Particle>>(null);

    useEffect(() => {
        if (!canvasEl.current) return;
        const ctx = canvasEl.current.getContext("2d");
        if (!ctx) return;

        if (systemState.current) {
            systemState.current.particleSystem = particleSystem;
        } else {
            systemState.current = newParticleSystemState(particleSystem);
        }

        const state = systemState.current;

        const size = {
            x: canvasEl.current.width,
            y: canvasEl.current.height,
        };

        let now = performance.now();
        const callback = (timestamp: number) => {
            const delta = timestamp - now;
            now = timestamp;
            tick(state, size, ctx, delta / 1000);
            requestAnimationFrame(callback);
        };

        requestAnimationFrame(callback);
    }, [particleSystem]);

    return (
        <canvas
            {...props}
            ref={canvasEl}
            width={400}
            height={400}
        />
    );
};
