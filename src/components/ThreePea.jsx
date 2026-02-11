import React, { useEffect, useMemo } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { evaluatePlantHealth, CONDITIONS } from '../utils/PlantHealthEngine';

// Preload
useGLTF.preload('/okra2.glb');

export function ThreePea({ data, onLoad }) {
    // Currently using healthy_tomato as placeholder per previous context
    const { scene } = useGLTF('/okra2.glb');
    const clone = useMemo(() => scene.clone(true), [scene]);

    useEffect(() => {
        if (onLoad) onLoad();
    }, [onLoad]);

    const healthState = useMemo(() => {
        const safeData = data || { temperature: 25, humidity: 60, soil_moisture: 50 };
        return evaluatePlantHealth(safeData);
    }, [data]);

    useEffect(() => {
        const condition = healthState.id;

        clone.traverse((child) => {
            if (child.isMesh) {
                if (!child.userData.isCloned) {
                    child.material = child.material.clone();
                    child.userData.isCloned = true;
                }

                const name = child.name ? child.name.toLowerCase() : '';
                const isLeaf = name.includes('leaf') || name.includes('leaves');
                const isFruit = name.includes('tomato') || name.includes('okra') || name.includes('pod'); // Broader check
                const isStem = name.includes('stem');
                const isPot = name.includes("pot");

                // --- RESET DEFAULTS ---
                child.visible = true;
                child.material.emissive.setHex(0x000000);
                child.material.roughness = 0.5;
                child.material.transparent = false;
                child.material.opacity = 1.0;

                // Pea/Okra Base Colors (Slightly lighter/yellower green than tomato)
                if (isLeaf) child.material.color.set('#66CDAA');
                if (isStem) child.material.color.set('#556B2F');
                // Pea flowers/pods are usually green/white
                if (isFruit) child.material.color.set('#98FB98'); // Pale Green for "Pea Pods"
                if (isPot) child.material.color.set('#8B4513');


                // --- APPLY CONDITIONS ---
                switch (condition) {
                    case CONDITIONS.FROST:
                        if (isLeaf || isStem) {
                            child.material.color.lerp({ r: 0.7, g: 0.8, b: 1 }, 0.6);
                            child.material.emissive.setHex(0x001133);
                            child.material.roughness = 0.2;
                        }
                        // Frost damage: hide ALL leaves
                        if (isLeaf) {
                            child.visible = false;
                        }
                        if (isFruit) child.visible = false;
                        break;

                    case CONDITIONS.COLD_STRESS:
                        // Deep Cold: Hide all leaves and fruit (severe damage/stunted)
                        if (isLeaf) child.visible = false;
                        if (isFruit) child.visible = false;
                        break;

                    case CONDITIONS.HEAT_STRESS:
                        if (isLeaf) {
                            child.material.color.set('#BDB76B'); // Khaki (Dry)
                            child.material.roughness = 0.8;
                        }
                        break;

                    case CONDITIONS.DROUGHT:
                        if (isLeaf) {
                            child.material.color.set('#8B7355'); // Brown
                            child.material.roughness = 1.0;
                        }
                        if (isFruit) {
                            child.material.color.set('#8B7355');
                            child.material.roughness = 1.0;
                        }
                        break;

                    case CONDITIONS.ROOT_COLD_STRESS:
                        if (isStem) {
                            child.material.color.set('#88B0C8'); // Icy/Steel Blue Stem
                        }
                        if (isLeaf) {
                            child.material.color.set('#5F9EA0'); // Blueish cadet blue
                        }
                        break;

                    case CONDITIONS.ROOT_HEAT_STRESS:
                        if (isLeaf) child.material.color.set('#CD5C5C'); // Reddish
                        if (isStem) child.material.color.set('#8B0000'); // Dark Red
                        if (isFruit) child.material.color.set('#FF4500'); // Orange Red
                        break;

                    case CONDITIONS.ROOT_ROT:
                        if (isStem) child.material.color.set('#1a1100');
                        if (isLeaf) child.material.color.set('#556B2F');
                        break;

                    case CONDITIONS.HIGH_HUMIDITY:
                    case CONDITIONS.MOLD_RISK:
                        if (isLeaf) {
                            child.material.color.set('#778899'); // Grayish
                            child.material.roughness = 1.0;
                            child.material.transparent = true;
                            child.material.opacity = 0.8;
                        }
                        if (isFruit) {
                            child.material.color.set('#8B4500'); // Dull
                        }
                        break;

                    case CONDITIONS.FLOWER_DROP:
                    case CONDITIONS.BLOSSOM_DROP: // Keep BLOSSOM_DROP if used, but map FLOWER_DROP
                        if (isFruit) child.visible = false;
                        if (isLeaf) child.material.color.set('#8FBC8F'); // Dull
                        break;

                    case CONDITIONS.WATERLOGGING:
                    case CONDITIONS.WILTING_WET:
                        if (isLeaf) {
                            child.material.color.set('#EEE8AA'); // Pale Goldenrod
                            child.material.transparent = true;
                            child.material.opacity = 0.8;
                            // Simulate lower leaves dropping
                            if (child.uuid.charCodeAt(0) % 5 < 3) {
                                child.visible = false;
                            }
                        }
                        if (isFruit) child.visible = false;
                        if (isStem) child.material.color.set('#2F4F4F');
                        break;

                    case CONDITIONS.SLOW_GROWTH:
                        // Slightly paler
                        if (isLeaf) child.material.color.lerp({ r: 0.8, g: 0.8, b: 0.6 }, 0.3);
                        break;

                    case CONDITIONS.SUNSCALD:
                        if (isLeaf || isFruit) child.material.color.lerp({ r: 1, g: 1, b: 0.9 }, 0.4);
                        break;

                    default:
                        break;
                }
            }
        });
    }, [clone, healthState]);

    return (
        <group>
            <Center top>
                <group scale={healthState.id === CONDITIONS.COLD_STRESS ? 1.2 : 1.5} position={[0, 3.25, -5]}>
                    <primitive object={clone} />
                </group>
            </Center>
        </group>
    );
}
