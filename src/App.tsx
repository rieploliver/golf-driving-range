import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Line } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

// Shot history type
interface ShotData {
  carry: number;
  total: number;
  ballSpeed: number;
  launchAngle: number;
  spinRate: number;
  clubSpeed: number;
  apex: number;
  side: number;
  trajectory?: THREE.Vector3[];
}

// Animated Golf Ball Component
function AnimatedGolfBall({ trajectory, onAnimationComplete }: { 
  trajectory: THREE.Vector3[], 
  onAnimationComplete: () => void 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useFrame(() => {
    if (meshRef.current && trajectory.length > 0 && currentIndex < trajectory.length) {
      const point = trajectory[currentIndex];
      meshRef.current.position.set(point.x, point.y, point.z);
      
      // Realistische Geschwindigkeit - schneller am Anfang, langsamer am Ende
      const speed = Math.max(1, Math.floor((trajectory.length - currentIndex) / 10));
      if (currentIndex % speed === 0) {
        setCurrentIndex(prev => prev + 1);
      }
      
      if (currentIndex >= trajectory.length - 1) {
        onAnimationComplete();
        setCurrentIndex(0);
      }
    }
  });

  if (trajectory.length === 0) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} />
    </mesh>
  );
}

// Trail Lines Component - zeigt die letzten 5 Schläge
function TrailLines({ shotHistory }: { shotHistory: ShotData[] }) {
  const visibleShots = shotHistory.slice(-5); // Letzte 5 Schläge
  
  return (
    <group>
      {visibleShots.map((shot, index) => {
        if (!shot.trajectory || shot.trajectory.length < 2) return null;
        
        const isLatest = index === visibleShots.length - 1;
        const opacity = isLatest ? 1.0 : 0.5;
        const lineWidth = isLatest ? 2 : 1;
        
        // Konvertiere Vector3 Array zu Number Array für Line Component
        const points = shot.trajectory.map(p => [p.x, p.y, p.z]).flat();
        
        return (
          <Line
            key={`trail-${index}`}
            points={shot.trajectory}
            color="#0080ff"
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
          />
        );
      })}
    </group>
  );
}

// Data Panel Component
function DataPanel({ data }: { data: ShotData | null }) {
  return (
    <div className="data-panel">
      <h2>Shot Data</h2>
      <div className="data-grid">
        <div className="data-item">
          <label>Carry</label>
          <span className="value">{data?.carry || '--'} m</span>
        </div>
        <div className="data-item">
          <label>Total</label>
          <span className="value">{data?.total || '--'} m</span>
        </div>
        <div className="data-item">
          <label>Ball Speed</label>
          <span className="value">{data?.ballSpeed || '--'} km/h</span>
        </div>
        <div className="data-item">
          <label>Launch Angle</label>
          <span className="value">{data?.launchAngle || '--'}°</span>
        </div>
        <div className="data-item">
          <label>Spin Rate</label>
          <span className="value">{data?.spinRate || '--'} rpm</span>
        </div>
        <div className="data-item">
          <label>Club Speed</label>
          <span className="value">{data?.clubSpeed || '--'} km/h</span>
        </div>
        <div className="data-item">
          <label>Apex</label>
          <span className="value">{data?.apex || '--'} m</span>
        </div>
        <div className="data-item">
          <label>Side</label>
          <span className="value">{data?.side || '--'} m</span>
        </div>
      </div>
      
      <div className="connection-status">
        <div className="status-indicator"></div>
        <span>Waiting for connector...</span>
      </div>
    </div>
  );
}

// 3D Driving Range Component
function DrivingRange3D({ currentTrajectory, shotHistory, onAnimationComplete }: {
  currentTrajectory: THREE.Vector3[];
  shotHistory: ShotData[];
  onAnimationComplete: () => void;
}) {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [5, 10, 20], fov: 60 }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Grid 
          args={[300, 300]} 
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#9d9d9d"
          fadeDistance={300}
          fadeStrength={1}
          followCamera={false}
        />
        
        {/* Target Flags at different distances */}
        <mesh position={[0, 2, -50]}>
          <cylinderGeometry args={[0.05, 0.05, 4]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <mesh position={[0, 4, -50]}>
          <boxGeometry args={[0.5, 0.3, 0.1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        <mesh position={[0, 2, -100]}>
          <cylinderGeometry args={[0.05, 0.05, 4]} />
          <meshStandardMaterial color="yellow" />
        </mesh>
        
        <mesh position={[0, 2, -150]}>
          <cylinderGeometry args={[0.05, 0.05, 4]} />
          <meshStandardMaterial color="white" />
        </mesh>
        
        <mesh position={[0, 2, -200]}>
          <cylinderGeometry args={[0.05, 0.05, 4]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        
        {/* Trail Lines für vorherige Schläge */}
        <TrailLines shotHistory={shotHistory} />
        
        {/* Animierter Golfball */}
        {currentTrajectory.length > 0 && (
          <AnimatedGolfBall 
            trajectory={currentTrajectory} 
            onAnimationComplete={onAnimationComplete}
          />
        )}
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, -75]}
        />
      </Canvas>
      
      <div className="distance-markers">
        <span className="marker">50m</span>
        <span className="marker">100m</span>
        <span className="marker">150m</span>
        <span className="marker">200m</span>
        <span className="marker">250m</span>
      </div>
    </div>
  );
}

// Realistische Ballflug-Berechnung
function calculateRealisticTrajectory(data: ShotData): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const distance = data.carry;
  const apex = data.apex;
  const side = data.side;
  const launchAngle = data.launchAngle * Math.PI / 180;
  
  // Physik-Parameter
  const g = 9.81; // Gravity
  const v0 = data.ballSpeed / 3.6; // km/h to m/s
  const vx = v0 * Math.cos(launchAngle);
  const vy = v0 * Math.sin(launchAngle);
  
  // Spin-Effekt (Magnus)
  const spinEffect = data.spinRate / 10000; // Vereinfacht
  
  // Zeit bis zum Aufprall berechnen
  const totalTime = distance / vx;
  const steps = 100; // Mehr Punkte für smoothe Kurve
  
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalTime;
    
    // Position berechnen
    const x = side * (t / totalTime) + (side * spinEffect * Math.sin(t * 2)); // Seitliche Kurve
    const z = -vx * t; // Distanz
    let y = vy * t - 0.5 * g * t * t; // Höhe mit Gravitation
    
    // Sicherstellen dass Ball nicht unter Boden geht
    y = Math.max(0, y);
    
    points.push(new THREE.Vector3(x, y, z));
  }
  
  return points;
}

// Random Test Shot Generator
function generateRandomShot(): ShotData {
  return {
    carry: 120 + Math.random() * 80, // 120-200m
    total: 130 + Math.random() * 90, // 130-220m
    ballSpeed: 180 + Math.random() * 60, // 180-240 km/h
    launchAngle: 8 + Math.random() * 12, // 8-20 degrees
    spinRate: 2000 + Math.random() * 2000, // 2000-4000 rpm
    clubSpeed: 140 + Math.random() * 40, // 140-180 km/h
    apex: 20 + Math.random() * 20, // 20-40m
    side: -10 + Math.random() * 20 // -10 to +10m
  };
}

// Main App Component
function App() {
  const [currentTrajectory, setCurrentTrajectory] = useState<THREE.Vector3[]>([]);
  const [shotHistory, setShotHistory] = useState<ShotData[]>([]);
  const [currentShotData, setCurrentShotData] = useState<ShotData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // WebSocket connection to your connector
    const websocket = new WebSocket('ws://localhost:8080');
    
    websocket.onopen = () => {
      console.log('Connected to connector');
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received data:', data);
      processShot(data);
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      websocket.close();
    };
  }, []);
  
  const processShot = (data: ShotData) => {
    if (isAnimating) return; // Warte bis aktuelle Animation fertig ist
    
    const trajectory = calculateRealisticTrajectory(data);
    data.trajectory = trajectory;
    
    setCurrentShotData(data);
    setCurrentTrajectory(trajectory);
    setIsAnimating(true);
  };
  
  const handleAnimationComplete = () => {
    if (currentShotData) {
      setShotHistory(prev => [...prev, currentShotData]);
    }
    setIsAnimating(false);
    // Ball bleibt am Ende der Trajectory stehen
  };
  
  // Test Shot Button - jedes Mal andere Werte
  const sendTestShot = () => {
    if (isAnimating) return; // Nicht während Animation
    
    const testData = generateRandomShot();
    // Runde die Werte für bessere Anzeige
    testData.carry = Math.round(testData.carry);
    testData.total = Math.round(testData.total);
    testData.ballSpeed = Math.round(testData.ballSpeed);
    testData.launchAngle = Math.round(testData.launchAngle * 10) / 10;
    testData.spinRate = Math.round(testData.spinRate);
    testData.clubSpeed = Math.round(testData.clubSpeed);
    testData.apex = Math.round(testData.apex);
    testData.side = Math.round(testData.side * 10) / 10;
    
    processShot(testData);
  };

  return (
    <div className="app">
      <div className="left-panel">
        <DrivingRange3D 
          currentTrajectory={currentTrajectory}
          shotHistory={shotHistory}
          onAnimationComplete={handleAnimationComplete}
        />
        <button 
          className="test-button" 
          onClick={sendTestShot}
          disabled={isAnimating}
        >
          {isAnimating ? 'Ball Flying...' : 'Test Shot'}
        </button>
      </div>
      <div className="right-panel">
        <DataPanel data={currentShotData} />
      </div>
    </div>
  );
}

export default App;
