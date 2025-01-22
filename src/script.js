import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Import OrbitControls
import { Pane } from 'tweakpane';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, tonemapping: THREE.CineonToneMapping });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add HDRI for reflections and IBL
const pmremGenerator = new PMREMGenerator(renderer);
const loader = new RGBELoader();
let environmentMap
loader.setPath('./hdri/');
loader.load('pretoria_gardens_1k.hdr', function (texture) {
    environmentMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = environmentMap;
    scene.environmentIntensity = 1.0;
    scene.background = new THREE.Color(0x222222);
    texture.dispose();
    pmremGenerator.dispose();
});

const directionalLight = new THREE.PointLight( 0xffffff, 10.0);
directionalLight.position.set(2, -1, 2)
scene.add( directionalLight );

// Create Cube Geometry and Material with Placeholder PBR Maps
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

// Placeholder textures
const textureLoader = new THREE.TextureLoader();
const colorTexture = textureLoader.load('./textures/color.jpg');
colorTexture.encoding = THREE.sRGBEncoding
const roughnessTexture = textureLoader.load('./textures/roughness.jpg');
const normalTexture = textureLoader.load('./textures/normal.jpg');
const metalnessTexture = textureLoader.load('./textures/metalness.jpg');

// Create a MeshStandardMaterial with PBR Maps
const cubeMaterial = new THREE.MeshStandardMaterial({
    map: colorTexture,        // Albedo Map
    //roughnessMap: roughnessTexture,  // Roughness Map
    normalMap: normalTexture,        // Normal Map
    //metalnessMap: metalnessTexture,   // Set some metalness
});

const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

// Set Camera Position
camera.position.z = 3;

// Add OrbitControls to the camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth damping
controls.dampingFactor = 0.25; // Set damping factor for smoother movements
controls.screenSpacePanning = false; // Disable panning along screen space
controls.maxPolarAngle = Math.PI / 2; // Restrict vertical camera movement

// Set up Tweakpane for controlling environment map intensity
const pane = new Pane();
const params = {
    envMapIntensity: 1.0,
    lightIntnesity: 10.0,
    lightPosY: -1.0
}

// Add an input field for adjusting the environment map intensity
const folder = pane.addFolder({ title: "Lights", expanded: true })

folder.addBinding(params, 'envMapIntensity', { min: 0, max: 2, step: 0.01 }).on('change', (e) => {
    scene.environmentIntensity = e.value
});

folder.addBinding(params, 'lightIntnesity', { min: 0, max: 20, step: 0.01 }).on('change', (e) => {
    directionalLight.intensity = e.value
});

folder.addBinding(params, 'lightPosY', { min: -3, max: 3, step: 0.1 }).on('change', (e) => {
    directionalLight.position.y = e.value
});
// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Update the OrbitControls
    controls.update(); // Only needed if controls.enableDamping or controls.auto-rotation are enabled

    renderer.render(scene, camera);
}

animate();

// Adjust renderer and camera on window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
