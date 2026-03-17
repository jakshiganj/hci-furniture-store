import { useGLTF } from "@react-three/drei";
import { useMemo, useEffect } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";

interface FloorLampModelProps extends Omit<ThreeElements['primitive'], 'object'> {
    color?: string;
}

export default function FloorLampModel({ color, ...props }: FloorLampModelProps) {
    const { scene } = useGLTF("/models/floor lamp.glb");
    const clone = useMemo(() => scene.clone(true), [scene]);

    useEffect(() => {
        if (!color) return;
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
                    mat.color = new THREE.Color(color);
                    mesh.material = mat;
                }
            }
        });
    }, [clone, color]);

    return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/floor lamp.glb");
