import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

export type WallTexture = 'plain' | 'subtle-linen' | 'brick' | 'wood-panel' | 'concrete';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [200, 190, 175];
}

// ── L-Shape floor geometry ────────────────────────────────────────────────────
// THREE.Shape lives in XY space. The floor mesh is rotated [-PI/2, 0, 0],
// which maps: shapeX → worldX,  shapeY → world -Z.
// So to place a polygon vertex at world (wx, wz) write shape point (wx, -wz).

function makeLShapeGeo(
    width: number,
    depth: number,
    ew: number,   // extension width
    ed: number,   // extension depth
    corner: 'NE' | 'NW' | 'SE' | 'SW',
): THREE.BufferGeometry {
    const hw = width / 2;
    const hd = depth / 2;
    const shape = new THREE.Shape();

    // Helper: world coords → shape coords
    const p = (wx: number, wz: number) => new THREE.Vector2(wx, -wz);

    if (corner === 'SE') {
        // Extension is at the RIGHT (+X) / FRONT (+Z) corner
        // Main:  X[-hw .. hw],    Z[-hd .. hd]
        // Ext:   X[hw .. hw+ew],  Z[hd-ed .. hd]
        shape.setFromPoints([
            p(-hw,      -hd),
            p( hw,      -hd),
            p( hw,       hd - ed),   // step down to inner corner
            p( hw + ew,  hd - ed),   // extend right
            p( hw + ew,  hd),        // ext front-right
            p(-hw,       hd),        // front-left
        ]);
    } else if (corner === 'SW') {
        // Extension is at the LEFT (-X) / FRONT (+Z) corner
        // Ext:   X[-hw-ew .. -hw],  Z[hd-ed .. hd]
        shape.setFromPoints([
            p(-hw - ew,  hd - ed),   // ext back-left
            p(-hw,       hd - ed),   // inner corner
            p(-hw,      -hd),
            p( hw,      -hd),
            p( hw,       hd),
            p(-hw - ew,  hd),        // ext front-left
        ]);
    } else if (corner === 'NE') {
        // Extension is at the RIGHT (+X) / BACK (-Z) corner
        // Ext:   X[hw .. hw+ew],  Z[-hd .. -hd+ed]
        shape.setFromPoints([
            p(-hw,      -hd),
            p( hw,      -hd),
            p( hw + ew, -hd),        // ext back-right
            p( hw + ew, -hd + ed),   // ext front edge
            p( hw,      -hd + ed),   // inner corner
            p( hw,       hd),
            p(-hw,       hd),
        ]);
    } else { // NW
        // Extension is at the LEFT (-X) / BACK (-Z) corner
        // Ext:   X[-hw-ew .. -hw],  Z[-hd .. -hd+ed]
        shape.setFromPoints([
            p(-hw - ew, -hd),        // ext back-left
            p(-hw,      -hd),
            p(-hw,      -hd + ed),   // inner corner (step up)
            p( hw,      -hd + ed),   // this is wrong for NW...
            // NW: only the left side has the ext, rest is normal
        ]);
        // Redo NW cleanly:
        shape.setFromPoints([
            p(-hw - ew, -hd),
            p(-hw,      -hd),
            p(-hw,      -hd + ed),   // inner corner
            p( hw,      -hd + ed),   // wait, this cuts across the room
            // NW ext only goes from -hw-ew to -hw on the back wall
            // So the shape should be:
        ]);
        // Final correct NW shape:
        shape.setFromPoints([
            p(-hw - ew, -hd),        // ext back-left
            p(-hw - ew, -hd + ed),   // ext front-left
            p(-hw,      -hd + ed),   // inner corner
            p(-hw,       hd),        // main front-left
            p( hw,       hd),        // main front-right
            p( hw,      -hd),        // main back-right
        ]);
    }

    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);

    // UV: 1 tile = 3 world units, based on shape XY coords
    const pos = geo.attributes.position;
    const uv  = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, pos.getX(i) / 3, pos.getY(i) / 3);
    }
    uv.needsUpdate = true;
    return geo;
}

// ── Wall segments ─────────────────────────────────────────────────────────────
// Each wall is a plane mesh. Position is the CENTRE of the wall segment.
// rotationY: 0 = faces +Z,  PI/2 = faces +X,  -PI/2 = faces -X,  PI = faces -Z

type WallSegment = {
    x: number;
    z: number;
    len: number;
    rotationY: number;
};

function getRectWalls(hw: number, hd: number, width: number, depth: number): WallSegment[] {
    return [
        { x:  0,  z: -hd, len: width, rotationY: 0            }, // back  — faces +Z into room
        { x: -hw, z:  0,  len: depth, rotationY:  Math.PI / 2 }, // left  — faces +X into room
        { x:  hw, z:  0,  len: depth, rotationY: -Math.PI / 2 }, // right — faces -X into room
    ];
}

function getLShapeWalls(
    width: number,
    depth: number,
    ew: number,
    ed: number,
    corner: 'NE' | 'NW' | 'SE' | 'SW',
): WallSegment[] {
    const hw = width / 2;
    const hd = depth / 2;

    // For each corner, there are exactly 6 wall segments.
    // Named: back, left, front, right, ext-outer, inner-step
    //
    // KEY FIX: the "full span" wall center X/Z must be the midpoint of the FULL span,
    // not just the main room width.

    if (corner === 'SE') {
        // Main: X[-hw..hw]   Z[-hd..hd]
        // Ext:  X[hw..hw+ew] Z[hd-ed..hd]
        //
        // 6 wall edges (going CCW around interior):
        // 1. Back:          X[-hw..hw],       Z=-hd  → center (0, -hd), len=width
        // 2. Left:          X=-hw,   Z[-hd..hd]      → center (-hw, 0), len=depth
        // 3. Front (full):  X[-hw..hw+ew],    Z=hd   → center (ew/2, hd), len=width+ew
        // 4. Ext right:     X=hw+ew, Z[hd-ed..hd]   → center (hw+ew, hd-ed/2), len=ed
        // 5. Inner step:    X[hw..hw+ew],    Z=hd-ed → center (hw+ew/2, hd-ed), len=ew
        // 6. Main right:    X=hw,    Z[-hd..hd-ed]  → center (hw, -ed/2), len=depth-ed
        return [
            { x: 0,          z: -hd,      len: width,    rotationY: 0            },
            { x: -hw,        z: 0,         len: depth,    rotationY:  Math.PI / 2 },
            { x: ew / 2,     z:  hd,       len: width+ew, rotationY: Math.PI      }, // faces -Z
            { x: hw + ew,    z:  hd-ed/2,  len: ed,       rotationY: -Math.PI / 2 },
            { x: hw + ew/2,  z:  hd-ed,    len: ew,       rotationY: 0            }, // inner step faces +Z
            { x: hw,         z: -ed / 2,   len: depth-ed, rotationY: -Math.PI / 2 },
        ];
    } else if (corner === 'SW') {
        // Main: X[-hw..hw]   Z[-hd..hd]
        // Ext:  X[-hw-ew..-hw] Z[hd-ed..hd]
        //
        // 1. Back:          X[-hw..hw],       Z=-hd
        // 2. Right:         X=hw,    Z[-hd..hd]
        // 3. Front (full):  X[-hw-ew..hw],    Z=hd  → center (-ew/2, hd), len=width+ew
        // 4. Ext left:      X=-hw-ew, Z[hd-ed..hd]  → center (-hw-ew, hd-ed/2), len=ed
        // 5. Inner step:    X[-hw-ew..-hw], Z=hd-ed → center (-hw-ew/2, hd-ed), len=ew
        // 6. Main left:     X=-hw, Z[-hd..hd-ed]    → center (-hw, -ed/2), len=depth-ed
        return [
            { x: 0,           z: -hd,      len: width,    rotationY: 0            },
            { x:  hw,         z: 0,         len: depth,    rotationY: -Math.PI / 2 },
            { x: -ew / 2,     z:  hd,       len: width+ew, rotationY: Math.PI      },
            { x: -hw - ew,    z:  hd-ed/2,  len: ed,       rotationY:  Math.PI / 2 },
            { x: -hw - ew/2,  z:  hd-ed,    len: ew,       rotationY: 0            },
            { x: -hw,         z: -ed / 2,   len: depth-ed, rotationY:  Math.PI / 2 },
        ];
    } else if (corner === 'NE') {
        // Main: X[-hw..hw]   Z[-hd..hd]
        // Ext:  X[hw..hw+ew] Z[-hd..-hd+ed]
        //
        // 1. Front:         X[-hw..hw],       Z=hd
        // 2. Left:          X=-hw, Z[-hd..hd]
        // 3. Back (full):   X[-hw..hw+ew],    Z=-hd → center (ew/2, -hd), len=width+ew
        // 4. Ext right:     X=hw+ew, Z[-hd..-hd+ed] → center (hw+ew, -hd+ed/2), len=ed
        // 5. Inner step:    X[hw..hw+ew], Z=-hd+ed  → center (hw+ew/2, -hd+ed), len=ew
        // 6. Main right:    X=hw, Z[-hd+ed..hd]     → center (hw, ed/2), len=depth-ed... 
        //    wait: Z[-hd+ed..hd], len = hd - (-hd+ed) = depth - ed, center = (-hd+ed+hd)/2 = ed/2
        return [
            { x: 0,          z:  hd,       len: width,    rotationY: Math.PI      },
            { x: -hw,        z:  0,         len: depth,    rotationY:  Math.PI / 2 },
            { x: ew / 2,     z: -hd,        len: width+ew, rotationY: 0            },
            { x: hw + ew,    z: -hd+ed/2,   len: ed,       rotationY: -Math.PI / 2 },
            { x: hw + ew/2,  z: -hd+ed,     len: ew,       rotationY: Math.PI      },
            { x: hw,         z:  ed / 2,    len: depth-ed, rotationY: -Math.PI / 2 },
        ];
    } else { // NW
        // Main: X[-hw..hw]   Z[-hd..hd]
        // Ext:  X[-hw-ew..-hw] Z[-hd..-hd+ed]
        //
        // 1. Front:         X[-hw..hw],         Z=hd
        // 2. Right:         X=hw, Z[-hd..hd]
        // 3. Back (full):   X[-hw-ew..hw],       Z=-hd → center (-ew/2, -hd), len=width+ew
        // 4. Ext left:      X=-hw-ew, Z[-hd..-hd+ed] → center (-hw-ew, -hd+ed/2), len=ed
        // 5. Inner step:    X[-hw-ew..-hw], Z=-hd+ed  → center (-hw-ew/2, -hd+ed), len=ew
        // 6. Main left:     X=-hw, Z[-hd+ed..hd]      → center (-hw, ed/2), len=depth-ed
        return [
            { x: 0,           z:  hd,       len: width,    rotationY: Math.PI      },
            { x:  hw,         z:  0,         len: depth,    rotationY: -Math.PI / 2 },
            { x: -ew / 2,     z: -hd,        len: width+ew, rotationY: 0            },
            { x: -hw - ew,    z: -hd+ed/2,   len: ed,       rotationY:  Math.PI / 2 },
            { x: -hw - ew/2,  z: -hd+ed,     len: ew,       rotationY: Math.PI      },
            { x: -hw,         z:  ed / 2,    len: depth-ed, rotationY:  Math.PI / 2 },
        ];
    }
}

// ── Procedural textures ───────────────────────────────────────────────────────

function generateWallTexture(wallColor: string, type: WallTexture): THREE.CanvasTexture {
    const S = 512;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const [r, g, b] = hexToRgb(wallColor);
    ctx.fillStyle = wallColor; ctx.fillRect(0, 0, S, S);

    if (type === 'plain') {
        const id = ctx.getImageData(0, 0, S, S);
        for (let i = 0; i < id.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 14;
            id.data[i]   = Math.min(255, Math.max(0, id.data[i]   + n));
            id.data[i+1] = Math.min(255, Math.max(0, id.data[i+1] + n));
            id.data[i+2] = Math.min(255, Math.max(0, id.data[i+2] + n));
        }
        ctx.putImageData(id, 0, 0);
        for (let i = 0; i < 12; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.01 + Math.random() * 0.015})`;
            ctx.fillRect(0, Math.random() * S, S, 1 + Math.random() * 2);
        }
    } else if (type === 'subtle-linen') {
        const sp = 4;
        for (let y = 0; y < S; y += sp) {
            ctx.fillStyle = 'rgba(0,0,0,0.045)'; ctx.fillRect(0, y, S, 1);
            ctx.fillStyle = 'rgba(255,255,255,0.025)'; ctx.fillRect(0, y + 2, S, 1);
        }
        for (let x = 0; x < S; x += sp) {
            ctx.fillStyle = `rgba(0,0,0,${0.025 + (x % (sp*2) === 0 ? 0.02 : 0)})`;
            ctx.fillRect(x, 0, 1, S);
        }
        for (let i = 0; i < 60; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.015 + Math.random() * 0.02})`;
            ctx.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 3, 1);
        }
    } else if (type === 'brick') {
        const BW = 76, BH = 30, M = 5;
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, 0, S, S);
        for (let row = 0; row <= Math.ceil(S / BH) + 1; row++) {
            const offset = row % 2 === 0 ? 0 : BW / 2;
            const y = row * BH;
            for (let col = -1; col <= Math.ceil(S / BW) + 1; col++) {
                const x = col * BW + offset;
                const v = (Math.random() - 0.5) * 22;
                ctx.fillStyle = `rgb(${Math.min(255,Math.max(0,r+v))},${Math.min(255,Math.max(0,g+v))},${Math.min(255,Math.max(0,b+v))})`;
                ctx.fillRect(x+M/2, y+M/2, BW-M, BH-M);
                ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x+M/2, y+M/2, BW-M, 3);
                ctx.fillStyle = 'rgba(0,0,0,0.08)';       ctx.fillRect(x+M/2, y+BH-M-3, BW-M, 3);
                ctx.fillStyle = 'rgba(0,0,0,0.05)';       ctx.fillRect(x+M/2, y+M/2, 2, BH-M);
            }
        }
    } else if (type === 'wood-panel') {
        const PW = 58;
        for (let col = 0; col <= Math.ceil(S / PW) + 1; col++) {
            const x = col * PW;
            const v = (Math.random() - 0.5) * 16;
            ctx.fillStyle = `rgb(${Math.min(255,Math.max(0,r+v))},${Math.min(255,Math.max(0,g+v))},${Math.min(255,Math.max(0,b+v))})`;
            ctx.fillRect(x+3, 0, PW-3, S);
            for (let gn = 0; gn < 7; gn++) {
                const gx = x + 7 + gn * 7;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0,0,0,${0.035 + Math.random() * 0.055})`;
                ctx.lineWidth = 0.8;
                ctx.moveTo(gx + (Math.random()-0.5)*2, 0);
                for (let py = 0; py <= S; py += 35)
                    ctx.lineTo(gx + Math.sin(py*0.014+gn)*2.5 + (Math.random()-0.5), py);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x, 0, 3, S);
            ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(x+3, 0, 1.5, S);
        }
    } else if (type === 'concrete') {
        const id = ctx.getImageData(0, 0, S, S);
        for (let i = 0; i < id.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 28;
            id.data[i]   = Math.min(255, Math.max(0, id.data[i]   + n));
            id.data[i+1] = Math.min(255, Math.max(0, id.data[i+1] + n));
            id.data[i+2] = Math.min(255, Math.max(0, id.data[i+2] + n));
        }
        ctx.putImageData(id, 0, 0);
        for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, i*128+64, S, 2); }
        for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
            ctx.beginPath(); ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.arc(col*110+30, row*128+64, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.arc(col*110+30, row*128+62, 2, 0, Math.PI*2); ctx.fill();
        }
        for (let i = 0; i < 180; i++) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(0,0,0,${0.03 + Math.random()*0.05})`;
            ctx.arc(Math.random()*S, Math.random()*S, 1+Math.random()*2, 0, Math.PI*2);
            ctx.fill();
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.needsUpdate = true;
    return tex;
}

function generateFloorTexture(floorColor: string): THREE.CanvasTexture {
    const S = 512;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const [r, g, b] = hexToRgb(floorColor);
    ctx.fillStyle = floorColor; ctx.fillRect(0, 0, S, S);
    const PH = 50, PW = 170;
    for (let row = 0; row <= Math.ceil(S/PH)+1; row++) {
        const offset = (row % 3) * (PW/3); const y = row * PH;
        for (let col = -1; col <= Math.ceil(S/PW)+1; col++) {
            const x = col * PW + offset;
            const v = (Math.random()-0.5)*16;
            ctx.fillStyle = `rgb(${Math.min(255,Math.max(0,r+v))},${Math.min(255,Math.max(0,g+v))},${Math.min(255,Math.max(0,b+v))})`;
            ctx.fillRect(x+1, y+1, PW-1, PH-1);
            for (let gn = 0; gn < 5; gn++) {
                const gx = x + 16 + gn*(PW/6);
                ctx.beginPath(); ctx.strokeStyle = `rgba(0,0,0,${0.03+Math.random()*0.045})`; ctx.lineWidth = 0.65;
                ctx.moveTo(gx, y+1);
                ctx.bezierCurveTo(gx+(Math.random()-0.5)*6, y+PH*0.35, gx+(Math.random()-0.5)*6, y+PH*0.65, gx+(Math.random()-0.5)*4, y+PH-1);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x+1, y+1, PW-1, 2);
        }
    }
    for (let row = 0; row <= Math.ceil(S/PH)+1; row++) { ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(0,row*PH,S,1.5); }
    for (let row = 0; row <= Math.ceil(S/PH)+1; row++) {
        const offset = (row%3)*(PW/3);
        for (let col = -1; col <= Math.ceil(S/PW)+1; col++) { ctx.fillStyle='rgba(0,0,0,0.09)'; ctx.fillRect(col*PW+offset,row*PH,1.5,PH); }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.needsUpdate = true;
    return tex;
}

function generateRoughnessMap(base: number): THREE.CanvasTexture {
    const S = 128; const canvas = document.createElement('canvas'); canvas.width=S; canvas.height=S;
    const ctx = canvas.getContext('2d')!; const id = ctx.createImageData(S, S);
    for (let i = 0; i < id.data.length; i += 4) {
        const v = Math.min(255, Math.max(0, base+(Math.random()-0.5)*35));
        id.data[i]=v; id.data[i+1]=v; id.data[i+2]=v; id.data[i+3]=255;
    }
    ctx.putImageData(id, 0, 0); return new THREE.CanvasTexture(canvas);
}

const ROUGHNESS_VALUES: Record<WallTexture | 'floor', number> = {
    plain: 195, 'subtle-linen': 230, brick: 215, 'wood-panel': 155, concrete: 220, floor: 145,
};

function useProceduralTextures(wallColor: string, textureType: WallTexture, floorColor: string) {
    const wallTex    = useMemo(() => generateWallTexture(wallColor, textureType), [wallColor, textureType]);
    const floorTex   = useMemo(() => generateFloorTexture(floorColor),            [floorColor]);
    const wallRough  = useMemo(() => generateRoughnessMap(ROUGHNESS_VALUES[textureType]), [textureType]);
    const floorRough = useMemo(() => generateRoughnessMap(ROUGHNESS_VALUES.floor),        []);
    useEffect(() => () => { wallTex.dispose();    }, [wallTex]);
    useEffect(() => () => { floorTex.dispose();   }, [floorTex]);
    useEffect(() => () => { wallRough.dispose();  }, [wallRough]);
    useEffect(() => () => { floorRough.dispose(); }, [floorRough]);
    return { wallTex, floorTex, wallRough, floorRough };
}

// ── Component ──────────────────────────────────────────────────────────────────

type Props = {
    width: number;
    depth: number;
    height: number;
    wallColor: string;
    floorColor: string;
    wallTexture: WallTexture;
    onDeselect: () => void;
    lShape?: {
        extWidth: number;
        extDepth: number;
        corner: 'NE' | 'NW' | 'SE' | 'SW';
    };
};

export function RoomGeometry({
    width, depth, height, wallColor, floorColor, wallTexture, onDeselect, lShape,
}: Props) {
    const hw = width  / 2;
    const hd = depth  / 2;
    const hh = height / 2;

    const { wallTex, floorTex, wallRough, floorRough } = useProceduralTextures(wallColor, wallTexture, floorColor);

    // ── Floor geometry (L-shape or rectangle) ─────────────────────────────────
    const floorGeo = useMemo(() => {
        if (lShape) {
            return makeLShapeGeo(width, depth, lShape.extWidth, lShape.extDepth, lShape.corner);
        }
        const geo = new THREE.PlaneGeometry(width, depth);
        const uv = geo.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * width / 3, uv.getY(i) * depth / 3);
        uv.needsUpdate = true;
        return geo;
    }, [width, depth, lShape]);

    // CRITICAL: ceiling must use a CLONE — two meshes cannot share the same geometry object.
    // If they share it, the second mesh "steals" the geometry from the first, breaking the floor.
    const ceilingGeo = useMemo(() => floorGeo.clone(), [floorGeo]);

    // ── Wall segments ──────────────────────────────────────────────────────────
    const walls = useMemo(() => {
        if (lShape) return getLShapeWalls(width, depth, lShape.extWidth, lShape.extDepth, lShape.corner);
        return getRectWalls(hw, hd, width, depth);
    }, [width, depth, hw, hd, lShape]);

    // Each wall segment needs its own geometry instance (same reason as floor/ceiling).
    const wallGeos = useMemo(() => walls.map(w => {
        const geo = new THREE.PlaneGeometry(w.len, height);
        const uv  = geo.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w.len / 4, uv.getY(i) * height / 3);
        uv.needsUpdate = true;
        return geo;
    }), [walls, height]);

    return (
        <group onClick={(e) => { e.stopPropagation(); onDeselect(); }}>

            {/* ── Floor ──────────────────────────────────────────────── */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <primitive object={floorGeo} attach="geometry" />
                <meshStandardMaterial
                    map={floorTex}
                    roughnessMap={floorRough}
                    roughness={0.72}
                    metalness={0.04}
                />
            </mesh>

            {/* ── Ceiling ── cloned geometry so it doesn't steal from floor ── */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
                <primitive object={ceilingGeo} attach="geometry" />
                <meshStandardMaterial color="#f8f6f2" roughness={1} metalness={0} />
            </mesh>

            {/* ── Walls ──────────────────────────────────────────────── */}
            {walls.map((w, i) => (
                <mesh
                    key={`wall-${i}`}
                    receiveShadow
                    castShadow
                    position={[w.x, hh, w.z]}
                    rotation={[0, w.rotationY, 0]}
                >
                    <primitive object={wallGeos[i]} attach="geometry" />
                    <meshStandardMaterial
                        map={wallTex}
                        roughnessMap={wallRough}
                        roughness={0.88}
                        metalness={0.0}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}

            {/* ── Skirting boards ────────────────────────────────────── */}
            {walls.map((w, i) => (
                <mesh
                    key={`skirt-${i}`}
                    receiveShadow
                    position={[w.x, 0.06, w.z]}
                    rotation={[0, w.rotationY, 0]}
                >
                    <boxGeometry args={[w.len, 0.12, 0.02]} />
                    <meshStandardMaterial color="#e8e3db" roughness={0.5} metalness={0.02} />
                </mesh>
            ))}
        </group>
    );
}