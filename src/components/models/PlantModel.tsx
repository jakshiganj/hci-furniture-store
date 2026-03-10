import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

export default function PlantModel(props: any) {
    const { scene } = useGLTF("/models/plant.gltf");
    const clone = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/plant.gltf");
