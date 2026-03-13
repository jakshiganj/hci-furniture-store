import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";

export default function VaseModel(props: Omit<ThreeElements['primitive'], 'object'>) {
    const { scene } = useGLTF("/models/flower_vase.glb");
    const clone = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/flower_vase.glb");
