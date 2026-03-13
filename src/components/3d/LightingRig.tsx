import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { LIGHTING_PRESETS, type LightingMode, type LightPos, type PresetsType } from '../../services/designService';

export function LightingRig({
    mode,
    lightPos,
}: {
    mode: LightingMode;
    lightPos: LightPos;
}) {
    const preset = LIGHTING_PRESETS[mode];

    return (
        <>
            {/* Ambient — soft fill everywhere */}
            <ambientLight intensity={preset.ambientIntensity} />

            {/* Primary directional — sun / window source, casts hard shadows */}
            <directionalLight
                position={[lightPos.x, lightPos.y, lightPos.z]}
                intensity={preset.directionalIntensity}
                color={preset.directionalColor}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-near={0.5}
                shadow-camera-far={60}
                shadow-camera-left={-12}
                shadow-camera-right={12}
                shadow-camera-top={12}
                shadow-camera-bottom={-12}
                shadow-bias={-0.0008}
                shadow-normalBias={0.02}
            />

            {/* Secondary fill — opposite side, much softer, no shadows */}
            <directionalLight
                position={[-lightPos.x, lightPos.y * 0.5, -lightPos.z]}
                intensity={preset.ambientIntensity * 1.5}
                color="#ffffff"
            />

            {/* Ground bounce — very subtle upward light simulating floor reflection */}
            <hemisphereLight
                args={[preset.directionalColor as THREE.ColorRepresentation, '#c8b89a', preset.ambientIntensity * 0.3]}
            />

            {/* Environment for reflections / IBL */}
            <Environment preset={preset.environmentPreset as PresetsType} />
        </>
    );
}
