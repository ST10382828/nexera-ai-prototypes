# Technical Explanation — NexEra AI Prototypes

## What I Built

Two interactive AI-powered prototypes for NexEra's human training platform:

1. **AI-Generated 3D Asset Pipeline** — A system that takes text descriptions or images and produces interactive 3D models with educational context, ready for training modules. Supports both text-to-3D and image-to-3D with Gemini Vision for contextual summaries.

2. **Natural Language Avatar Animation** — A command-driven 3D avatar that interprets plain English instructions and performs spatially-aware animations (walking to objects, pointing at targets, turning around), with AI-generated explanations for each action.

Both prototypes are deployed as a single Next.js web application with no installations required.

## Why I Chose This Approach

### Next.js + React Three Fiber

I chose Next.js as the foundation because it provides both the frontend framework (React) and the backend API layer (API Routes) in a single deployment. This means:

- **No separate backend server** — API keys stay secure in server-side routes while the frontend remains a standard React SPA
- **Vercel deployment** — One-click deploy with zero configuration
- **React Three Fiber** — Brings Three.js into React's declarative paradigm, making 3D scenes composable and maintainable
- **CORS-free model delivery** — API routes proxy external GLB models, eliminating cross-origin issues entirely

### Tripo3D for 3D Generation

For the text/image-to-3D pipeline, I selected Tripo3D because:

- It produces GLB models directly (the standard web 3D format)
- Supports both text-to-3D and image-to-3D in a single API
- Generates clean, game-ready topology suitable for web rendering
- Free tier available for development and demos
- Straightforward API: create a task, poll for completion, retrieve the model URL

### Google Gemini for AI (Multi-Model Fallback)

Gemini handles three distinct AI tasks with a resilient multi-model fallback system (tries gemini-2.5-flash-lite → gemini-2.5-flash → gemini-2.0-flash-lite → gemini-2.0-flash):

1. **Educational Summaries** (Test 1, text): Given an object description, generates workplace-training-relevant context about the object, its use, and safety considerations.

2. **Visual Summaries** (Test 1, image): Uses Gemini Vision to analyze uploaded images and generate accurate, contextual summaries based on what the AI actually sees in the image.

3. **Command Parsing** (Test 2): Interprets natural language commands against a known set of scene objects (with 3D positions) and animations. Returns structured JSON with the animation name, target object, target position, standoff distance, confidence score, and educational explanation.

### Procedural Avatar with Spatial Intelligence

Rather than requiring external animation assets, I built a procedural avatar system that demonstrates deeper engineering:

- The character is constructed from Three.js primitives (capsules, spheres) arranged in a humanoid skeleton hierarchy with realistic proportions
- Each joint is a React ref that can be animated independently
- Animations are defined as pure functions that take joint references and a time parameter
- Transitions use snapshot-and-blend interpolation for smooth crossfades
- **Spatial awareness**: The avatar physically navigates to objects in the scene, stopping at appropriate standoff distances rather than walking through them
- **Target-aware actions**: Pointing and looking are directionally accurate — the avatar rotates to face the target object before performing the action
- **Camera follow**: The camera smoothly tracks the avatar as it moves through the environment

## Architecture and AI Logic

### Test 1 — 3D Asset Pipeline

```
User Input (text or image)
    │
    ├── Text → POST /api/generate-3d → Tripo3D text-to-3D
    │
    ├── Image → POST /api/generate-3d-from-image → Upload to Tripo → image-to-3D
    │
    ▼
Client polls GET endpoint every 3 seconds
    │
    ├── Returns task status + progress percentage
    │
    ▼ (on SUCCEEDED)
GLB URL proxied through /api/proxy-model (avoids CORS)
    │
    ▼
React Three Fiber viewer auto-scales, centers, and renders the model
    │
    ▼
Gemini generates educational summary (uses Vision for images)
```

Key design decisions:
- **Polling over WebSockets**: Simpler, works with serverless, and generation takes 30-90 seconds anyway
- **Auto-scaling**: Every model is normalized to a consistent size and centered on the ground plane
- **Proxy architecture**: GLB models are fetched server-side and streamed to the browser, eliminating all CORS issues
- **Error boundaries**: If a model fails to load, a React Error Boundary catches it gracefully instead of crashing the viewer
- **Demo models**: Built-in sample models ensure the viewer is always demonstrable, even without API credits

### Test 2 — Avatar Animation

```
User types command (e.g., "Walk to the table")
    │
    ▼
POST /api/parse-command → Gemini with scene context
    │
    ├── Prompt includes: available animations, scene objects with 3D positions
    ├── Output: { animation, target, targetPosition, standoff, explanation, confidence }
    │
    ▼
ProceduralAvatar.executeCommand()
    │
    ├── walk_to: Calculates destination (target position minus standoff), rotates to face, walks there
    ├── pointing: Rotates to face target, extends arm forward
    ├── looking: Turns head toward target object
    ├── turn_around: Rotates 180° to face opposite direction
    ├── waving/safety_posture: Plays in-place animation
    │
    ▼
Camera smoothly follows avatar to new position
    │
    ▼
AI explanation displayed in UI
```

The animation state machine:
- Maintains world-space position and rotation for the avatar
- On walk_to: calculates a path to the target minus the standoff distance, smoothly rotates, then moves at a constant speed
- On transition: snapshots all joint transforms, switches to new animation, blends over ~0.3s
- Each animation function receives elapsed time and delta, enabling both cyclic (walking) and pose-based (pointing) animations

## Challenges and Solutions

### Challenge 1: CORS with External 3D Models

Tripo3D's CDN does not include CORS headers, so the browser blocks direct GLB fetches. I solved this by creating a `/api/proxy-model` endpoint that fetches the GLB server-side and streams it to the browser with proper headers. This keeps the architecture clean and works on any hosting platform.

### Challenge 2: Animation Blending Without a Skeleton

Standard 3D animation uses skeletal rigs with `AnimationMixer`. Without pre-made animation files, I needed an alternative. My solution captures the full joint state as a snapshot before switching animations, then linearly interpolates between the old pose and the new animation's output over a configurable duration. This produces visually smooth transitions.

### Challenge 3: Spatial Navigation

Moving an avatar to a specific object is more than "play walk animation" — it requires calculating a destination point, rotating to face the direction of travel, moving at a consistent speed, stopping at an appropriate distance, and then facing the target. I implemented this with world-space position/rotation tracking, vector math for direction and distance, and per-object standoff distances to prevent the avatar from walking through objects.

### Challenge 4: Gemini API Resilience

During development, I encountered rate limits and model deprecations. I built a multi-model fallback system that tries four different Gemini models in sequence, automatically recovering from 429 (rate limit), 404 (deprecated model), and quota exhaustion errors. This makes the application resilient to API changes.

### Challenge 5: Consistent 3D Model Display

Generated models come in vastly different scales and orientations. The viewer computes the bounding box of every loaded model, normalizes it to a target size, and positions it so its bottom rests on the ground plane. Combined with automatic camera reset, every model appears consistently regardless of its source dimensions.

## How I Would Scale This Inside NexEra's Platform

### Short Term (1-3 months)
- Replace procedural avatar with production ReadyPlayerMe/Mixamo characters
- Expand animation library to 50+ actions via Mixamo API integration
- Add persistent storage (Supabase/Firebase) for generated 3D asset libraries
- Implement user authentication and per-organization content libraries

### Medium Term (3-6 months)
- Build a scenario editor where educators compose multi-step training sequences
- Add speech-to-text for voice-controlled avatars
- Implement multi-avatar scenes for team training simulations
- Create an assessment engine that tracks learner interactions and scores competency

### Long Term (6-12 months)
- Fine-tune custom models for domain-specific command understanding
- Integrate with LMS platforms (SCORM/xAPI compliance)
- Deploy avatar system as a reusable SDK for third-party training platforms
- Add real-time multiplayer for collaborative training exercises
