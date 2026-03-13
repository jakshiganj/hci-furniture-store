import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

export type WallTexture = 'plain' | 'subtle-linen' | 'brick' | 'wood-panel' | 'concrete';

// ── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [200, 190, 175];
}

// ── Wall texture generator ────────────────────────────────────────────────────

function generateWallTexture(wallColor: string, type: WallTexture): THREE.CanvasTexture {
    const S = 512;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const [r, g, b] = hexToRgb(wallColor);

    ctx.fillStyle = wallColor;
    ctx.fillRect(0, 0, S, S);

    if (type === 'plain') {
        // Subtle painted-wall noise — no perfectly flat surface
        const id = ctx.getImageData(0, 0, S, S);
        for (let i = 0; i < id.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 14;
            id.data[i]   = Math.min(255, Math.max(0, id.data[i]   + n));
            id.data[i+1] = Math.min(255, Math.max(0, id.data[i+1] + n));
            id.data[i+2] = Math.min(255, Math.max(0, id.data[i+2] + n));
        }
        ctx.putImageData(id, 0, 0);
        // Subtle roller streaks
        for (let i = 0; i < 12; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.01 + Math.random() * 0.015})`;
            ctx.fillRect(0, Math.random() * S, S, 1 + Math.random() * 2);
        }

    } else if (type === 'subtle-linen') {
        // Woven crosshatch fabric
        const spacing = 4;
        for (let y = 0; y < S; y += spacing) {
            ctx.fillStyle = `rgba(0,0,0,0.045)`;
            ctx.fillRect(0, y, S, 1);
            ctx.fillStyle = `rgba(255,255,255,0.025)`;
            ctx.fillRect(0, y + 2, S, 1);
        }
        for (let x = 0; x < S; x += spacing) {
            const alpha = 0.025 + (x % (spacing * 2) === 0 ? 0.02 : 0);
            ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            ctx.fillRect(x, 0, 1, S);
        }
        // Slight shimmer from fibres
        for (let i = 0; i < 60; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.015 + Math.random() * 0.02})`;
            ctx.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 3, 1);
        }

    } else if (type === 'brick') {
        const BW = 76, BH = 30, M = 5;
        // Mortar base — slightly lighter
        ctx.fillStyle = `rgba(255,255,255,0.15)`;
        ctx.fillRect(0, 0, S, S);

        for (let row = 0; row <= Math.ceil(S / BH) + 1; row++) {
            const offset = row % 2 === 0 ? 0 : BW / 2;
            const y = row * BH;
            for (let col = -1; col <= Math.ceil(S / BW) + 1; col++) {
                const x = col * BW + offset;
                // Per-brick colour variation
                const v = (Math.random() - 0.5) * 22;
                ctx.fillStyle = `rgb(${Math.min(255,Math.max(0,r+v))},${Math.min(255,Math.max(0,g+v))},${Math.min(255,Math.max(0,b+v))})`;
                ctx.fillRect(x + M/2, y + M/2, BW - M, BH - M);
                // Top specular
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                ctx.fillRect(x + M/2, y + M/2, BW - M, 3);
                // Bottom shadow
                ctx.fillStyle = 'rgba(0,0,0,0.08)';
                ctx.fillRect(x + M/2, y + BH - M - 3, BW - M, 3);
                // Side shadow (left edge of each brick)
                ctx.fillStyle = 'rgba(0,0,0,0.05)';
                ctx.fillRect(x + M/2, y + M/2, 2, BH - M);
            }
        }

    } else if (type === 'wood-panel') {
        const PW = 58;
        for (let col = 0; col <= Math.ceil(S / PW) + 1; col++) {
            const x = col * PW;
            // Panel base tint variation
            const v = (Math.random() - 0.5) * 16;
            ctx.fillStyle = `rgb(${Math.min(255,Math.max(0,r+v))},${Math.min(255,Math.max(0,g+v))},${Math.min(255,Math.max(0,b+v))})`;
            ctx.fillRect(x + 3, 0, PW - 3, S);
            // Grain lines
            for (let gn = 0; gn < 7; gn++) {
                const gx = x + 7 + gn * 7;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0,0,0,${0.035 + Math.random() * 0.055})`;
                ctx.lineWidth = 0.8;
                ctx.moveTo(gx + (Math.random() - 0.5) * 2, 0);
                for (let py = 0; py <= S; py += 35) {
                    ctx.lineTo(gx + Math.sin(py * 0.014 + gn) * 2.5 + (Math.random() - 0.5), py);
                }
                ctx.stroke();
            }
            // Panel left-edge shadow
            ctx.fillStyle = 'rgba(0,0,0,0.16)';
            ctx.fillRect(x, 0, 3, S);
            // Panel right-edge highlight
            ctx.fillStyle = 'rgba(255,255,255,0.07)';
            ctx.fillRect(x + 3, 0, 1.5, S);
        }

    } else if (type === 'concrete') {
        // Base noise
        const id = ctx.getImageData(0, 0, S, S);
        for (let i = 0; i < id.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 28;
            id.data[i]   = Math.min(255, Math.max(0, id.data[i]   + n));
            id.data[i+1] = Math.min(255, Math.max(0, id.data[i+1] + n));
            id.data[i+2] = Math.min(255, Math.max(0, id.data[i+2] + n));
        }
        ctx.putImageData(id, 0, 0);
        // Formwork pour lines
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(0, i * 128 + 64, S, 2);
        }
        // Tie-holes
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 5; col++) {
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0,0,0,0.12)';
                ctx.arc(col * 110 + 30, row * 128 + 64, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.arc(col * 110 + 30, row * 128 + 62, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        // Aggregate speckles
        for (let i = 0; i < 180; i++) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.05})`;
            ctx.arc(Math.random() * S, Math.random() * S, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
}

// ── Floor texture generator ───────────────────────────────────────────────────

function generateFloorTexture(floorColor: string): THREE.CanvasTexture {
    const S = 512;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const [r, g, b] = hexToRgb(floorColor);

    ctx.fillStyle = floorColor;
    ctx.fillRect(0, 0, S, S);

    const PH = 50, PW = 170;

    // Draw planks in rows
    for (let row = 0; row <= Math.ceil(S / PH) + 1; row++) {
        const offset = (row % 3) * (PW / 3);
        const y = row * PH;
        for (let col = -1; col <= Math.ceil(S / PW) + 1; col++) {
            const x = col * PW + offset;
            // Plank base with variation
            const v = (Math.random() - 0.5) * 16;
            ctx.fillStyle = `rgb(${Math.min(255,Math.max(0,r+v))},${Math.min(255,Math.max(0,g+v))},${Math.min(255,Math.max(0,b+v))})`;
            ctx.fillRect(x + 1, y + 1, PW - 1, PH - 1);
            // Wood grain
            for (let gn = 0; gn < 5; gn++) {
                const gx = x + 16 + gn * (PW / 6);
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.045})`;
                ctx.lineWidth = 0.65;
                ctx.moveTo(gx, y + 1);
                ctx.bezierCurveTo(
                    gx + (Math.random() - 0.5) * 6, y + PH * 0.35,
                    gx + (Math.random() - 0.5) * 6, y + PH * 0.65,
                    gx + (Math.random() - 0.5) * 4, y + PH - 1
                );
                ctx.stroke();
            }
            // Top specular
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(x + 1, y + 1, PW - 1, 2);
        }
    }

    // Row gaps
    for (let row = 0; row <= Math.ceil(S / PH) + 1; row++) {
        const y = row * PH;
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(0, y, S, 1.5);
    }

    // Column gaps
    for (let row = 0; row <= Math.ceil(S / PH) + 1; row++) {
        const offset = (row % 3) * (PW / 3);
        const y = row * PH;
        for (let col = -1; col <= Math.ceil(S / PW) + 1; col++) {
            const x = col * PW + offset;
            ctx.fillStyle = 'rgba(0,0,0,0.09)';
            ctx.fillRect(x, y, 1.5, PH);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
}

// ── Roughness texture ─────────────────────────────────────────────────────────

function generateRoughnessMap(base: number): THREE.CanvasTexture {
    const S = 128;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const id = ctx.createImageData(S, S);
    for (let i = 0; i < id.data.length; i += 4) {
        const v = Math.min(255, Math.max(0, base + (Math.random() - 0.5) * 35));
        id.data[i] = v; id.data[i+1] = v; id.data[i+2] = v; id.data[i+3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    return new THREE.CanvasTexture(canvas);
}

const ROUGHNESS_VALUES: Record<WallTexture | 'floor', number> = {
    plain: 195,
    'subtle-linen': 230,
    brick: 215,
    'wood-panel': 155,
    concrete: 220,
    floor: 145,
};

// ── Hook: procedural textures ────────────────────────────────────────────────

function useProceduralTextures(wallColor: string, textureType: WallTexture, floorColor: string) {
    const wallTex     = useMemo(() => generateWallTexture(wallColor, textureType), [wallColor, textureType]);
    const floorTex    = useMemo(() => generateFloorTexture(floorColor),            [floorColor]);
    const wallRough   = useMemo(() => generateRoughnessMap(ROUGHNESS_VALUES[textureType]), [textureType]);
    const floorRough  = useMemo(() => generateRoughnessMap(ROUGHNESS_VALUES.floor),        []);

    useEffect(() => () => { wallTex.dispose();   }, [wallTex]);
    useEffect(() => () => { floorTex.dispose();  }, [floorTex]);
    useEffect(() => () => { wallRough.dispose(); }, [wallRough]);
    useEffect(() => () => { floorRough.dispose();}, [floorRough]);

    return { wallTex, floorTex, wallRough, floorRough };
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
    width: number;
    depth: number;
    height: number;
    wallColor: string;
    floorColor: string;
    wallTexture: WallTexture;
    onDeselect: () => void;
};

export function RoomGeometry({ width, depth, height, wallColor, floorColor, wallTexture, onDeselect }: Props) {
    const hw = width  / 2;
    const hd = depth  / 2;
    const hh = height / 2;

    const { wallTex, floorTex, wallRough, floorRough } = useProceduralTextures(wallColor, wallTexture, floorColor);

    // Scale texture repeat to wall / floor size
    wallTex.repeat.set(width  / 4, height / 3);
    floorTex.repeat.set(width / 3, depth  / 3);
    wallRough.repeat.set(width / 4, height / 3);
    floorRough.repeat.set(width / 3, depth / 3);

    return (
        <group onClick={(e) => { e.stopPropagation(); onDeselect(); }}>

            {/* ── Floor ─────────────────────────────────────────────── */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[width, depth, 1, 1]} />
                <meshStandardMaterial
                    map={floorTex}
                    roughnessMap={floorRough}
                    roughness={0.72}
                    metalness={0.04}
                />
            </mesh>

            {/* ── Ceiling (subtle, no texture) ─────────────────────── */}
            <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color="#f8f6f2" roughness={1} metalness={0} />
            </mesh>

            {/* ── Back wall ─────────────────────────────────────────── */}
            <mesh receiveShadow castShadow position={[0, hh, -hd]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial
                    map={wallTex}
                    roughnessMap={wallRough}
                    roughness={0.88}
                    metalness={0.0}
                    side={THREE.FrontSide}
                />
            </mesh>

            {/* ── Left wall ─────────────────────────────────────────── */}
            <mesh receiveShadow castShadow position={[-hw, hh, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <meshStandardMaterial
                    map={wallTex}
                    roughnessMap={wallRough}
                    roughness={0.88}
                    metalness={0.0}
                    side={THREE.FrontSide}
                />
            </mesh>

            {/* ── Right wall ────────────────────────────────────────── */}
            <mesh receiveShadow castShadow position={[hw, hh, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <meshStandardMaterial
                    map={wallTex}
                    roughnessMap={wallRough}
                    roughness={0.88}
                    metalness={0.0}
                    side={THREE.FrontSide}
                />
            </mesh>

            {/* ── Skirting board (back) ─────────────────────────────── */}
            <mesh receiveShadow position={[0, 0.06, -hd + 0.01]}>
                <boxGeometry args={[width, 0.12, 0.02]} />
                <meshStandardMaterial color="#e8e3db" roughness={0.5} metalness={0.02} />
            </mesh>
            {/* ── Skirting board (left) ─────────────────────────────── */}
            <mesh receiveShadow position={[-hw + 0.01, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[depth, 0.12, 0.02]} />
                <meshStandardMaterial color="#e8e3db" roughness={0.5} metalness={0.02} />
            </mesh>
            {/* ── Skirting board (right) ────────────────────────────── */}
            <mesh receiveShadow position={[hw - 0.01, 0.06, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <boxGeometry args={[depth, 0.12, 0.02]} />
                <meshStandardMaterial color="#e8e3db" roughness={0.5} metalness={0.02} />
            </mesh>
        </group>
    );
}