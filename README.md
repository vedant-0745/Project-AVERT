Project AVERT: Asteroid Visualization & Emergency Response Tool

Submission for the NASA Space Apps Challenge 2025 - Jabalpur Edition.

1. The Problem

A newly identified near-Earth asteroid poses a potential threat. Decision-makers and the public lack intuitive tools to understand the risks, model impact scenarios, and evaluate mitigation strategies. Our project addresses this by integrating real NASA data into an interactive visualization tool.

2. Our Solution: AVERT

AVERT is an interactive, browser-based tool that provides a dual-perspective simulation of an asteroid threat. It allows users to:
- Visualize the threat in a 3D orbital view.
- Select real potential threats from a live-updated list via the NASA NeoWs API.
- Simulate the ground-level consequences with a 2D map view, calculating blast, thermal, and seismic radii based on physics.
- Evaluate multiple mitigation strategies and see their potential effectiveness in real-time.

3. Core Features Implemented

a) Live NASA Data: Fetches a list of Near-Earth Objects from the NASA NeoWs API.
b) Dynamic Physics Engine: Calculates impact energy (in Joules and Megatons of TNT) and effect radii based on user-adjustable parameters like velocity, density, and impact angle.
c) Dual-View Interface: Combines a Three.js 3D globe for orbital mechanics with a Leaflet.js 2D map for ground-truth impact assessment.
d) Mitigation Simulator: Allows users to apply different mitigation techniques (Kinetic Nudge, Gravity Tractor, etc.) and dynamically calculates the required effort to neutralize the threat.

4. How to Run the Prototype

1.  Download the repository files (`index.html`, `style.css`, `script.js`).
2.  Because the project uses ES Modules (`script type="module"`), it needs to be run from a local web server to avoid CORS errors.
3.  The easiest way is to use the "Live Server" extension in VS Code.
4.  Alternatively, you can run a simple server with Python: `python -m http.server`
5.  Open your browser and navigate to the provided local address.