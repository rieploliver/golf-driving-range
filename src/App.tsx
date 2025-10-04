import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Sky } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

// 3D Ball Component
function GolfBall({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.02, 16, 16]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

// 3D Trajectory Line - Visible version
function TrajectoryLine({ points }: { points: THREE.Vector3[] }) {
  if (points.length < 2) return null;
  
  return (
    <group>
      {points.map((point, i) => 
        i % 2 === 0 ? ( // Jeden zweiten Punkt für Performance
          <mesh key={i} position={[point.x, point.y, point.z]}>
            <sphereGeometry args={[0.2, 8, 8]} /> {/* Größer: 0.2 statt 0.01 */}
            <meshBasicMaterial color="yellow" transparent opacity={0.8} />
          </mesh>
        ) : null
      )}
    </group>
  );
}

// Data Panel Component
function DataPanel({ data }: { data: any }) {
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
function DrivingRange3D({ ballPosition, trajectory }: any) {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Grid 
          args={[100, 100]} 
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#9d9d9d"
          fadeDistance={100}
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
        
        <GolfBall position={ballPosition} />
        <TrajectoryLine points={trajectory} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
      
      <div className="distance-markers">
        <span className="marker">50m</span>
        <span className="marker">100m</span>
        <span className="marker">150m</span>
        <span className="marker">200m</span>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [ballPosition, setBallPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [trajectory, setTrajectory] = useState<THREE.Vector3[]>([]);
  const [shotData, setShotData] = useState<any>(null);

  useEffect(() => {
    // WebSocket connection to your connector
    // Update this URL to match your connector
    const websocket = new WebSocket('ws://localhost:8080');
    
    websocket.onopen = () => {
      console.log('Connected to connector');
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received data:', data);
      
      // Update shot data
      setShotData(data);
      
      // Calculate trajectory (simplified)
      if (data.carry && data.apex && data.launchAngle) {
        const points = calculateTrajectory(data);
        setTrajectory(points);
        
        // Animate ball along trajectory
        animateBall(points);
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      websocket.close();
    };
  }, []);
  
const calculateTrajectory = (data: any) => {
  const points: THREE.Vector3[] = [];
  const distance = data.carry || 100;
  const apex = data.apex || 30;
  const side = data.side || 0;
  
  // Mehr sichtbare Punkte
  for (let i = 0; i <= 30; i++) { // 30 statt 50 für größere Abstände
    const t = i / 30;
    const x = side * t * 3; // Seitliche Bewegung verstärkt
    const z = -distance * t;
    const y = 4 * apex * t * (1 - t) + 0.1; // +0.1 damit nicht im Boden
    points.push(new THREE.Vector3(x, y, z));
  }
  
  return points;
};
  
  const animateBall = (points: THREE.Vector3[]) => {
    let index = 0;
    const animate = () => {
      if (index < points.length) {
        const point = points[index];
        setBallPosition([point.x, point.y, point.z]);
        index++;
        setTimeout(animate, 50);
      }
    };
    animate();
  };
  
  // Test shot button
  const sendTestShot = () => {
    const testData = {
      carry: 150,
      total: 165,
      ballSpeed: 220,
      launchAngle: 12,
      spinRate: 2500,
      clubSpeed: 160,
      apex: 28,
      side: -5
    };
    setShotData(testData);
    const points = calculateTrajectory(testData);
    setTrajectory(points);
    animateBall(points);
  };

  return (
    <div className="app">
      <div className="left-panel">
        <DrivingRange3D ballPosition={ballPosition} trajectory={trajectory} />
        <button className="test-button" onClick={sendTestShot}>
          Test Shot
        </button>
      </div>
      <div className="right-panel">
        <DataPanel data={shotData} />
      </div>
    </div>
  );
}

export default App;
