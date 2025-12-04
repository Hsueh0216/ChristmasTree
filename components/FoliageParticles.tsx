import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, getRandomSpherePoint, getConePoint } from '../constants';

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  
  // Instanced Attributes
  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aRandom;
  attribute vec3 aRotationAxis;
  attribute float aRotationAngle;

  varying vec3 vColor;

  // Rotation matrix helper
  mat4 rotationMatrix(vec3 axis, float angle) {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      
      return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                  oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                  oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                  0.0,                                0.0,                                0.0,                                1.0);
  }

  void main() {
    // --- DYNAMIC SPEED CONTROL ---
    // Interpolate speeds based on state (uProgress)
    // 0.0 = Scattered (Slow, Lazy)
    // 1.0 = Tree Form (Fast, Energetic)

    // Flapping Speed
    float flapSpeedBase = mix(4.0, 25.0, uProgress); 
    float flapSpeed = flapSpeedBase + aRandom * 8.0;
    
    // Movement (Noise) Speed & Amplitude
    // Scattered: Slow speed, Wide range
    // Tree: Fast jitter, Tiny range (hovering in place)
    float moveSpeed = mix(0.5, 3.0, uProgress);
    float moveAmp = mix(2.5, 0.15, uProgress);

    // --- 1. BUTTERFLY SHAPING & FLAPPING (Local Space) ---
    vec3 pos = position;

    // "Pinch" the center to make a bow-tie shape
    // Geometry width is 0.25 (range -0.125 to 0.125)
    // Multiply by 8.0 to normalize range to roughly -1.0 to 1.0 for shaping math
    float nx = pos.x * 8.0; 
    
    // Shape logic: Thin body at x=0, wider wings at x=1
    float wingShape = 0.15 + 0.85 * pow(abs(nx), 0.8);
    pos.y *= wingShape;

    // Flapping Calculation
    float flapPhase = aRandom * 10.0;
    // Note: Changing speed inside sin(time * speed) can cause phase shifts, but acceptable for organic chaos
    float flap = sin(uTime * flapSpeed + flapPhase);
    
    // Bend wings: Rotate vertices around Z based on X distance
    float flapDepth = mix(0.15, 0.1, uProgress); // Flap deeper when slow
    pos.z += abs(nx) * flapDepth * flap;

    // Add a little body wobble/bobbing
    pos.y += sin(uTime * flapSpeed * 2.0 + flapPhase) * 0.03;

    // --- 2. INSTANCE ORIENTATION ---
    // Apply random initial rotation to the whole instance
    mat4 rotMat = rotationMatrix(aRotationAxis, aRotationAngle);
    vec4 orientedPos = rotMat * vec4(pos, 1.0);

    // --- 3. POSITION INTERPOLATION (Scatter -> Tree) ---
    vec3 start = aScatterPos;
    vec3 end = aTreePos;
    
    // Calculate Noise Offset
    vec3 noise = vec3(
      sin(uTime * moveSpeed + aRandom * 10.0),
      cos(uTime * moveSpeed * 0.9 + aRandom * 20.0),
      sin(uTime * moveSpeed * 1.1 + aRandom * 30.0)
    ) * moveAmp;

    vec3 currentPos = mix(start, end, uProgress) + noise;

    // --- 4. FINAL TRANSFORM ---
    vec4 worldPosition = modelMatrix * vec4(currentPos + orientedPos.xyz, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;

    // Color Logic: Glowing Emerald Green
    // Flash brightness when flapping
    float brightness = 1.0 + 0.5 * smoothstep(-0.5, 0.5, flap);
    
    vec3 emerald = vec3(0.0, 1.0, 0.3); 
    vec3 goldAccent = vec3(1.0, 0.9, 0.2);
    
    vec3 baseColor = mix(emerald, goldAccent, aRandom * 0.2); 
    
    vColor = baseColor * brightness;
  }
`;

const fragmentShader = `
  varying vec3 vColor;

  void main() {
    // Silhouette style - just output the calculated color
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

interface FoliageParticlesProps {
  progressRef: React.MutableRefObject<number>;
}

export const FoliageParticles: React.FC<FoliageParticlesProps> = ({ progressRef }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { scatterPositions, treePositions, randoms, rotationAxes, rotationAngles } = useMemo(() => {
    const count = CONFIG.FOLIAGE_COUNT;
    const scatterPosArray = new Float32Array(count * 3);
    const treePosArray = new Float32Array(count * 3);
    const randomArray = new Float32Array(count);
    const axisArray = new Float32Array(count * 3);
    const angleArray = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const sPos = getRandomSpherePoint(CONFIG.SCATTER_RADIUS);
      scatterPosArray[i * 3] = sPos.x;
      scatterPosArray[i * 3 + 1] = sPos.y;
      scatterPosArray[i * 3 + 2] = sPos.z;

      const tPos = getConePoint(CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS, -CONFIG.TREE_HEIGHT / 2);
      treePosArray[i * 3] = tPos.x;
      treePosArray[i * 3 + 1] = tPos.y;
      treePosArray[i * 3 + 2] = tPos.z;

      randomArray[i] = Math.random();
      
      const axis = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
      axisArray[i * 3] = axis.x;
      axisArray[i * 3 + 1] = axis.y;
      axisArray[i * 3 + 2] = axis.z;
      
      angleArray[i] = Math.random() * Math.PI * 2;
    }

    return { 
      scatterPositions: scatterPosArray, 
      treePositions: treePosArray, 
      randoms: randomArray,
      rotationAxes: axisArray,
      rotationAngles: angleArray
    };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uProgress.value = progressRef.current;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFIG.FOLIAGE_COUNT]} frustumCulled={false}>
      {/* 
        Geometry: Plane 0.25x0.25
        WidthSegments=2 is CRITICAL for center vertex (spine of butterfly)
      */}
      <planeGeometry args={[0.25, 0.25, 2, 1]}>
        <instancedBufferAttribute attach="attributes-aScatterPos" count={CONFIG.FOLIAGE_COUNT} array={scatterPositions} itemSize={3} />
        <instancedBufferAttribute attach="attributes-aTreePos" count={CONFIG.FOLIAGE_COUNT} array={treePositions} itemSize={3} />
        <instancedBufferAttribute attach="attributes-aRandom" count={CONFIG.FOLIAGE_COUNT} array={randoms} itemSize={1} />
        <instancedBufferAttribute attach="attributes-aRotationAxis" count={CONFIG.FOLIAGE_COUNT} array={rotationAxes} itemSize={3} />
        <instancedBufferAttribute attach="attributes-aRotationAngle" count={CONFIG.FOLIAGE_COUNT} array={rotationAngles} itemSize={1} />
      </planeGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
        }}
        transparent={false}
      />
    </instancedMesh>
  );
};
