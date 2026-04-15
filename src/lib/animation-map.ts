export interface AnimationEntry {
  name: string;
  label: string;
  description: string;
}

export const AVAILABLE_ANIMATIONS: AnimationEntry[] = [
  {
    name: "idle",
    label: "Idle",
    description: "Standing still in a relaxed neutral pose",
  },
  {
    name: "walking",
    label: "Walking",
    description: "Walking forward at a normal pace",
  },
  {
    name: "walk_to",
    label: "Walk To",
    description: "Walking toward a specific target object in the scene",
  },
  {
    name: "waving",
    label: "Waving",
    description: "Waving hello with one hand raised — a friendly greeting gesture",
  },
  {
    name: "pointing",
    label: "Pointing",
    description: "Pointing at a specific object with an extended arm",
  },
  {
    name: "looking",
    label: "Looking Around",
    description: "Looking around by turning the head left and right to survey the scene",
  },
  {
    name: "safety_posture",
    label: "Safety Posture",
    description:
      "Demonstrating correct upright safety standing posture — feet shoulder-width apart, spine straight, arms at sides",
  },
  {
    name: "turn_around",
    label: "Turn Around",
    description:
      "Turn around 180 degrees to face the opposite direction, or face forward toward the camera",
  },
];

export const ANIMATION_NAMES = AVAILABLE_ANIMATIONS.map((a) => a.name);

export interface SceneObject {
  name: string;
  label: string;
  position: [number, number, number];
  standoff: number;
}

export const SCENE_OBJECTS: SceneObject[] = [
  { name: "table", label: "Table", position: [1.8, 0, -1], standoff: 0.9 },
  { name: "fire_extinguisher", label: "Fire Extinguisher", position: [-2.5, 0, -1.5], standoff: 0.6 },
  { name: "safety_sign", label: "Safety Sign", position: [1.5, 0, -2.9], standoff: 0.7 },
  { name: "cone_right", label: "Safety Cone (right)", position: [2.5, 0, 1], standoff: 0.5 },
  { name: "cone_left", label: "Safety Cone (left)", position: [-1.5, 0, 1.5], standoff: 0.5 },
];

export const SCENE_OBJECT_NAMES = SCENE_OBJECTS.map((o) => o.name);
