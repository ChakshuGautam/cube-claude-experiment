import React, { useState, useEffect, useCallback, useRef } from 'react';
import Cube from 'cubejs';
import './App.css';

const COLORS = ['white', 'red', 'green', 'orange', 'blue', 'yellow'];
const FACES = ['U', 'R', 'F', 'L', 'B', 'D'];

// Extracted idempotent functions

export function getColorFromFacelet(facelet) {
    return COLORS[FACES.indexOf(facelet)];
}

export function calculateColors(x, y, z, facelets) {
    const U = 0, R = 9, F = 18, L = 36, B = 45, D = 27;
    return [
        y === -1 ? getColorFromFacelet(facelets[U + (1 - y) * 3 + (1 + x)]) : null, // Up
        x === 1 ? getColorFromFacelet(facelets[R + (1 - z) * 3 + (1 + y)]) : null, // Right
        z === 1 ? getColorFromFacelet(facelets[F + (1 - y) * 3 + (1 + x)]) : null, // Front
        x === -1 ? getColorFromFacelet(facelets[L + (1 - z) * 3 + (1 - y)]) : null, // Left
        z === -1 ? getColorFromFacelet(facelets[B + (1 - y) * 3 + (1 - x)]) : null, // Back
        y === 1 ? getColorFromFacelet(facelets[D + (1 - y) * 3 + (1 + x)]) : null  // Down
    ];
}

export function getCubeState(cube) {
    if (!cube) return [];
    const state = [];
    const facelets = cube.asString();

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue;
                const colors = calculateColors(x, y, z, facelets);
                state.push({ position: [x, y, z], colors });
            }
        }
    }
    return state;
}

function demonstrateCubeSolve() {
    // Initialize the solver
    Cube.initSolver();

    // Create a new solved cube
    let cube = new Cube();
    console.log("Initial (solved) state:", cube.asString());

    // Scramble the cube
    cube = Cube.random();
    console.log("\nScrambled state:", cube.asString());

    // Get the solution
    const solution = cube.solve();
    console.log("\nSolution:", solution);

    // Apply each move in the solution
    const moves = solution.split(' ');
    moves.forEach((move, index) => {
        cube.move(move);
        console.log(`\nAfter move ${index + 1} (${move}):`);
        console.log(cube.asString());
        console.log("Is solved:", cube.isSolved());
    });

    // Final check
    console.log("\nFinal state:");
    console.log(cube.asString());
    console.log("Is solved:", cube.isSolved());
}

const CubePiece = ({ position, colors }) => (
    <div className="cube-piece" style={{
        transform: `translate3d(${position[0]}px, ${position[1]}px, ${position[2]}px)`
    }}>
        {colors.map((color, index) =>
            color && (
                <div key={index} className={`face face-${index}`} style={{ backgroundColor: color }} />
            )
        )}
    </div>
);

const RubiksCube = () => {
    const [cube, setCube] = useState(null);
    const [rotation] = useState({ x: -30, y: 45, z: 0 });
    const [isRotating, setIsRotating] = useState(false);
    const [isSolving, setIsSolving] = useState(false);
    const [isScrambled, setIsScrambled] = useState(false);
    const [currentAlgorithm, setCurrentAlgorithm] = useState('');
    const [currentStep, setCurrentStep] = useState('');
    const [solverInitialized, setSolverInitialized] = useState(false);
    const [error, setError] = useState(null);
    const moveCountRef = useRef(0);
    const containerRef = useRef(null);
    const [offset, setOffset] = useState({ x: 0, y: 0, z: 0 });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [renderCount, setRenderCount] = useState(0);

    const calculateOffset = useCallback(() => {
        if (containerSize.width === 0 || containerSize.height === 0) {
            console.log("Container size is zero, skipping offset calculation");
            return;
        }

        const cubeSize = 3 * 55; // Assuming 3x3 cube with 55px pieces
        const xOffset = (containerSize.width - cubeSize) / 2;
        const yOffset = (containerSize.height - cubeSize) / 2;

        console.log(`Calculating offset: x=${xOffset}, y=${yOffset}`);
        setOffset({ x: xOffset, y: yOffset, z: 0 });
    }, [containerSize]);

    const updateContainerSize = useCallback(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            console.log(`Updating container size: ${width}x${height}`);
            setContainerSize({ width, height });
    
            const cubeSize = 3 * 55;
            const xOffset = (width - cubeSize) / 2;
            const yOffset = (height - cubeSize) / 2;
    
            console.log(`Calculating offset: x=${xOffset}, y=${yOffset}`);
            setOffset({ x: xOffset, y: yOffset, z: 0 });
        } else {
            console.log("Container ref is not available");
        }
    }, [containerRef]);

    // Force re-render after initial mount
    useEffect(() => {
        console.log("Initial mount effect");
        const timeoutId = setTimeout(() => {
            setRenderCount(prev => prev + 1);
        }, 0);

        return () => clearTimeout(timeoutId);
    }, []);

    // Effect for updating container size
    useEffect(() => {
        console.log(`Render count: ${renderCount}`);
        updateContainerSize();

        const handleResize = () => {
            console.log("Window resize detected");
            updateContainerSize();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [updateContainerSize, renderCount]);

    // Effect to calculate offset whenever containerSize changes
    useEffect(() => {
        console.log("Container size changed, recalculating offset");
        calculateOffset();
    }, [containerSize, calculateOffset]);

    // Log on every render
    console.log("Rendering - Container Size:", containerSize, "Offset:", offset, "Render Count:", renderCount);


    useEffect(() => {
        const initSolver = async () => {
            try {
                setCurrentStep("Initializing solver...");
                await Cube.initSolver();
                setSolverInitialized(true);
                setCurrentStep("Solver initialized");
                setCube(new Cube());
            } catch (err) {
                console.error('Error initializing solver:', err);
                setError('Failed to initialize the solver. Please refresh the page and try again.');
            }
        };
        initSolver();
    }, []);

    const getCubeStateCallback = useCallback(() => getCubeState(cube), [cube]);


    const applyMove = useCallback((move) => {
        return new Promise(resolve => {
            setCube(prevCube => {
                const newCube = prevCube.clone();
                newCube.move(move);
                moveCountRef.current += 1;
                console.log(newCube.asString());
                resolve(newCube);  // Resolve the promise with the new cube
                return newCube;
            });
        });
    }, []);


    const rotateFace = useCallback((face, direction) => {
        if (isRotating || !cube) return;
        setIsRotating(true);
        const move = direction === 'clockwise' ? face : face + "'";
        applyMove(move, () => {
            setTimeout(() => setIsRotating(false), 100);
        });
    }, [isRotating, cube, applyMove]);

    const scrambleCube = useCallback(() => {
        if (!solverInitialized) return;
        setCube(prevCube => {
            const newCube = Cube.random();
            const solution = newCube.solve();
            console.log(`Scrambled cube: ${newCube.asString()}`);
            setCurrentAlgorithm(solution);
            setIsScrambled(true);
            setCurrentStep("Scrambled");
            moveCountRef.current += 1;
            return newCube;
        });
    }, [solverInitialized]);

    const solveCube = useCallback(() => {
        if (!solverInitialized || !isScrambled || isSolving) return;
        setIsSolving(true);
        setCurrentStep("Solving");

        setCube(currentCube => {
            const solution = currentCube.solve();
            setCurrentAlgorithm(solution);
            const moves = solution.split(' ');

            const applyNextMove = (index = 0, cubeState = currentCube) => {
                if (index < moves.length) {
                    const newCube = cubeState.clone();
                    newCube.move(moves[index]);
                    setCurrentStep(`Applying move: ${moves[index]}`);
                    setCube(newCube);
                    setTimeout(() => applyNextMove(index + 1, newCube), 100);
                } else {
                    setIsSolving(false);
                    setIsScrambled(false);
                    setCurrentStep(cubeState.isSolved() ? "Solved!" : `Solving failed ${cubeState.asString()}`);
                    setCurrentAlgorithm("");
                }
            };

            applyNextMove();
            return currentCube; // Return the initial cube state
        });
    }, [solverInitialized, isScrambled, isSolving, setCube]);

    useEffect(() => {
        const handleKeyPress = (event) => {
            const key = event.key.toUpperCase();
            if (FACES.includes(key)) {
                rotateFace(key, event.shiftKey ? 'counterclockwise' : 'clockwise');
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [rotateFace]);

    if (error) return <div className="error-message">{error}</div>;
    if (!cube || !solverInitialized) return <div>Loading... {currentStep}</div>;

    return (
        <div className="rubiks-cube-container" ref={containerRef} >
            <div className="rubiks-cube" key={moveCountRef.current} style={{
                transform: `
                translate3d(${offset.x}px, ${offset.y}px, ${offset.z}px) 
                rotateX(${rotation.x}deg) 
                rotateY(${rotation.y}deg) 
                rotateZ(${rotation.z}deg)`
            }}>
                {getCubeStateCallback().map((piece, index) => (
                    <CubePiece key={index} position={piece.position.map(p => p * 55)} colors={piece.colors} />
                ))}
            </div>
            <div className="controls">
                {FACES.map(face => (
                    <div key={face}>
                        <button onClick={() => rotateFace(face, 'clockwise')}>{face}</button>
                        <button onClick={() => rotateFace(face, 'counterclockwise')}>{face}'</button>
                    </div>
                ))}
                <button onClick={scrambleCube} disabled={isScrambled || isSolving}>Scramble</button>
                <button onClick={solveCube} disabled={!isScrambled || isSolving}>Solve</button>
            </div>
            <div className="current-step">Current Step: {currentStep}</div>
            <div className="current-algorithm">Current Algorithm: {currentAlgorithm}</div>
            <div className="instructions">
                <p>Use keyboard controls: Press U, D, F, B, L, R for clockwise rotations.</p>
                <p>Hold Shift + key for counterclockwise rotations.</p>
                <p>Click 'Scramble' to randomize the cube, then 'Solve' to watch it solve using cube.js!</p>
            </div>
        </div>
    );
};

export default RubiksCube;





