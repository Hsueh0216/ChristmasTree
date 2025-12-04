import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, getRandomSpherePoint, getDiskPoint, COLORS } from '../constants';
import { OrnamentData } from '../types';

interface GiftsProps {
  progressRef: React.MutableRefObject<number>;
}

export const Gifts: React.FC<GiftsProps> = ({ progressRef }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const giftsData = useMemo(() => {
    return new Array(CONFIG.GIFT_COUNT).fill(0).map((_, i) => {
      const scatterVec = getRandomSpherePoint(CONFIG.SCATTER_RADIUS);
      // Place on ground level, slightly outside tree radius
      const treeVec = getDiskPoint(CONFIG.TREE_RADIUS * 0.5, CONFIG.TREE_RADIUS * 1.5, -CONFIG.TREE_HEIGHT / 2);
      
      const colors = [COLORS.RED_VELVET, COLORS.GOLD_METALLIC, COLORS.EMERALD_LITE, "#ffffff"];
      const color = colors[i % colors.length];

      // Random box dimensions for variety
      const sx = 0.8 + Math.random() * 0.6;
      const sy = 0.5 + Math.random() * 0.8;
      const sz = 0.8 + Math.random() * 0.6;

      return {
        id: i,
        type: 'box' as const,
        scatterPos: [scatterVec.x, scatterVec.y, scatterVec.z] as [number, number, number],
        treePos: [treeVec.x, treeVec.y + sy/2, treeVec.z] as [number, number, number], // Adjust Y so it sits on floor
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
        scale: [sx, sy, sz] as [number, number, number],
        color,
      };
    });
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    giftsData.forEach((d, i) => {
      meshRef.current!.setColorAt(i, new THREE.Color(d.color));
    });
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [giftsData]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const progress = progressRef.current;

    giftsData.forEach((d, i) => {
      const { scatterPos, treePos, rotation, scale } = d;
      
      // Lerp Position
      const cx = THREE.MathUtils.lerp(scatterPos[0], treePos[0], progress);
      const cy = THREE.MathUtils.lerp(scatterPos[1], treePos[1], progress);
      const cz = THREE.MathUtils.lerp(scatterPos[2], treePos[2], progress);

      // Float when scattered, sit still when tree
      const isTree = progress > 0.9;
      const floatAmp = THREE.MathUtils.lerp(1.0, 0.0, progress);
      const floatY = Math.sin(time + i) * floatAmp;

      dummy.position.set(cx, cy + floatY, cz);

      // Rotate: Random spin when scattered, upright Y rotation when tree
      const targetRotX = 0;
      const targetRotZ = 0;
      // Interpolate rotation is complex, we'll just lerp values roughly
      const rx = THREE.MathUtils.lerp(rotation[0] + time, targetRotX, progress);
      const ry = THREE.MathUtils.lerp(rotation[1] + time, d.treePos[0], progress); // Just a stable randomish angle
      const rz = THREE.MathUtils.lerp(rotation[2] + time, targetRotZ, progress);

      dummy.rotation.set(rx, ry, rz);
      dummy.scale.set(scale[0], scale[1], scale[2]);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFIG.GIFT_COUNT]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        roughness={0.3} 
        metalness={0.5} 
      />
    </instancedMesh>
  );
};