interface Vector2 {
    x: number,
    y: number,
};

export interface ParticleSystem<Particle> {
    /**
     * Single particle's visibility duration (seconds).
     */
    lifetime: number,

    getParticle: (initialParticle: Particle, normalizedAge: number) => Particle,

    newParticle: () => Particle,

    drawParticle: (
        particle: Particle,
        size: Vector2,
        ctx: CanvasRenderingContext2D
    ) => void,

    /**
     * Maximum particle count.
     */
    maxCount: number,
};

export interface ParticleState<Particle> {
    birthTime: number,
    initialData: Particle,
    currentData: Particle,
};

export interface ParticleSystemState<Particle> {
    particleSystem: ParticleSystem<Particle>,
    particleStates: ParticleState<Particle>[],
    lastSpawnTime: number,
};

const update = function <Particle>(
    state: ParticleSystemState<Particle>,
    delta: number,
): void {
    const { particleSystem } = state;

    const nowTime = performance.now() / 1000;

    const spawnDelta = particleSystem.lifetime / particleSystem.maxCount;
    const deathThreshold = nowTime - particleSystem.lifetime;

    const processedParticleStates = state.particleStates
        .map((state) => ({
            ...state,
            currentData: particleSystem.getParticle(
                state.initialData,
                (nowTime - state.birthTime) / particleSystem.lifetime,
            ),
        }))
        .filter((particle) => particle.birthTime > deathThreshold);

    if ((nowTime - state.lastSpawnTime) >= spawnDelta) {
        const particle = particleSystem.newParticle();

        state.lastSpawnTime = nowTime;
        state.particleStates = [
            ...processedParticleStates,
            {
                birthTime: nowTime,
                initialData: {...particle},
                currentData: {...particle},
            },
        ];
    } else {
        state.particleStates = processedParticleStates;
    }
};

const draw = function<Particle>(
    state: ParticleSystemState<Particle>,
    size: Vector2,
    ctx: CanvasRenderingContext2D,
): void {
    // NOTE: Background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size.x, size.y);

    state.particleStates.forEach((particleState) => {
        state.particleSystem.drawParticle(particleState.currentData, size, ctx);
    });
};

export const newParticleSystemState = function<Particle>(
    particleSystem: ParticleSystem<Particle>,
): ParticleSystemState<Particle> {
    return {
        lastSpawnTime: performance.now() / 1000,
        particleStates: [],
        particleSystem: particleSystem,
    };
};

export const tick = function<Particle>(
    state: ParticleSystemState<Particle>,
    size: Vector2,
    ctx: CanvasRenderingContext2D,
    delta: number,
) {
    update(state, delta);
    draw(state, size, ctx);
};
