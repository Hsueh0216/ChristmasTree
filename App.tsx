import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { TreeState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.SCATTERED);

  const toggleState = () => {
    setTreeState(prev => 
      prev === TreeState.SCATTERED ? TreeState.TREE_SHAPE : TreeState.SCATTERED
    );
  };

  return (
    <div className="relative w-full h-screen bg-[#001008] overflow-hidden">
      
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 20], fov: 45 }}
        gl={{ 
          antialias: false, // Post-processing handles AA usually, or turning it off for performance with bloom
          powerPreference: "high-performance",
          toneMappingExposure: 1.2
        }}
      >
        <Scene currentState={treeState} />
      </Canvas>

      {/* 2D Overlay */}
      <UI currentState={treeState} onToggle={toggleState} />
      
      {/* Vignette Overlay (Static CSS based) for extra depth if post-processing loads late */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,10,5,0.8)_100%)]"></div>
    </div>
  );
};

export default App;