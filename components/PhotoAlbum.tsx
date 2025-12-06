import React, { useState, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';
import { CONFIG, COLORS } from '../constants';
import { PhotoData } from '../types';

interface PhotoAlbumProps {
  photos: PhotoData[];
  progressRef: React.MutableRefObject<number>;
}

interface PhotoFrameProps {
  photo: PhotoData;
  index: number;
  total: number;
  isActive: boolean;
  setActive: (id: string | null) => void;
  progressRef: React.MutableRefObject<number>;
}

const GoldenDust = ({ visible }: { visible: boolean }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 300;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Create a cloud around the camera center
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5; 
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const opacity = visible ? 1 : 0;
    easing.damp(pointsRef.current.material as THREE.PointsMaterial, 'opacity', opacity, 1.0, delta);
    
    // Slow drift
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for(let i=0; i<count; i++) {
        positions[i*3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.01;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={COLORS.GOLD_METALLIC}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const PhotoFrame: React.FC<PhotoFrameProps> = ({ 
  photo, 
  index, 
  total, 
  isActive, 
  setActive, 
  progressRef 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, viewport } = useThree();
  const vec = new THREE.Vector3();
  const dir = new THREE.Vector3();

  // Initial Orbit Calculation
  const { radius, yBase, speedOffset, phaseOffset } = useMemo(() => {
    const yRange = CONFIG.TREE_HEIGHT * 0.6;
    // Distribute evenly along height, but randomly around circle
    const yBase = -CONFIG.TREE_HEIGHT / 3 + (index / Math.max(total - 1, 1)) * yRange;
    // Cone shape radius at this height
    const h = CONFIG.TREE_HEIGHT;
    const rAtY = (CONFIG.TREE_RADIUS * 1.2 * (h - (yBase + h/2))) / h; 
    
    return {
      radius: rAtY + 1.0, // Float slightly outside leaves
      yBase,
      speedOffset: 0.2 + Math.random() * 0.2,
      phaseOffset: Math.random() * Math.PI * 2
    };
  }, [index, total]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const progress = progressRef.current; // 0=Scattered, 1=Tree

    // --- 1. Calculate Orbit Position (Idle) ---
    // If scattered, move out further. If tree, follow cone orbit.
    const currentRadius = radius + (1 - progress) * 10.0;
    
    const angle = time * speedOffset + phaseOffset;
    const bob = Math.sin(time * 1.5 + phaseOffset) * 0.5;

    const orbitX = Math.cos(angle) * currentRadius;
    const orbitZ = Math.sin(angle) * currentRadius;
    const orbitY = yBase + bob;

    const orbitPos = new THREE.Vector3(orbitX, orbitY, orbitZ);
    
    // Look at center (trunk) roughly, but when scattered look random
    const lookTarget = new THREE.Vector3(0, orbitY, 0);

    // --- 2. Calculate Focus Position (Active) ---
    // Target position: Camera position + Forward vector * distance
    camera.getWorldDirection(dir);
    const focusDist = 8; // Distance in front of camera
    const focusPos = camera.position.clone().add(dir.multiplyScalar(focusDist));
    
    // Determine Target
    const targetPos = isActive ? focusPos : orbitPos;

    // --- 3. Animation ---
    // Smoothly damp position
    easing.damp3(groupRef.current.position, targetPos, isActive ? 0.8 : 1.5, delta);

    // Orientation
    if (isActive) {
      // Look at camera
      groupRef.current.lookAt(camera.position);
    } else {
      // Look at tree center (billboard-ish but radial)
      groupRef.current.lookAt(lookTarget);
      // Add a slight spin if scattered
      if (progress < 0.5) {
         groupRef.current.rotation.z += delta * 0.5;
         groupRef.current.rotation.x += delta * 0.2;
      }
    }

    // Scale Logic
    // Base scale: 1.5 world units
    // Focus scale: Calculate based on viewport height to cover ~70%
    // viewport.height is the height of the screen in world units at the target distance? 
    // Actually, viewport changes with distance, so we use a rough approximation or keep it simple.
    // At distance 8 with FOV 45, the frustum height is approx: 2 * 8 * tan(22.5) ~ 6.6 units
    // So 70% is ~4.6 units.
    
    const baseScale = 1.5;
    // Calculate aspect ratio scale
    const scaleX = baseScale * photo.aspect;
    const scaleY = baseScale;

    // Focused Scale
    const fH = (Math.tan((camera.fov * Math.PI) / 180 / 2) * focusDist * 2) * 0.7;
    const fScaleY = fH;
    const fScaleX = fH * photo.aspect;

    const tX = isActive ? fScaleX : scaleX;
    const tY = isActive ? fScaleY : scaleY;

    easing.damp3(groupRef.current.scale, [tX, tY, 1], isActive ? 0.6 : 1.2, delta);
  });

  return (
    <group ref={groupRef}>
      {/* Click interaction wrapper */}
      <group 
        onClick={(e) => {
          e.stopPropagation();
          setActive(isActive ? null : photo.id);
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        {/* Frame Border (Gold Mesh Behind) */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[1.1, 1.1]} />
          <meshStandardMaterial 
            color={COLORS.GOLD_METALLIC} 
            metalness={1} 
            roughness={0.2} 
            emissive={COLORS.GOLD_METALLIC}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* The Photo */}
        <Image 
          url={photo.url} 
          transparent 
          side={THREE.DoubleSide}
        />
      </group>
    </group>
  );
};

export const PhotoAlbum: React.FC<PhotoAlbumProps> = ({ photos, progressRef }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { camera } = useThree();

  return (
    <>
      {photos.map((photo, i) => (
        <PhotoFrame
          key={photo.id}
          photo={photo}
          index={i}
          total={photos.length}
          isActive={activeId === photo.id}
          setActive={setActiveId}
          progressRef={progressRef}
        />
      ))}

      {/* Backdrop to dismiss focus */}
      {activeId && (
        <mesh 
          position={[camera.position.x, camera.position.y, camera.position.z]} 
          onClick={(e) => { e.stopPropagation(); setActiveId(null); }}
          visible={false} // Invisible raycast target
        >
          <sphereGeometry args={[100, 16, 16]} />
          <meshBasicMaterial side={THREE.BackSide} />
        </mesh>
      )}

      {/* Golden Dust Effect attached to camera logic (rendered in Scene actually, but positioned here) */}
      {/* Since we want it behind the focused image, we can just put it in the scene. 
          To simplify, let's just create a global dust system that fades in. */}
      {activeId && (
         <group position={camera.position} rotation={camera.rotation}>
            <group position={[0, 0, -10]}> {/* 10 units in front of camera, behind the photo at 8 units */}
                 <GoldenDust visible={!!activeId} />
            </group>
         </group>
      )}
    </>
  );
};