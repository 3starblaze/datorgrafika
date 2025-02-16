import { useEffect, useRef, useState } from "react";
import { newParticleSystemState, ParticleSystem, tick } from "./particle_system";
import { Canvas } from "./render_util";

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

const makeParticleSystem = function(origin: Vector2): ParticleSystem<MyParticle> {
    return {
        getParticle(initial, age) {
            const weight = 100;

            const dx = Math.cos(initial.directionAngle) * age * weight;
            const dy = -Math.sin(initial.directionAngle) * age * weight;

            const x = initial.position.x + dx;
            const y = initial.position.y + dy;

            return {
                ...initial,
                position: { x, y },
                scale: initial.scale + 2 * age,
                opacity: (1 - age) * (1 - age),
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
            return {
                directionAngle: Math.random() * Math.PI * 2,
                position: origin,
                opacity: 1,
                scale: 1,
            };
        },
        lifetime: 4.0,
        maxCount: 100,
    };
};

export default function () {
    const [origin, setOrigin] = useState<Vector2>({ x: 40, y: 40});

    const particleSystem: ParticleSystem<MyParticle> = makeParticleSystem(origin);

    return (
        <div>
            <h2 className="text-4xl mb-4">Uzdevums (1b)</h2>

            <div>Origin: {JSON.stringify(origin)}</div>

            <Canvas
                onMouseMove={(event) => {
                    const elementOffset = event.currentTarget.getBoundingClientRect();
                    const x = event.clientX - elementOffset.x;
                    const y = event.clientY - elementOffset.y;
                    setOrigin({ x, y });
                }}
                particleSystem={particleSystem}
                width={400}
                height={400}
            />
        </div>
    );
};
