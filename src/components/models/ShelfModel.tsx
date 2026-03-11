import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

export default function ShelfModel(props: any) {
    const { scene } = useGLTF("/models/Book_shelf.glb");
    const clone = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/Book_shelf.glb");
