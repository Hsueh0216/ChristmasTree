import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { easing } from 'maath';
import { FoliageParticles } from './FoliageParticles';
import { Ornaments } from './Ornaments';
import { TopStar } from './TopStar';
import { Gifts } from './Gifts';
import { PhotoAlbum } from './PhotoAlbum';
import { TreeState, PhotoData } from '../types';

interface SceneProps {
  currentState: TreeState;
  photos: PhotoData[];
}

export const Scene: React.FC<SceneProps> = ({ currentState, photos }) => {
  // We use a ref to track the animated progress value (0 to 1)
  // This allows us to pass a smooth float to the shaders/instances without triggering React re-renders every frame
  const progressRef = useRef(0);

  useFrame((state, delta) => {
    // Smoothly damp the progress value based on target state
    // 0 = Scattered, 1 = Tree Shape
    const target = currentState === TreeState.TREE_SHAPE ? 1 : 0;
    
    // Damp logic: value, target, smoothing time, delta
    easing.damp(progressRef, 'current', target, 1.5, delta);
  });

  return (
    <>
      <color attach="background" args={['#001008']} />

      {/* Lighting - Cinematic and Dramatic */}
      <ambientLight intensity={0.2} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.2} 
        penumbra={1} 
        intensity={200} 
        color="#fff5cc" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={50} color="#00ff88" />
      <pointLight position={[0, -5, 5]} intensity={50} color="#ffaa00" />

      {/* Environment Reflections */}
      <Environment preset="city" />

      {/* Content */}
      <group position={[0, -2, 0]}>
        <TopStar progressRef={progressRef} />
        <FoliageParticles progressRef={progressRef} />
        <Ornaments progressRef={progressRef} />
        <Gifts progressRef={progressRef} />
        <PhotoAlbum photos={photos} progressRef={progressRef} />
      </group>

      {/* Ground Reflections */}
      <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />

      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 2}
        autoRotate={currentState === TreeState.TREE_SHAPE}
        autoRotateSpeed={0.5}
        maxDistance={30}
        minDistance={8}
      />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={1.1} mipmapBlur intensity={1.5} radius={0.4} />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
        <Noise opacity={0.05} />
      </EffectComposer>
    </>
  );
};
