import { useEffect, useRef } from "react";

interface Vector2 {
    x: number,
    y: number,
};

type ValueGenerator<Value> = (seed: number) => Value;

interface ParticleSystem {
    /**
     * Single particle's visibility duration (seconds).
     */
    lifetime: number,
    /**
     * Linear velocity that the particle starts with (px/s).
     */
    linearVelocityGenerator: ValueGenerator<Vector2>,
    /**
     * Maximum particle count.
     */
    maxCount: number,
    /**
     * Particle spawn position.
     */
    origin: Vector2,
};

interface ParticleSystemState {
    particleSystem: ParticleSystem,
    particles: Particle[],
    lastSpawnTime: number,
};

interface Particle {
    birthTime: number,
    position: Vector2,
    linearVelocity: Vector2,
};

const applyLinearVelocity = function(
    particle: Particle,
    delta: number,
): Particle {
    const position = {
        x: particle.position.x + particle.linearVelocity.x * delta,
        y: particle.position.y + particle.linearVelocity.y * delta,
    };

    return {
        ...particle,
        position,
    };
};

const initParticleSystemState = function(
    particleSystem: ParticleSystem,
): ParticleSystemState {
    return {
        particleSystem,
        particles: [],
        lastSpawnTime: 0,
    };
};

const tick = function(
    state: ParticleSystemState,
    delta: number,
): void {
    const { particleSystem } = state;

    const nowTime = performance.now() / 1000;

    const spawnDelta = particleSystem.lifetime / particleSystem.maxCount;
    const deathThreshold = nowTime - particleSystem.lifetime;

    const processedParticles: Particle[] = state.particles
        .map((particle) => applyLinearVelocity(particle, delta / 1000))
        .filter((particle) => particle.birthTime > deathThreshold);

    if ((nowTime - state.lastSpawnTime) >= spawnDelta) {
        state.lastSpawnTime = nowTime;
        state.particles = [
            ...processedParticles,
            {
                birthTime: nowTime,
                position: particleSystem.origin,
                linearVelocity: particleSystem.linearVelocityGenerator(Math.random()),
            },
        ];
    } else {
        state.particles = processedParticles;
    }
};

const draw = function(
    state: ParticleSystemState,
    size: Vector2,
    ctx: CanvasRenderingContext2D,
): void {
    // NOTE: Background
    ctx.fillStyle = "#aa0000";
    ctx.fillRect(0, 0, size.x, size.y);

    ctx.fillStyle = "#000000";

    state.particles.forEach((particle) => {
        ctx.fillRect(particle.position.x, particle.position.y, 10, 10);
    });
};

export default function () {
    const canvasEl = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasEl.current) return;
        const ctx = canvasEl.current.getContext("2d");
        if (!ctx) return;


        const velocityStrength = 20.0;

        const particleSystem: ParticleSystem = {
            lifetime: 2.0,
            linearVelocityGenerator: (seed) => {
                const angle = seed * 2 * Math.PI;
                return {
                    x: velocityStrength * Math.cos(angle),
                    y: -velocityStrength * Math.sin(angle),
                };
            },
            maxCount: 100,
            origin: { x: 100, y: 100 },
        };

        const state = initParticleSystemState(particleSystem);
        const size = {
            x: canvasEl.current.width,
            y: canvasEl.current.height,
        };

        let now = performance.now();
        const callback = (timestamp: number) => {
            const delta = timestamp - now;
            now = timestamp;
            tick(state, delta);
            draw(state, size, ctx);
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
