import * as THREE from 'three';
import { Pane } from 'tweakpane';

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
const camera = new THREE.OrthographicCamera(
    -1, // left
    1, // right
    1, // top
    -1, // bottom
    -1, // near,
    1, // far
);
const renderer = new THREE.WebGLRenderer({ antialias: false, tonemapping: THREE.CineonToneMapping });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClearColor = false;
document.body.appendChild(renderer.domElement);

// Custom shader
const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() },
    topColor: { value: new THREE.Color(0, 0, 0) },
    bottomColor: { value: new THREE.Color(0.094, 0.141, 0.424) },
    widthFactor: { value: 1.5 },
    timeScale: { value: 1.0 }
};

const plane = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
    fragmentShader: `#include <common>
 
uniform vec3 iResolution;
uniform float iTime;

uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float widthFactor;
uniform float timeScale;
 
vec3 calcSine(vec2 uv, float speed, 
              float frequency, float amplitude, float shift, float offset,
              vec3 color, float width, float exponent, bool dir)
{
    float angle = timeScale * iTime * speed * frequency * -1.0 + (shift + uv.x) * 2.0;
    
    float y = sin(angle) * amplitude + offset;
    float clampY = clamp(0.0, y, y);
    float diffY = y - uv.y;
    
    float dsqr = distance(y, uv.y);
    float scale = 1.0;
    
    if(dir && diffY > 0.0)
    {
        dsqr = dsqr * 4.0;
    }
    else if(!dir && diffY < 0.0)
    {
        dsqr = dsqr * 4.0;
    }
    
    scale = pow(smoothstep(width * widthFactor, 0.0, dsqr), exponent);
    
    return min(color * scale, color);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec3 color = vec3(mix(topColor, bottomColor, uv.x * uv.y * 1.1));
    color += calcSine(uv, 0.2, 0.20, 0.2, 0.0, 0.5,  vec3(0.3, 0.3, 0.3), 0.1, 15.0,false);
    color += calcSine(uv, 0.4, 0.40, 0.15, 0.0, 0.5, vec3(0.3, 0.3, 0.3), 0.1, 17.0,false);
    color += calcSine(uv, 0.3, 0.60, 0.15, 0.0, 0.5, vec3(0.3, 0.3, 0.3), 0.05, 23.0,false);

    color += calcSine(uv, 0.1, 0.26, 0.07, 0.0, 0.3, vec3(0.3, 0.3, 0.3), 0.1, 17.0,true);
    color += calcSine(uv, 0.3, 0.36, 0.07, 0.0, 0.3, vec3(0.3, 0.3, 0.3), 0.1, 17.0,true);
    color += calcSine(uv, 0.5, 0.46, 0.07, 0.0, 0.3, vec3(0.3, 0.3, 0.3), 0.05, 23.0,true);
    color += calcSine(uv, 0.2, 0.58, 0.05, 0.0, 0.3, vec3(0.3, 0.3, 0.3), 0.2, 15.0,true);

    fragColor = vec4(color,1.0);
}
 
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}`,
uniforms: uniforms
});
scene.add(new THREE.Mesh(plane, material));

// Debug UI
const pane = new Pane();

pane.addBinding(uniforms.topColor, 'value', { label: 'Top color'}).on('change', (e) => {
    uniforms.topColor.value.set(e.value.r/255, e.value.g/255, e.value.b/255);
});
pane.addBinding(uniforms.bottomColor, 'value', { label: 'Bottom color' }).on('change', (e) => {
    uniforms.bottomColor.value.set(e.value.r/255, e.value.g/255, e.value.b/255);
});
pane.addBinding(uniforms.widthFactor, 'value', { label: 'Line width', min: 0.25, max: 8 });
pane.addBinding(uniforms.timeScale, 'value', { label: 'Time scale', min: 0, max: 8 });


const clock = new THREE.Clock()

// Animation Loop
function animate() {

    uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
    uniforms.iTime.value = clock.getElapsedTime();
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Adjust renderer and camera on window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
