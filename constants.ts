import { DroneDefinition } from './types';

export const DEFAULT_PLAYBACK_ID_1 = 'kP5C71e800M2H35Hn7l77457Xy44600102Ld0234'; 
export const DEFAULT_RTMP_KEY_1 = '8e2849be-3829-8a6b-2bc4-bce86a83bf62';

export const DEFAULT_PLAYBACK_ID_2 = 'kP5C71e800M2H35Hn7l77457Xy44600102Ld0235'; 
export const DEFAULT_RTMP_KEY_2 = '8e2849be-3829-8a6b-2bc4-bce86a83bf63';

export const RTMP_BASE_URL = 'rtmp://global-live.mux.com:5222/app/';

export const CONFIGURABLE_DRONES: DroneDefinition[] = [
  { id: 1, name: 'Drone Alpha (Principal)', configKey: 'drone1' },
  { id: 2, name: 'Drone Bravo (Secundário)', configKey: 'drone2' },
];

export const ADDITIONAL_DRONES: DroneDefinition[] = [
  { id: 3, name: 'Drone Charlie (Monitoramento)' },
  { id: 4, name: 'Drone Delta (Reserva)' },
];
// =================================================================
// Constantes para Detecção de Objetos (YOLOv8)
// =================================================================

// Arquivo de classes COCO (80 classes)
export const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
  'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
  'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
  'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
  'toothbrush',
];

// Constantes para o modelo YOLOv8
export const YOLO_MODEL_PATH = '/yolov8n.onnx';
export const YOLO_INPUT_SIZE = 640;
export const YOLO_CONF_THRESHOLD = 0.25;
export const YOLO_IOU_THRESHOLD = 0.45;
