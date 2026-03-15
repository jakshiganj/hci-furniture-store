import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";

export default function TVStandModel(props: Omit<ThreeElements['primitive'], 'object'>) {
    const { scene } = useGLTF("/models/tv stand.glb");
    const clone = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/tv stand.glb");
