const NASA_API_KEY = 'sMdRqmN5aujA1LsZC2lWFT6l53XwNHCqefMCw8Ho';
const DEFAULT_ROCKY_DENSITY = 2700;

const CASE_STUDIES = [
    { name: "Case Study: Chelyabinsk (20m)", id: 'custom_chelyabinsk', diameter: 0.020, isCustom: true },
    { name: "Case Study: Tunguska (60m)", id: 'custom_tunguska', diameter: 0.060, isCustom: true },
    { name: "Custom Scenario Builder", id: 'custom_generic', isCustom: true, diameter: 0.5 }
];
const POTENTIAL_TARGETS = [
    { name: 'Jabalpur', coords: [23.1815, 79.9864] }, { name: 'Tokyo', coords: [35.6762, 139.6503] },
    { name: 'New York City', coords: [40.7128, -74.0060] }, { name: 'London', coords: [51.5072, -0.1276] },
];

const mitigationConfig = {
    nudge: { name: 'Kinetic Nudge', label: 'Nudge Power', description: 'Impact spacecraft to transfer momentum.', efficiency: 1.0 },
    tractor: { name: 'Gravity Tractor', label: 'Tractor Duration', description: 'Use spacecraft gravity to slowly pull the asteroid.', efficiency: 0.6 },
    laser: { name: 'Laser Ablation', label: 'Laser Intensity', description: 'Vaporize surface material to create thrust.', efficiency: 1.5 },
    nuclear: { name: 'Nuclear Standoff', label: 'Detonation Yield', description: 'Use radiation to ablate the surface for a powerful push.', efficiency: 2.5 }
};


const asteroidNameEl = document.getElementById('hud-asteroid-name'); 
const statusTextEl = document.getElementById('hud-status-text'); 
const targetLocationNameEl = document.getElementById('hud-impact-location');
const impactDetailsEl = document.getElementById('impact-details'); const energyDetailsEl = document.getElementById('energy-details'); const asteroidSelectEl = document.getElementById('asteroid-select'); const densitySlider = document.getElementById('density-slider'); const densityValueEl = document.getElementById('density-value'); const eventTitleEl = document.getElementById('event-title'); const filterContainer = document.getElementById('filter-container'); const randomizeImpactBtn = document.getElementById('randomize-impact-btn'); const impactLocationTextEl = document.getElementById('impact-location-text'); const velocitySlider = document.getElementById('velocity-slider'); const angleSlider = document.getElementById('angle-slider'); const velocityValueEl = document.getElementById('velocity-value'); const angleValueEl = document.getElementById('angle-value');
const diameterSliderContainer = document.getElementById('diameter-slider-container'); const diameterSlider = document.getElementById('diameter-slider'); const diameterValueEl = document.getElementById('diameter-value');
const modalContainer = document.getElementById('modal-container'); const showModalBtn = document.getElementById('show-modal-btn'); const modalCloseBtn = document.getElementById('modal-close-btn');
const simulateImpactBtn = document.getElementById('simulate-impact-btn'); const returnGlobeBtn = document.getElementById('return-globe-btn');
const mitigationSelect = document.getElementById('mitigation-select');
const mitigationSlider = document.getElementById('mitigation-slider');
const mitigationSliderLabel = document.getElementById('mitigation-slider-label');
const mitigationValue = document.getElementById('mitigation-value');
const mitigationDescription = document.getElementById('mitigation-description');


let simulationParams = { diameterKm: 0.37, velocityKmS: 25.0, densityKgM3: DEFAULT_ROCKY_DENSITY, angleDegrees: 90, };
let requiredMitigation = 60; let allAsteroids = []; let impactLocation = POTENTIAL_TARGETS[0]; let impactRadii = { blast: 0, thermal: 0, seismic: 0 };


const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000); camera.position.set(0, 1.8, 4); const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(window.devicePixelRatio || 1); renderer.setSize(window.innerWidth, window.innerHeight); document.getElementById('canvas-container').appendChild(renderer.domElement); const ambient = new THREE.AmbientLight(0x888888); scene.add(ambient); const dir = new THREE.DirectionalLight(0xffffff, 1.0); dir.position.set(5, 3, 5); scene.add(dir); const controls = new THREE.OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false; controls.minDistance = 1.6; controls.maxDistance = 8; const textureLoader = new THREE.TextureLoader(); textureLoader.setCrossOrigin(''); const earthMap = textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthmap1k.jpg'); const earthBump = textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthbump1k.jpg'); const earthSpec = textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/earthspec1k.jpg'); const earthMat = new THREE.MeshPhongMaterial({ map: earthMap, bumpMap: earthBump, bumpScale: 0.01, specularMap: earthSpec, specular: new THREE.Color('grey') }); const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), earthMat); scene.add(earth); const atmosphereMat = new THREE.ShaderMaterial({ vertexShader: `varying vec3 vNormal; void main(){ vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`, fragmentShader: `varying vec3 vNormal; void main(){ float intensity = pow(max(0.0, 0.6 - dot(vNormal, vec3(0,0,1.0))), 2.0); gl_FragColor = vec4(0.3,0.6,1.0,1.0) * intensity; }`, blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true }); const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.04, 64, 64), atmosphereMat); scene.add(atmosphere); const asteroidGroup = new THREE.Group(); scene.add(asteroidGroup); const asteroidRadius = 0.08; const asteroidGeom = new THREE.IcosahedronGeometry(asteroidRadius, 3); const posAttr = asteroidGeom.getAttribute('position'); for (let i = 0; i < posAttr.count; i++) { const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)); v.multiplyScalar(1 + (Math.random() - 0.5) * 0.25); posAttr.setXYZ(i, v.x, v.y, v.z); } asteroidGeom.computeVertexNormals(); const asteroidMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9, metalness: 0.1 }); const asteroidMesh = new THREE.Mesh(asteroidGeom, asteroidMat); asteroidGroup.add(asteroidMesh); textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_vesta_fictional.jpg', (tex) => { asteroidMat.map = tex; asteroidMat.needsUpdate = true; }); const orbitRx = 3.0, orbitRz = 2.2; const ellipse = new THREE.EllipseCurve(0, 0, orbitRx, orbitRz, 0, 2 * Math.PI, false, 0); const ellipsePoints3D = ellipse.getPoints(240).map(p => new THREE.Vector3(p.x, 0, p.y)); const orbitGeom = new THREE.BufferGeometry().setFromPoints(ellipsePoints3D); const orbitMat = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.6 }); const orbitLine = new THREE.Line(orbitGeom, orbitMat); scene.add(orbitLine); const threatLineMat = new THREE.LineBasicMaterial({ color: 0xff0000 }); const threatLineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const threatLine = new THREE.Line(threatLineGeom, threatLineMat); scene.add(threatLine); const starVerts = []; for (let i = 0; i < 4000; i++) { const x = (Math.random() - 0.5) * 2000; const y = (Math.random() - 0.5) * 2000; const z = (Math.random() - 0.5) * 2000; if (x*x+y*y+z*z > 10000) starVerts.push(x, y, z); } const starGeom = new THREE.BufferGeometry(); starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3)); const starMat = new THREE.PointsMaterial({ size: 0.08, color: 0xffffff }); const stars = new THREE.Points(starGeom, starMat); scene.add(stars); camera.lookAt(new THREE.Vector3(0, 0, 0));


let map = null; let impactCirclesLayer = null; function initMap() { if (map) { map.setView(impactLocation.coords, 9); updateImpactCircles(); return; } map = L.map('map-container', { zoomControl: true }).setView(impactLocation.coords, 9); L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map); updateImpactCircles(); }
function updateImpactCircles(eventInfo) { if (!map) return; if (impactCirclesLayer) map.removeLayer(impactCirclesLayer); const { blast, thermal, seismic } = impactRadii; const circles = [ L.circle(impactLocation.coords, { radius: seismic, color: '#f59e0b', weight: 1, fillOpacity: 0.12 }), L.circle(impactLocation.coords, { radius: thermal, color: '#f97316', weight: 1, fillOpacity: 0.14 }), L.circle(impactLocation.coords, { radius: blast, color: '#ef4444', weight: 1, fillOpacity: 0.24 }) ]; const marker = L.marker(impactLocation.coords).bindPopup('<b>Ground Zero</b>').openPopup(); impactCirclesLayer = L.layerGroup([...circles, marker]).addTo(map); impactLocationTextEl.innerHTML = `${impactLocation.name}`; if (eventInfo) { eventTitleEl.textContent = eventInfo.title; eventTitleEl.style.color = eventInfo.color; impactDetailsEl.innerHTML = `<div><strong>Blast Radius:</strong> ${(blast/1000).toFixed(2)} km</div><div><strong>Thermal Effects:</strong> ${(thermal/1000).toFixed(2)} km</div><div><strong>Seismic Shock:</strong> ${(seismic/1000).toFixed(2)} km</div><div class="mt-4 pt-4 border-t border-gray-600"><p class="mb-1"><strong>- Blast Zone:</strong> ${eventInfo.blast_desc}</p><p class="mb-1"><strong>- Thermal Zone:</strong> ${eventInfo.thermal_desc}</p><p><strong>- Seismic Zone:</strong> Equivalent to a moderate earthquake, causing localized structural damage.</p></div>`; } }
function getImpactConsequences(megatons) { if (megatons > 10000) return { title: 'Extinction-Level Event', color: '#ef4444', blast_desc: 'Complete vaporization of impact site, continent-spanning shockwave.', thermal_desc: 'Global firestorms, significant atmospheric heating.' }; if (megatons > 100) return { title: 'Global Devastation', color: '#f97316', blast_desc: 'City-level destruction, widespread obliteration of structures.', thermal_desc: 'Massive fires, 3rd-degree burns over thousands of square kilometers.' }; if (megatons > 1) return { title: 'Regional Catastrophe', color: '#f59e0b', blast_desc: 'Widespread destruction of buildings and infrastructure.', thermal_desc: 'Severe burns to exposed life, spontaneous ignition of fires.' }; return { title: 'Local Impact Event', color: '#eab308', blast_desc: 'Significant damage to buildings, comparable to a large explosion.', thermal_desc: 'Risk of localized fires and burns in close proximity.' }; }
function estimateImpactRadii(diameterKm, velocityKmS, densityKgM3, angleDegrees) { const d_m = Math.max(0.0001, diameterKm) * 1000; const volume = (4 / 3) * Math.PI * Math.pow(d_m / 2, 3); const massKg = densityKgM3 * volume; const velocityMs = velocityKmS * 1000; const kineticJ = 0.5 * massKg * velocityMs * velocityMs; const tntMegatons = kineticJ / 4.184e15; const angleRadians = angleDegrees * (Math.PI / 180); const efficiency = Math.sin(angleRadians); let blast = Math.cbrt(tntMegatons * efficiency) * 3000; blast = Math.max(blast, 50); return { blast, thermal: blast * 2.4, seismic: blast * 5, kineticJ, tntMegatons }; }


async function fetchAsteroidList() { const listApiUrl = `https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${NASA_API_KEY}`; try { const res = await fetch(listApiUrl); if (!res.ok) throw new Error('Failed to fetch list'); const data = await res.json(); allAsteroids = data.near_earth_objects; updateAsteroidDropdown('all'); } catch (err) { asteroidSelectEl.innerHTML = '<option>Could not load NASA data</option>'; } }
function updateAsteroidDropdown(filter) { asteroidSelectEl.innerHTML = ''; const caseStudyGroup = document.createElement('optgroup'); caseStudyGroup.label = 'Case Studies'; CASE_STUDIES.forEach(study => { const option = document.createElement('option'); option.value = study.id; option.textContent = study.name; caseStudyGroup.appendChild(option); }); asteroidSelectEl.appendChild(caseStudyGroup); const realThreatsGroup = document.createElement('optgroup'); realThreatsGroup.label = 'Real Threats (from NASA)'; const filteredList = allAsteroids.filter(neo => { const maxDiameter = neo.estimated_diameter.kilometers.estimated_diameter_max; if (filter === 'small') return maxDiameter < 0.1; if (filter === 'medium') return maxDiameter >= 0.1 && maxDiameter < 1.0; if (filter === 'large') return maxDiameter >= 1.0; return true; }); if (filteredList.length > 0) { filteredList.forEach(neo => { const option = document.createElement('option'); option.value = neo.neo_reference_id; option.textContent = `${neo.name} (~${(neo.estimated_diameter.kilometers.estimated_diameter_max * 1000).toFixed(0)}m)`; realThreatsGroup.appendChild(option); }); asteroidSelectEl.appendChild(realThreatsGroup); } }
async function fetchAsteroidData(neoId) { const apiUrl = `https://api.nasa.gov/neo/rest/v1/neo/${neoId}?api_key=${NASA_API_KEY}`; try { const res = await fetch(apiUrl); if (!res.ok) throw new Error(`Request failed`); const data = await res.json(); applyAsteroidData(data); } catch (err) { applyAsteroidData(CASE_STUDIES.find(c => c.id === 'custom_generic')); } }

function setSlidersLocked(isLocked) {
    document.querySelectorAll('.lockable-slider').forEach(slider => {
        slider.disabled = isLocked;
    });
    
    diameterSliderContainer.style.display = isLocked ? 'none' : 'block';
}

function applyAsteroidData(data) {
    asteroidNameEl.textContent = data.name || 'Unknown';
    if (data.isCustom) {
        
        setSlidersLocked(false);
        simulationParams.diameterKm = data.diameter;
        diameterSlider.value = data.diameter;
        diameterValueEl.textContent = data.diameter < 1 ? `${(data.diameter * 1000).toFixed(0)} m` : `${data.diameter.toFixed(2)} km`;
    } else {
       
        setSlidersLocked(true);
        let dmin = data.estimated_diameter?.kilometers?.estimated_diameter_min || 0.34;
        let dmax = data.estimated_diameter?.kilometers?.estimated_diameter_max || 0.38;
        simulationParams.diameterKm = (dmin + dmax) / 2;
        asteroidNameEl.textContent = `${data.name} (~${(simulationParams.diameterKm * 1000).toFixed(0)}m)`;
        simulationParams.densityKgM3 = DEFAULT_ROCKY_DENSITY;
        densitySlider.value = DEFAULT_ROCKY_DENSITY;
        densityValueEl.textContent = `Rocky (${DEFAULT_ROCKY_DENSITY} kg/m³)`
    }
    updateImpactSimulation();
}

function updateImpactSimulation() {
    const { diameterKm, velocityKmS, densityKgM3, angleDegrees } = simulationParams;
    const { blast, thermal, seismic, kineticJ, tntMegatons } = estimateImpactRadii(diameterKm, velocityKmS, densityKgM3, angleDegrees);
    impactRadii = { blast, thermal, seismic };
    requiredMitigation = 35 + Math.log10(Math.max(1, kineticJ)) * 2;
    requiredMitigation = Math.min(95, Math.max(40, requiredMitigation));
    const eventInfo = getImpactConsequences(tntMegatons);
    energyDetailsEl.innerHTML = `<div><strong>Energy:</strong> ${(kineticJ / 1e15).toFixed(2)} PJ</div> <div><strong>TNT eq.:</strong> ${tntMegatons.toFixed(2)} Megatons</div>`;
    if(map) updateImpactCircles(eventInfo);
    updateMitigationUI();
}

function updateMitigationUI() {
    const strategyKey = mitigationSelect.value;
    const config = mitigationConfig[strategyKey];
    mitigationSliderLabel.textContent = config.label;
    const requiredEffort = Math.min(100, Math.max(0, requiredMitigation / config.efficiency));
    mitigationDescription.textContent = `Requires > ${requiredEffort.toFixed(0)}% effort for this method.`;
    updateMitigationStatus();
}

function updateMitigationStatus() {
    const v = parseInt(mitigationSlider.value);
    const strategyKey = mitigationSelect.value;
    const config = mitigationConfig[strategyKey];
    const appliedForce = v * config.efficiency;
    mitigationValue.textContent = `${v}%`;
    asteroidGroup.position.y = (appliedForce / 100) * 0.8;
    const isSafe = appliedForce > requiredMitigation;
    const lerpFactor = Math.min(1, appliedForce / requiredMitigation);
    const c = new THREE.Color().lerpColors(new THREE.Color(0xff0000), new THREE.Color(0x00ff00), lerpFactor);
    orbitMat.color = c;
    threatLine.visible = !isSafe;
    statusTextEl.textContent = isSafe ? 'Threat Neutralized' : 'On Collision Course';
    statusTextEl.className = isSafe ? 'hud-value status-safe' : 'hud-value status-danger'; 
}


filterContainer.addEventListener('click', e => { if (e.target.tagName === 'BUTTON') { filterContainer.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); updateAsteroidDropdown(e.target.dataset.filter); } });
randomizeImpactBtn.addEventListener('click', () => { const currentIndex = POTENTIAL_TARGETS.findIndex(t => t.name === impactLocation.name); let nextIndex = currentIndex; while (nextIndex === currentIndex) { nextIndex = Math.floor(Math.random() * POTENTIAL_TARGETS.length); } impactLocation = POTENTIAL_TARGETS[nextIndex]; targetLocationNameEl.textContent = impactLocation.name; if (map) { map.setView(impactLocation.coords, 9); updateImpactCircles(getImpactConsequences(estimateImpactRadii(...Object.values(simulationParams)).tntMegatons)); } });
asteroidSelectEl.addEventListener('change', (e) => { const selectedId = e.target.value; const study = CASE_STUDIES.find(s => s.id === selectedId); if (study) { applyAsteroidData(study); } else { fetchAsteroidData(selectedId); } });
diameterSlider.addEventListener('input', e => { const d = parseFloat(e.target.value); simulationParams.diameterKm = d; diameterValueEl.textContent = d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(2)} km`; updateImpactSimulation(); });
velocitySlider.addEventListener('input', (e) => { const v = parseFloat(e.target.value); simulationParams.velocityKmS = v; velocityValueEl.textContent = `${v.toFixed(1)} km/s`; updateImpactSimulation(); });
densitySlider.addEventListener('input', (e) => { const d = parseInt(e.target.value); simulationParams.densityKgM3 = d; let type = 'Rocky'; if (d < 2000) type = 'Icy'; else if (d > 4500) type = 'Metallic'; densityValueEl.textContent = `${type} (${d} kg/m³)`; updateImpactSimulation(); });
angleSlider.addEventListener('input', (e) => { const angle = parseInt(e.target.value); simulationParams.angleDegrees = angle; let label = `${angle}°`; if (angle >= 85) label += ' (Direct)'; else if (angle <= 30) label += ' (Shallow)'; angleValueEl.textContent = label; updateImpactSimulation(); });
mitigationSelect.addEventListener('change', updateMitigationUI);
mitigationSlider.addEventListener('input', updateMitigationStatus);
simulateImpactBtn.addEventListener('click', () => { document.getElementById('canvas-container').style.opacity = '0'; document.getElementById('canvas-container').style.pointerEvents = 'none'; document.getElementById('map-container').style.opacity = '1'; document.getElementById('map-container').style.zIndex = '2'; document.getElementById('map-container').style.pointerEvents = 'auto'; simulateImpactBtn.classList.add('hidden'); returnGlobeBtn.classList.remove('hidden'); document.getElementById('mitigation-controls').classList.add('hidden'); document.getElementById('target-panel').classList.add('hidden'); document.getElementById('impact-panel').classList.remove('hidden'); initMap(); setTimeout(() => { if (map) { map.invalidateSize(); updateImpactSimulation(); } }, 60); });
returnGlobeBtn.addEventListener('click', () => { document.getElementById('map-container').style.opacity = '0'; document.getElementById('map-container').style.pointerEvents = 'none'; document.getElementById('map-container').style.zIndex = '0'; document.getElementById('canvas-container').style.opacity = '1'; document.getElementById('canvas-container').style.pointerEvents = 'auto'; returnGlobeBtn.classList.add('hidden'); simulateImpactBtn.classList.remove('hidden'); document.getElementById('mitigation-controls').classList.remove('hidden'); document.getElementById('impact-panel').classList.add('hidden'); document.getElementById('target-panel').classList.remove('hidden'); });
showModalBtn.addEventListener('click', (e) => { e.preventDefault(); modalContainer.classList.add('visible'); });
modalCloseBtn.addEventListener('click', () => modalContainer.classList.remove('visible'));
modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) modalContainer.classList.remove('visible'); });


let orbitAngle = 0; function animate() { requestAnimationFrame(animate); orbitAngle += 0.003; const x = orbitRx * Math.cos(orbitAngle); const z = orbitRz * Math.sin(orbitAngle); asteroidMesh.position.set(x, 0, z); asteroidMesh.rotation.y += 0.01; asteroidMesh.rotation.x += 0.005; const asteroidWorldPos = new THREE.Vector3(); asteroidMesh.getWorldPosition(asteroidWorldPos); threatLine.geometry.setFromPoints([asteroidWorldPos, new THREE.Vector3(0, 0, 0)]); if (!controls.isRotating && !controls.userPan) earth.rotation.y += 0.0009; controls.update(); renderer.render(scene, camera); }
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });


(async () => {
    await fetchAsteroidList();

    const customOption = Array.from(asteroidSelectEl.options).find(opt => opt.value === 'custom_generic');
    if (customOption) {
        customOption.selected = true;
    } else if (asteroidSelectEl.options.length > 0) {
        
        asteroidSelectEl.selectedIndex = 0;
    }
    
    asteroidSelectEl.dispatchEvent(new Event('change'));
    animate();
})();