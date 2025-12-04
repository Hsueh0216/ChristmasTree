import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, getRandomSpherePoint, COLORS } from '../constants';

interface TopStarProps {
  progressRef: React.MutableRefObject<number>;
}

export const TopStar: React.FC<TopStarProps> = ({ progressRef }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Define positions
  const { scatterPos, treePos } = useMemo(() => {
    const scatter = getRandomSpherePoint(CONFIG.SCATTER_RADIUS);
    // Top of the tree
    const tree = new THREE.Vector3(0, CONFIG.TREE_HEIGHT / 2 + 1.0, 0); 
    return { scatterPos: scatter, treePos: tree };
  }, []);

  // Create 5-Pointed Star Geometry
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.2; // Size of the star tips
    const innerRadius = 0.55; // Size of the inner valleys
    
    // Start at the top point (0, outerRadius)
    shape.moveTo(0, outerRadius);

    for (let i = 1; i <= points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      // Use sin/cos to plot points around the circle
      shape.lineTo(Math.sin(angle) * radius, Math.cos(angle) * radius);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.4, // Thickness of the star
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center(); // Center geometry so it rotates around its middle
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const progress = progressRef.current;

    // Position Interpolation
    meshRef.current.position.lerpVectors(scatterPos, treePos, progress);

    // Floating effect when scattered, stable when tree
    const floatAmp = THREE.MathUtils.lerp(1.0, 0.05, progress);
    meshRef.current.position.y += Math.sin(time) * floatAmp;

    // Rotation
    // Spin fast when scattered
    // Rotate slowly and elegantly when in tree form
    const rotSpeed = THREE.MathUtils.lerp(2.0, 0.8, progress);
    meshRef.current.rotation.y = time * rotSpeed;
    
    // Slight tilt for dynamism
    meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.05; 

    // Scale pop
    const scale = THREE.MathUtils.lerp(0.5, 1.2, progress);
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} geometry={starGeometry} castShadow>
      <meshStandardMaterial 
        color={COLORS.GOLD_METALLIC}
        emissive={COLORS.GOLD_METALLIC}
        emissiveIntensity={2.5}
        toneMapped={false}
        roughness={0.1}
        metalness={1.0}
      />
      {/* Intense glow light for the star */}
      <pointLight distance={10} intensity={10} color={COLORS.GOLD_METALLIC} decay={2} />
    </mesh>
  );
};