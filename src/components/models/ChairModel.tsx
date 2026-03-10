import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

export default function ChairModel(props: any) {
    const { scene } = useGLTF("/models/chair.glb");
    const clone = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/chair.glb");
