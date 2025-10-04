import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Line, Plane } from '@react-three/drei';
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

// Grass Ground Component
function GrassGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial 
        color="#3a5f3a" 
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
}

// Animated Golf Ball Component - Größerer weißer Ball
function AnimatedGolfBall({ trajectory, onAnimationComplete }: { 
  trajectory: THREE.Vector3[], 
  onAnimationComplete: () => void 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (trajectory.length === 0) return;
    
    let animationSpeed = 20; // Start speed
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        // Langsamer werden gegen Ende
        if (prev > trajectory.length * 0.8) {
          animationSpeed = 40;
        }
        
        const next = prev + 1;
        if (next >= trajectory.length) {
          clearInterval(interval);
          onAnimationComplete();
          return trajectory.length - 1; // Ball bleibt am Ende
        }
        return next;
      });
    }, animationSpeed);
    
    return () => clearInterval(interval);
  }, [trajectory, onAnimationComplete]);

  if (trajectory.length === 0 || currentIndex >= trajectory.length) {
    if (trajectory.length > 0) {
      // Ball am Ende anzeigen
      const lastPoint = trajectory[trajectory.length - 1];
      return (
        <mesh position={[lastPoint.x, Math.max(0.15, lastPoint.y), lastPoint.z]} castShadow>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial 
            color="white" 
            emissive="white" 
            emissiveIntensity={0.1}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      );
    }
    return null;
  }
  
  const point = trajectory[currentIndex];

  return (
    <mesh position={[point.x, Math.max(0.15, point.y), point.z]} castShadow>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial 
        color="white" 
        emissive="white" 
        emissiveIntensity={0.1}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

// Trail Lines Component - Blaue Linien für Flugbahn
function TrailLines({ shotHistory }: { shotHistory: ShotData[] }) {
  const visibleShots = shotHistory.slice(-5); // Letzte 5 Schläge
  
  return (
    <group>
      {visibleShots.map((shot, index) => {
        if (!shot.trajectory || shot.trajectory.length < 2) return null;
        
        const isLatest = index === visibleShots.length - 1;
        const opacity = isLatest ? 1.0 : 0.5;
        const lineWidth = isLatest ? 3 : 2;
        
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
      <Canvas 
        camera={{ position: [5, 10, 20], fov: 60 }}
        shadows
      >
        <Sky 
          distance={450000}
          sunPosition={[100, 50, 100]} 
          inclination={0.6}
          azimuth={0.25}
        />
        
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[50, 50, 25]} 
          intensity={1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* Grüner Gras-Boden */}
        <GrassGround />
        
        {/* Grid Lines für Distanz-Referenz */}
        <gridHelper 
          args={[500, 50, '#ffffff', '#ffffff']} 
          position={[0, 0.01, -150]}
          rotation={[0, 0, 0]}
        />
        
        {/* Target Flags at different distances */}
        <group>
          {/* 50m Flag */}
          <mesh position={[0, 2, -50]}>
            <cylinderGeometry args={[0.05, 0.05, 4]} />
            <meshStandardMaterial color="red" />
          </mesh>
          <mesh position={[0, 4, -50]}>
            <boxGeometry args={[0.8, 0.5, 0.05]} />
            <meshStandardMaterial color="red" />
          </mesh>
          
          {/* 100m Flag */}
          <mesh position={[0, 2, -100]}>
            <cylinderGeometry args={[0.05, 0.05, 4]} />
            <meshStandardMaterial color="yellow" />
          </mesh>
          <mesh position={[0, 4, -100]}>
            <boxGeometry args={[0.8, 0.5, 0.05]} />
            <meshStandardMaterial color="yellow" />
          </mesh>
          
          {/* 150m Flag */}
          <mesh position={[0, 2, -150]}>
            <cylinderGeometry args={[0.05, 0.05, 4]} />
            <meshStandardMaterial color="white" />
          </mesh>
          
          {/* 200m Flag */}
          <mesh position={[0, 2, -200]}>
            <cylinderGeometry args={[0.05, 0.05, 4]} />
            <meshStandardMaterial color="blue" />
          </mesh>
          
          {/* 250m Flag */}
          <mesh position={[0, 2, -250]}>
            <cylinderGeometry args={[0.05, 0.05, 4]} />
            <meshStandardMaterial color="purple" />
          </mesh>
        </group>
        
        {/* Trail Lines für vorherige Schläge */}
        <TrailLines shotHistory={shotHistory} />
        
        {/* Animierter Golfball */}
        <AnimatedGolfBall 
          trajectory={currentTrajectory} 
          onAnimationComplete={onAnimationComplete}
        />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, -100]}
          minDistance={10}
          maxDistance={200}
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

// Realistische Ballflug-Berechnung mit Roll
function calculateRealisticTrajectory(data: ShotData): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const carry = data.carry;
  const total = data.total;
  const apex = data.apex;
  const side = data.side;
  const launchAngle = data.launchAngle * Math.PI / 180;
  
  // Physik-Parameter
  const g = 9.81;
  const v0 = data.ballSpeed / 3.6; // km/h to m/s
  const vx = v0 * Math.cos(launchAngle);
  const vy = v0 * Math.sin(launchAngle);
  
  // Flugphase (bis Carry-Distanz)
  const flightTime = (2 * vy) / g; // Zeit in der Luft
  const flightSteps = 80; // Punkte für Flugphase
  
  for (let i = 0; i <= flightSteps; i++) {
    const t = (i / flightSteps) * flightTime;
    const progress = i / flightSteps;
    
    // Position berechnen
    const x = side * progress; // Seitliche Bewegung
    const z = -carry * progress; // Distanz
    let y = vy * t - 0.5 * g * t * t; // Höhe mit Gravitation
    
    // Sicherstellen dass Ball nicht unter Boden geht
    y = Math.max(0, y);
    
    points.push(new THREE.Vector3(x, y, z));
  }
  
  // Rollphase (von Carry bis Total) - nur auf dem Boden
  const rollDistance = total - carry;
  if (rollDistance > 0) {
    const rollSteps = 20;
    for (let i = 1; i <= rollSteps; i++) {
      const progress = i / rollSteps;
      const rollDeceleration = 1 - (progress * progress); // Quadratische Verlangsamung
      
      const x = side + (side * 0.1 * progress); // Leichte weitere Seitbewegung
      const z = -carry - (rollDistance * progress * rollDeceleration);
      const y = 0.15; // Ball-Radius über Boden
      
      points.push(new THREE.Vector3(x, y, z));
    }
  }
  
  return points;
}

// Random Test Shot Generator
function generateRandomShot(): ShotData {
  const carry = 120 + Math.random() * 80; // 120-200m
  return {
    carry: carry,
    total: carry + 5 + Math.random() * 15, // 5-20m Roll
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
    if (isAnimating) return;
    
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
    // Ball bleibt am Ende sichtbar
  };
  
  // Test Shot Button
  const sendTestShot = () => {
    if (isAnimating) return;
    
    const testData = generateRandomShot();
    // Runde die Werte
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
