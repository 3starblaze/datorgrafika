import { useEffect, useRef } from "react";
import { newParticleSystemState, ParticleSystem, tick } from "./particle_system";

interface Vector2 {
    x: number,
    y: number,
};

type MyParticle = {
    /**
     * Flying direction as a counterclockwise angle relative to x axis.
     */
    directionAngle: number,
    position: Vector2,
    scale: number,
    opacity: number,
};

export default function () {
    const canvasEl = useRef<HTMLCanvasElement>(null);

    const particleSystem: ParticleSystem<MyParticle> = {
        getParticle(initial, age) {
            const weight = 50;

            const dx = Math.cos(initial.directionAngle) * age * weight;
            const dy = -Math.sin(initial.directionAngle) * age * weight;

            const x = initial.position.x + dx;
            const y = initial.position.y + dy;

            return {
                position: { x, y },
                scale: initial.scale + 1 * age,
                opacity: 1 - age,
            };
        },
        drawParticle({ position, scale, opacity }, size, ctx) {
            const width = 20 * scale;
            const height = 10 * scale;

            ctx.fillStyle = "#ff0000";
            ctx.globalAlpha = opacity;
            ctx.fillRect(position.x, position.y, width, height);
        },
        newParticle() {
            const x = 50;
            const y = 100;

            return {
                directionAngle: Math.random() * 2 * Math.PI,
                position: {
                    x,
                    y,
                },
                opacity: 1,
                scale: 1,
            };
        },
        lifetime: 4.0,
        maxCount: 40,
    };

    useEffect(() => {
        if (!canvasEl.current) return;
        const ctx = canvasEl.current.getContext("2d");
        if (!ctx) return;


        const velocityStrength = 20.0;

        const state = newParticleSystemState(particleSystem);
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
    }, []);

    return (
        <div>
            <h2 className="text-4xl mb-4">Uzdevums (1b)</h2>

            <canvas
                ref={canvasEl}
                width={400}
                height={400}
            >
            </canvas>
        </div>
    );
};
