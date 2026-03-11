import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

export default function VaseModel(props: any) {
    const { scene } = useGLTF("/models/flower_vase.glb");
    const clone = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/flower_vase.glb");
