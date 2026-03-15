import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';

const Compass = () => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      // Keep it fixed in the corner of the view but allow it to rotate with the camera
      // Actually, a better approach for a compass is to rotate it inversely to camera view
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      groupRef.current.rotation.y = -euler.y;
    }
  });

  return (
    <group ref={groupRef} position={[2, 0.1, 2]} scale={0.5}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshStandardMaterial color="#D4CDC4" transparent opacity={0.5} />
      </mesh>
      
      {/* North Indicator */}
      <group position={[0, 0, -1.2]}>
        <Text
          fontSize={0.4}
          color="#1A1A1A"
          anchorX="center"
          anchorY="middle"
        >
          N
        </Text>
      </group>

      {/* South Indicator */}
      <group position={[0, 0, 1.2]} rotation={[0, Math.PI, 0]}>
        <Text
          fontSize={0.3}
          color="#9C9488"
          anchorX="center"
          anchorY="middle"
        >
          S
        </Text>
      </group>

      {/* East Indicator */}
      <group position={[1.2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Text
          fontSize={0.3}
          color="#9C9488"
          anchorX="center"
          anchorY="middle"
        >
          E
        </Text>
      </group>

      {/* West Indicator */}
      <group position={[-1.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Text
          fontSize={0.3}
          color="#9C9488"
          anchorX="center"
          anchorY="middle"
        >
          W
        </Text>
      </group>

      {/* Center Needle */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh rotation={[0, 0, 0]}>
          <coneGeometry args={[0.15, 0.8, 4]} />
          <meshStandardMaterial color="#8DA399" />
          <mesh position={[0, -0.4, 0]} rotation={[Math.PI, 0, 0]}>
             <coneGeometry args={[0.15, 0.8, 4]} />
             <meshStandardMaterial color="#D4CDC4" />
          </mesh>
        </mesh>
      </Float>
    </group>
  );
};

export default Compass;
