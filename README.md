# NexEra AI Prototypes

Two AI-powered interactive prototypes built for the NexEra AI Engineering Challenge, demonstrating how AI can transform 3D content creation and avatar-based training for human education.

**Live Demo**: [Add deployed URL here]

## Prototypes

### Test 1: AI-Generated 3D Asset Pipeline

Turns text descriptions or uploaded images into interactive 3D models for training content.

- **Text-to-3D**: Type a description (e.g., "a yellow hard hat") and AI generates a 3D model via Tripo3D
- **Image-to-3D**: Upload a photo of any object to generate its 3D equivalent
- **Educational Summary**: Gemini AI generates contextual learning information about each object (uses vision for image uploads)
- **Interactive Viewer**: Rotate, zoom, and pan the 3D model using React Three Fiber
- **Auto Processing**: Models are auto-scaled, centered, and placed on a ground plane
- **Download**: Export generated models as GLB files

### Test 2: Natural Language Avatar Animation

Control a 3D avatar using plain English commands — foundational for AI training coaches and scenario-based simulations.

- **AI Command Parsing**: Gemini interprets natural language and maps to animations with spatial awareness
- **Spatial Navigation**: Avatar physically walks TO objects, stops before them, and faces them
- **Target-Aware Pointing**: "Point at the fire extinguisher" — avatar faces and points at the actual object
- **8 Animation Types**: Idle, walking, walk-to, waving, pointing, looking around, safety posture, turn around
- **Scene Objects**: Table, fire extinguisher, safety sign, safety cones — all interactive targets
- **Camera Follow**: Camera smoothly tracks the avatar as it moves around the scene
- **Smooth Transitions**: Animations blend seamlessly between states using eased interpolation
- **AI Explanations**: Each action includes an educational explanation for training context

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| 3D Rendering | Three.js via React Three Fiber + Drei |
| Styling | Tailwind CSS v4 |
| AI (Text/Reasoning/Vision) | Google Gemini (multi-model fallback) |
| AI (3D Generation) | Tripo3D API |
| Hosting | Vercel |

## Architecture

```
nexera-ai-prototypes/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout with nav
│   │   ├── test1/page.tsx              # 3D Asset Pipeline UI
│   │   ├── test2/page.tsx              # Avatar Animation UI
│   │   └── api/
│   │       ├── generate-3d/            # Tripo text-to-3D proxy
│   │       ├── generate-3d-from-image/ # Tripo image-to-3D proxy
│   │       ├── proxy-model/            # CORS proxy for GLB delivery
│   │       ├── educational-summary/    # Gemini educational content (text + vision)
│   │       └── parse-command/          # Gemini NLP command parser with spatial awareness
│   ├── components/
│   │   ├── ModelViewer.tsx             # R3F 3D model viewer with error boundary
│   │   ├── AvatarScene.tsx             # R3F avatar scene with camera follow
│   │   ├── ProceduralAvatar.tsx        # Procedural animated avatar with spatial movement
│   │   └── SceneEnvironment.tsx        # Training room with interactive objects
│   └── lib/
│       ├── gemini.ts                   # Gemini multi-model fallback (text + vision)
│       └── animation-map.ts            # Animation definitions + scene object positions
├── .env.local                          # API keys (not committed)
└── TECHNICAL_DOC.md                    # Detailed technical explanation
```

## Setup Instructions

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- API keys for Google Gemini and Tripo3D

### 1. Clone the Repository

```bash
git clone https://github.com/st10382828/nexera-ai-prototypes.git
cd nexera-ai-prototypes
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure API Keys

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_google_gemini_api_key
TRIPO_API_KEY=your_tripo_api_key
```

**Getting API Keys:**

- **Google Gemini**: Visit [Google AI Studio](https://aistudio.google.com/apikey) to create a free API key
- **Tripo3D**: Sign up at [platform.tripo3d.ai](https://platform.tripo3d.ai) and generate an API key (free tier available)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate-3d` | POST | Create a text-to-3D generation task |
| `/api/generate-3d` | GET | Poll task status by `taskId` |
| `/api/generate-3d-from-image` | POST | Create an image-to-3D generation task |
| `/api/generate-3d-from-image` | GET | Poll task status by `taskId` |
| `/api/proxy-model` | GET | Proxy external GLB models to bypass CORS |
| `/api/educational-summary` | POST | Generate educational summary (supports image vision) |
| `/api/parse-command` | POST | Parse NL command into animation + target + explanation |

## Limitations and Next Steps

### Current Limitations

- **3D Generation Time**: Tripo3D takes 30-90 seconds per model; not instant
- **Avatar**: Uses procedural geometry rather than a high-fidelity rigged character (demonstrates engineering depth)
- **Animation Set**: 8 procedural animations; a production system would use Mixamo/motion capture for more variety
- **No Persistence**: Generated models and history are not saved between sessions

### Next Steps for NexEra Integration

- **Mixamo/ReadyPlayerMe Integration**: High-fidelity characters with production-quality animations
- **Animation Library**: Expand to 50+ animations via Mixamo/DeepMotion API
- **LMS Integration**: Connect to NexEra's learning management system for curriculum-aware content
- **Multi-user Sessions**: Real-time collaborative training scenarios
- **Voice Commands**: Add speech-to-text for hands-free avatar control
- **Persistent Storage**: Save generated 3D assets to a content library
- **Assessment Mode**: Track learner interactions with the avatar for competency evaluation

## License

Built for the NexEra AI Engineering Challenge.
