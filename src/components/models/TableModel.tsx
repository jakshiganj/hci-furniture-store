import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

export default function TableModel(props: any) {
    const { scene } = useGLTF("/models/table.glb");
    const clone = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/table.glb");
