import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, getRandomSpherePoint, getConePoint, COLORS } from '../constants';
import { OrnamentData } from '../types';

interface OrnamentsProps {
  progressRef: React.MutableRefObject<number>;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ progressRef }) => {
  const ballRef = useRef<THREE.InstancedMesh>(null);
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const triRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate data grouped by type
  const { balls, boxes, triangles } = useMemo(() => {
    const balls: OrnamentData[] = [];
    const boxes: OrnamentData[] = [];
    const triangles: OrnamentData[] = [];

    for (let i = 0; i < CONFIG.ORNAMENT_COUNT; i++) {
      const rand = Math.random();
      const type = rand < 0.33 ? 'ball' : rand < 0.66 ? 'box' : 'triangle';
      
      const scatterVec = getRandomSpherePoint(CONFIG.SCATTER_RADIUS * 0.8);
      const treeVec = getConePoint(CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS * 1.1, -CONFIG.TREE_HEIGHT / 2);
      
      const colorKeys = Object.keys(COLORS).filter(k => k !== 'EMERALD_DEEP' && k !== 'EMERALD_LITE');
      const randomColorKey = colorKeys[Math.floor(Math.random() * colorKeys.length)] as keyof typeof COLORS;
      
      const scaleBase = Math.random() * 0.3 + 0.15;
      const scale: [number, number, number] = [scaleBase, scaleBase, scaleBase];

      const item: OrnamentData = {
        id: i,
        type,
        scatterPos: [scatterVec.x, scatterVec.y, scatterVec.z],
        treePos: [treeVec.x, treeVec.y, treeVec.z],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale,
        color: COLORS[randomColorKey],
      };

      if (type === 'ball') balls.push(item);
      else if (type === 'box') boxes.push(item);
      else triangles.push(item);
    }
    return { balls, boxes, triangles };
  }, []);

  // Initialize colors
  useLayoutEffect(() => {
    const setColors = (mesh: THREE.InstancedMesh | null, data: OrnamentData[]) => {
      if (!mesh) return;
      data.forEach((d, i) => {
        mesh.setColorAt(i, new THREE.Color(d.color));
      });
      mesh.instanceColor!.needsUpdate = true;
    };
    setColors(ballRef.current, balls);
    setColors(boxRef.current, boxes);
    setColors(triRef.current, triangles);
  }, [balls, boxes, triangles]);

  // Animation Loop
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const progress = progressRef.current;

    const animateMesh = (mesh: THREE.InstancedMesh | null, data: OrnamentData[]) => {
      if (!mesh) return;
      data.forEach((d, i) => {
        const { scatterPos, treePos, rotation, scale } = d;
        
        // Lerp position
        const currentX = THREE.MathUtils.lerp(scatterPos[0], treePos[0], progress);
        const currentY = THREE.MathUtils.lerp(scatterPos[1], treePos[1], progress);
        const currentZ = THREE.MathUtils.lerp(scatterPos[2], treePos[2], progress);

        // Floating effect
        const floatAmp = THREE.MathUtils.lerp(1.5, 0.05, progress);
        const floatX = Math.sin(time * 0.5 + i) * floatAmp;
        const floatY = Math.cos(time * 0.3 + i * 2) * floatAmp;

        dummy.position.set(currentX + floatX, currentY + floatY, currentZ);

        // Rotation
        const rotSpeed = THREE.MathUtils.lerp(0.5, 0.2, progress);
        dummy.rotation.set(
          rotation[0] + time * rotSpeed,
          rotation[1] + time * rotSpeed,
          rotation[2] + time * rotSpeed
        );

        // Scale
        dummy.scale.set(scale[0], scale[1], scale[2]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };

    animateMesh(ballRef.current, balls);
    animateMesh(boxRef.current, boxes);
    animateMesh(triRef.current, triangles);
  });

  const material = useMemo(() => (
    <meshStandardMaterial 
      color="#ffffff" 
      roughness={0.15} 
      metalness={0.9} 
      emissive="#330000"
      emissiveIntensity={0.2}
    />
  ), []);

  return (
    <group>
      {/* Spheres */}
      <instancedMesh ref={ballRef} args={[undefined, undefined, balls.length]} castShadow receiveShadow>
        <sphereGeometry args={[1, 16, 16]} />
        {material}
      </instancedMesh>

      {/* Boxes */}
      <instancedMesh ref={boxRef} args={[undefined, undefined, boxes.length]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        {material}
      </instancedMesh>

      {/* Triangles (Tetrahedron) */}
      <instancedMesh ref={triRef} args={[undefined, undefined, triangles.length]} castShadow receiveShadow>
        <tetrahedronGeometry args={[1.2]} />
        {material}
      </instancedMesh>
    </group>
  );
};