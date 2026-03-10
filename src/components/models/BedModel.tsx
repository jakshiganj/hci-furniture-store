import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

export default function BedModel(props: any) {
    const { scene } = useGLTF("/models/Bed.glb");
    const clone = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/Bed.glb");
