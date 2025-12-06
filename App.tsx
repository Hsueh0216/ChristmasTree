import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { TreeState, PhotoData } from './types';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.SCATTERED);
  const [photos, setPhotos] = useState<PhotoData[]>([]);

  const toggleState = () => {
    setTreeState(prev => 
      prev === TreeState.SCATTERED ? TreeState.TREE_SHAPE : TreeState.SCATTERED
    );
  };

  const handleUpload = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          // Create an image object to get dimensions
          const img = new Image();
          img.src = e.target.result as string;
          img.onload = () => {
            const aspect = img.width / img.height;
            setPhotos(prev => [
              ...prev, 
              { 
                id: uuidv4(), 
                url: e.target!.result as string, 
                aspect 
              }
            ]);
          };
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="relative w-full h-screen bg-[#001008] overflow-hidden">
      
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 20], fov: 45 }}
        gl={{ 
          antialias: false, 
          powerPreference: "high-performance",
          toneMappingExposure: 1.2
        }}
      >
        <Scene currentState={treeState} photos={photos} />
      </Canvas>

      {/* 2D Overlay */}
      <UI currentState={treeState} onToggle={toggleState} onUpload={handleUpload} />
      
      {/* Vignette Overlay (Static CSS based) for extra depth if post-processing loads late */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,10,5,0.8)_100%)]"></div>
    </div>
  );
};

export default App;
