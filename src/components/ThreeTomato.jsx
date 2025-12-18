import React, { useEffect } from 'react';
import { useGLTF, Center } from '@react-three/drei';

export function ThreeTomato({ temperature = 25 }) {
    // Note: Humidity prop removed from logic as requested. 
    // The state now relies entirely on temperature ranges.
    
    const { scene } = useGLTF('/Untitled.glb');

    useEffect(() => {
        const temp = Number(temperature);

        scene.traverse((child) => {
            if (child.isMesh) {
                // Clone material to ensure unique instances
                if (!child.userData.isCloned) {
                    child.material = child.material.clone();
                    child.userData.isCloned = true;
                }

                const name = child.name ? child.name.toLowerCase() : '';
                const isLeaf = name.includes('leaf') || name.includes('leaves');
                const isTomato = name.includes('tomato');
                const isStem = name.includes('stem');
                const isPot = name.includes('pot');

                // Reset Defaults
                child.visible = true;
                child.material.roughness = 0.5;
                child.material.metalness = 0.0;

                // --- APPLY VISUALS ---

                // CASE 1: FROST (temp <= 0)
                if (temp <= 2) {
                    if (isLeaf || isTomato) child.visible = false;
                    if(isStem)
                    {
                        child.material.color.set('#1E90FF'); // Bright Blue
                        child.material.roughness = 0.4;
                    }
                }

                //heatstroke condition aanu ith
                else if (temp > 40) {
                    if (isLeaf) {
                        
                        child.visible = false;
                    } else if (isStem) {
                        child.material.color.set('#5d3e2f'); 
                    } else if (isTomato) {
                        child.visible = false; 
                    }
                }

                //chilling injury condition
                else if (temp > 0 && temp < 10) {
                    if (isLeaf) {
                        child.material.color.set('#90bb90'); // Greyish-Green (Moldy)
                        child.material.roughness = 0.5;      // Fuzzy texture
                    } else if (isStem) {
                        child.material.color.set('#5c715c'); // Rotting Stem
                    } else if (isTomato) {
                        child.material.color.set('#802323'); // Deep Rotten Red
                        child.material.roughness = 0.5;      // Mushy/Dull
                    }
                }

                // CASE 4: OPTIMAL (10 <= temp <= 35)
                else {
                    if (isLeaf) {
                        child.material.color.set('#2E8B57'); // Healthy Green
                    } else if (isStem) {
                        child.material.color.set('#3A5F0B'); // Healthy Stem
                    } else if (isTomato) {
                        child.material.color.set('#c61b1b'); // Bright Red
                        child.material.roughness = 0.2;      // Shiny
                        child.material.metalness = 0.1; 
                    }
                }

                // Always color Pot
                if (isPot) {
                    child.material.color.set('#8B4513');
                }
            }
        });
    }, [scene, temperature]);

    return (
        <group dispose={null}>
            <Center top>
                <group scale={0.5} position={[0, 0, -5]}>
                    <primitive object={scene} />
                </group>
            </Center>
        </group>
    );
}

useGLTF.preload('/Untitled.glb');