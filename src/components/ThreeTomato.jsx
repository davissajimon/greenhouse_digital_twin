import React, { useEffect, useMemo } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { evaluatePlantHealth, CONDITIONS } from '../utils/PlantHealthEngine';

// Preload the model for better performance
useGLTF.preload('/Untitled.glb');

function ThreeTomatoComponent({ data, onLoad }) {
    const { scene } = useGLTF('/Untitled.glb');
    const clone = useMemo(() => scene.clone(true), [scene]);

    // Trigger onLoad when component mounts (and model is effectively ready)
    useEffect(() => {
        if (onLoad) onLoad();
    }, [onLoad]);

    // Memoize health evaluation to avoid recalculation
    const healthState = useMemo(() => {
        const safeData = data || { temperature: 25, humidity: 60, soil_moisture: 50 };
        return evaluatePlantHealth(safeData);
    }, [data]);

    useEffect(() => {
        const condition = healthState.id;

        clone.traverse((child) => {
            if (child.isMesh) {
                // Ensure unique material
                if (!child.userData.isCloned) {
                    child.material = child.material.clone();
                    child.userData.isCloned = true;
                    // Backup original color if needed, simplified here by hardcoding defaults
                }

                // Identify Parts
                const name = child.name ? child.name.toLowerCase() : '';
                const isLeaf = name.includes('leaf') || name.includes('leaves');
                const isFruit = name.includes('tomato');
                const isStem = name.includes('stem');
                const isPot = name.includes('pot');

                // --- RESET TO HEALTHY DEFAULT ---
                child.visible = true;
                if (isLeaf) {
                    child.material.color.set('#2E8B57'); // Healthy Leaf Green
                    child.material.emissive.setHex(0x000000);
                    child.material.roughness = 0.5;
                }
                if (isStem) child.material.color.set('#3A5F0B');
                if (isFruit) {
                    child.material.color.set('#c61b1b'); // Red
                    child.material.roughness = 0.2;
                }
                if (isPot) child.material.color.set('#8B4513');


                // --- APPLY CONDITION VISUALS ---

                switch (condition) {
                    case CONDITIONS.FROST:
                        // Blue tint + slight emissive glow (frozen)
                        if (isLeaf || isStem) {
                            child.material.color.lerp({ r: 0.5, g: 0.7, b: 1 }, 0.6); // Icy Blue mix
                            child.material.roughness = 0.2; // Shiny ice
                            child.material.emissive.setHex(0x001133);
                        }
                        // Frost damage: hide ALL leaves
                        if (isLeaf) {
                            child.visible = false;
                        }
                        if (isFruit) child.visible = false; // Fruit drop/hidden in frost
                        break;

                    case CONDITIONS.COLD_STRESS:
                        // Cold Stress: Hide all leaves and fruit (severe damage/stunted)
                        if (isLeaf) {
                            child.visible = false;
                        }
                        // Flower/Fruit disappear
                        if (isFruit) {
                            child.visible = false;
                        }
                        break;

                    case CONDITIONS.HEAT_STRESS:
                        // Yellow/Brown scorching
                        if (isLeaf) {
                            child.material.color.set('#e6b800'); // Yellowish
                            child.material.roughness = 0.8; // Dry
                        }
                        break;

                    case CONDITIONS.DROUGHT:
                        // Brown + Dull
                        if (isLeaf) {
                            child.material.color.set('#8B7355'); // Dried Earth Color
                            child.material.roughness = 1.0;
                        }
                        if (isFruit) {
                            child.material.color.set('#3d2b1f'); // Brownish-black
                            child.material.roughness = 1.0; // Non-shiny / dry
                        }
                        if (isStem) {
                            child.material.color.set('#2F1B10'); // Dark Blackish-Brown
                            child.material.roughness = 1.0;
                        }
                        break;

                    case CONDITIONS.ROOT_COLD_STRESS:
                        // Root Cold: Cold creeps up stem
                        if (isStem) {
                            child.material.color.set('#88B0C8'); // Icy/Steel Blue Stem
                            child.material.roughness = 0.4;
                        }
                        if (isLeaf) {
                            child.material.color.set('#4A708B'); // Cold bluish-green leaves
                        }
                        if (isFruit) {
                            child.material.color.set('#87CEEB'); // Sky Blue
                            child.material.roughness = 0.3;
                        }
                        break;

                    case CONDITIONS.ROOT_HEAT_STRESS:
                        // Whole plant reddish (Root Heat Stress)
                        if (isLeaf) {
                            child.material.color.set('#CD5C5C'); // Indian Red / Reddish
                        }
                        if (isStem) {
                            child.material.color.set('#8B0000'); // Dark Red
                        }
                        if (isFruit) {
                            child.material.color.set('#FF4500'); // Orange Red
                        }
                        break;

                    case CONDITIONS.ROOT_ROT:
                        // Dark stem, sickly leaves
                        if (isStem) child.material.color.set('#2F1B10'); // Dark Brown/Black
                        if (isLeaf) child.material.color.set('#556B2F'); // Olive Drab (Sick)
                        break;

                    case CONDITIONS.MOLD_RISK:
                    case CONDITIONS.HIGH_HUMIDITY:
                    case CONDITIONS.DISEASE_ZONE:
                        // Pale yellow (chlorosis) + Droopy
                        if (isLeaf) {
                            child.material.color.set('#9ACD32'); // Pale Yellow Green
                            child.material.transparent = true;
                            child.material.opacity = 0.7; // Weak appearance
                            // Visual droop (pseudo-simulated by rotation if possible, but here just color/opacity is safer for static mesh)
                            // If we want actual rotation, we'd need to manipulate the mesh rotation, but that persists permanently.
                            // Better to stick to material changes for "unhealthy look" or minimal safe scale Y.
                        }
                        if (isFruit) {
                            child.material.color.set('#8B4500'); // Dull brownish red
                            child.material.roughness = 0.8;
                        }
                        break;

                    case CONDITIONS.SUNSCALD:
                        if (isLeaf || isFruit) {
                            child.material.color.lerp({ r: 1, g: 1, b: 0.8 }, 0.5); // Bleached
                        }
                        break;

                    case CONDITIONS.FLOWER_DROP:
                        // No flowers/fruit + Dull leaves
                        if (isFruit) {
                            child.visible = false;
                        }
                        if (isLeaf) {
                            child.material.color.set('#6E8B3D'); // Dull Olive Green
                        }
                        break;

                    case CONDITIONS.WATERLOGGING:
                        // Waterlogging: Pale yellow leaves, lower leaves drop, no fruit
                        if (isLeaf) {
                            child.material.color.set('#F0E68C'); // Khaki (Pale Yellow)
                            child.material.transparent = true;
                            child.material.opacity = 0.8;

                            // Simulate lower leaves dropping (approx 60% loss)
                            if (child.uuid.charCodeAt(0) % 5 < 3) {
                                child.visible = false;
                            }
                        }
                        if (isFruit) {
                            child.visible = false; // Flowers/Fruit drop
                        }
                        if (isStem) {
                            child.material.color.set('#5C4033'); // Darker wet stem
                        }
                        break;

                    case CONDITIONS.SLOW_GROWTH:
                        // Pale / Stunted
                        if (isLeaf) child.material.color.set('#9ACD32'); // YellowGreen
                        break;

                    default:
                        // Normal is handled by reset
                        break;
                }
            }
        });
    }, [clone, healthState]);

    return (
        <group>
            <Center top>
                <group scale={healthState.id === CONDITIONS.COLD_STRESS ? 0.45 : 0.5625} position={[0, 2, -5]}>
                    <primitive object={clone} />
                </group>
            </Center>
        </group>
    );
}

// Memoize the component to prevent unnecessary re-renders
export const ThreeTomato = React.memo(ThreeTomatoComponent, (prevProps, nextProps) => {
    // Deep comparison of data object
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});
