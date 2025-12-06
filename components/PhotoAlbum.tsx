import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';
import { CONFIG, COLORS } from '../constants';
import { PhotoData } from '../types';

interface PhotoAlbumProps {
  photos: PhotoData[];
  progressRef: React.MutableRefObject<number>;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  onRemovePhoto: (id: string) => void;
}

interface PhotoFrameProps {
  photo: PhotoData;
  index: number;
  total: number;
  isActive: boolean;
  setActive: (id: string | null) => void;
  progressRef: React.MutableRefObject<number>;
  onRemovePhoto: (id: string) => void;
}

const GoldenDust = ({ visible }: { visible: boolean }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 300;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
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
  progressRef,
  onRemovePhoto
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const dir = new THREE.Vector3();

  // Initial Orbit Calculation
  const { radius, yBase, speedOffset, phaseOffset } = useMemo(() => {
    const yRange = CONFIG.TREE_HEIGHT * 0.6;
    const yBase = -CONFIG.TREE_HEIGHT / 3 + (index / Math.max(total - 1, 1)) * yRange;
    const h = CONFIG.TREE_HEIGHT;
    const rAtY = (CONFIG.TREE_RADIUS * 1.2 * (h - (yBase + h/2))) / h; 
    
    return {
      radius: rAtY + 1.0,
      yBase,
      speedOffset: 0.2 + Math.random() * 0.2,
      phaseOffset: Math.random() * Math.PI * 2
    };
  }, [index, total]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const progress = progressRef.current;

    // --- 1. Calculate Orbit Position (Idle) ---
    const currentRadius = radius + (1 - progress) * 10.0;
    
    const angle = time * speedOffset + phaseOffset;
    const bob = Math.sin(time * 1.5 + phaseOffset) * 0.5;

    const orbitX = Math.cos(angle) * currentRadius;
    const orbitZ = Math.sin(angle) * currentRadius;
    const orbitY = yBase + bob;

    const orbitPos = new THREE.Vector3(orbitX, orbitY, orbitZ);
    const lookTarget = new THREE.Vector3(0, orbitY, 0);

    // --- 2. Calculate Focus Position (Active) ---
    // Note: Since we disable OrbitControls when isActive, 'camera' is static.
    // Thus focusPos is static relative to the screen, achieving "Fixed on Screen".
    camera.getWorldDirection(dir);
    const focusDist = 8;
    const focusPos = camera.position.clone().add(dir.multiplyScalar(focusDist));
    
    const targetPos = isActive ? focusPos : orbitPos;

    // --- 3. Animation ---
    easing.damp3(groupRef.current.position, targetPos, isActive ? 0.6 : 1.5, delta);

    if (isActive) {
      groupRef.current.lookAt(camera.position);
    } else {
      groupRef.current.lookAt(lookTarget);
      if (progress < 0.5) {
         groupRef.current.rotation.z += delta * 0.5;
         groupRef.current.rotation.x += delta * 0.2;
      }
    }

    // Scale Logic
    const baseScale = 1.5;
    const scaleX = baseScale * photo.aspect;
    const scaleY = baseScale;

    // Calculate focused scale to fill ~60-70% height
    const fH = (Math.tan((camera.fov * Math.PI) / 180 / 2) * focusDist * 2) * 0.65;
    const fScaleY = fH;
    const fScaleX = fH * photo.aspect;

    const tX = isActive ? fScaleX : scaleX;
    const tY = isActive ? fScaleY : scaleY;

    easing.damp3(groupRef.current.scale, [tX, tY, 1], isActive ? 0.6 : 1.2, delta);
  });

  return (
    <group ref={groupRef}>
      <group 
        onClick={(e) => {
          e.stopPropagation();
          setActive(isActive ? null : photo.id);
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        {/* Frame Border */}
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

        {/* DELETE BUTTON (Only visible when active) */}
        {isActive && (
          <group 
            position={[0.55, 0.55, 0.1]}
            onClick={(e) => {
              e.stopPropagation();
              onRemovePhoto(photo.id);
              setActive(null);
            }}
          >
            {/* Red Circle Background */}
            <mesh>
              <circleGeometry args={[0.08, 32]} />
              <meshBasicMaterial color="#ff4444" toneMapped={false} />
            </mesh>
            {/* White Border */}
            <mesh position={[0,0,-0.001]}>
               <circleGeometry args={[0.1, 32]} />
               <meshBasicMaterial color="white" toneMapped={false} />
            </mesh>
            {/* X Icon */}
            <group rotation={[0,0,Math.PI/4]} scale={0.6}>
               <mesh position={[0,0,0.01]}>
                   <boxGeometry args={[0.15, 0.03, 0.01]} />
                   <meshBasicMaterial color="white" toneMapped={false} />
               </mesh>
               <mesh rotation={[0,0,Math.PI/2]} position={[0,0,0.01]}>
                   <boxGeometry args={[0.15, 0.03, 0.01]} />
                   <meshBasicMaterial color="white" toneMapped={false} />
               </mesh>
            </group>
          </group>
        )}
      </group>
    </group>
  );
};

export const PhotoAlbum: React.FC<PhotoAlbumProps> = ({ 
  photos, 
  progressRef, 
  activeId, 
  setActiveId,
  onRemovePhoto
}) => {
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
          onRemovePhoto={onRemovePhoto}
        />
      ))}

      {/* Backdrop to dismiss focus */}
      {activeId && (
        <mesh 
          position={[camera.position.x, camera.position.y, camera.position.z]} 
          onClick={(e) => { e.stopPropagation(); setActiveId(null); }}
          visible={false} 
        >
          <sphereGeometry args={[100, 16, 16]} />
          <meshBasicMaterial side={THREE.BackSide} />
        </mesh>
      )}

      {/* Golden Dust Effect */}
      {activeId && (
         <group position={camera.position} rotation={camera.rotation}>
            <group position={[0, 0, -10]}>
                 <GoldenDust visible={!!activeId} />
            </group>
         </group>
      )}
    </>
  );
};