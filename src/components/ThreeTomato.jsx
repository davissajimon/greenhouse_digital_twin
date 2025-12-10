import React, { useEffect } from 'react';
import { useGLTF, Center } from '@react-three/drei';

export function ThreeTomato({ healthStatus, temperature = 25 }) {
    // Safe Loading: Load the entire scene safely
    const { scene } = useGLTF('/Untitled.glb');

    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                // Clone material to ensure unique instances
                child.material = child.material.clone();

                const name = child.name ? child.name.toLowerCase() : '';

                // --- TEMPERATURE LOGIC ---
                // Defaults (Healthy)
                let leafHex = '#228B22';   // Forest Green
                let tomatoHex = '#FF6347'; // Tomato Red
                let lookDead = false;

                // 1. Frostbite / Chilling (< 10°C)
                if (temperature <= 0) {
                    // Frostbite: Deep Blue Leaves, Rotten Tomatoes
                    leafHex = '#1E3A8A';    // Deep Blue
                    tomatoHex = '#2D1B2E';  // Rotten/Blackish
                } else if (temperature < 10) {
                    // Chilling: Light Blue Leaves
                    leafHex = '#60A5FA';    // Light Blue
                }

                // 2. Heatstroke / High Heat (> 35°C)
                else if (temperature > 40) {
                    // Heatstroke: Dead/Brown
                    leafHex = '#8B4513';    // Dead Brown
                    lookDead = true;
                } else if (temperature > 35) {
                    // High Heat: Warm/Orange
                    leafHex = '#D97706';    // Warm Orange
                }

                // --- APPLY COLORS ---

                // Pot (Always Terracotta)
                if (name.includes('pot')) {
                    child.material.color.set('#8B4513');
                    child.material.roughness = 0.6;
                }
                // Stem (Follows Leaf color mostly, or dark green)
                else if (name.includes('stem')) {
                    child.material.color.set(lookDead ? '#5D4037' : '#228B22');
                    child.material.roughness = 0.5;
                }
                // Leaves
                else if (name.includes('leaf') || name.includes('leaves')) {
                    child.material.color.set(leafHex);
                    child.material.roughness = 0.5;
                }
                // Tomatoes
                else if (name.includes('tomato')) {
                    child.material.color.set(tomatoHex);
                    child.material.roughness = (temperature <= 0) ? 0.9 : 0.2; // Rotten is rough, healthy is shiny
                    child.material.metalness = (temperature <= 0) ? 0.0 : 0.1;
                }
            }
        });
    }, [scene, temperature]); // Re-run when temperature changes

    return (
        <group dispose={null}>
            <Center top>
                <group scale={0.5}>
                    <primitive object={scene} />
                </group>
            </Center>
        </group>
    );
}

useGLTF.preload('/Untitled.glb');
