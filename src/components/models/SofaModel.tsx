import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

export default function SofaModel(props: any) {
    const { scene } = useGLTF("/models/sofa.glb");
    const clone = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/sofa.glb");
