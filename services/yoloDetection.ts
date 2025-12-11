import * as ort from 'onnxruntime-web';
import { COCO_CLASSES, YOLO_MODEL_PATH, YOLO_CONF_THRESHOLD, YOLO_IOU_THRESHOLD, YOLO_INPUT_SIZE } from '../constants';

// Define a estrutura para o resultado da detecção
export interface Detection {
  box: [number, number, number, number]; // [x1, y1, x2, y2]
  score: number;
  classId: number;
  label: string;
}

let session: ort.InferenceSession | null = null;

/**
 * Carrega o modelo ONNX e cria a sessão de inferência.
 */
export async function loadYoloModel(): Promise<ort.InferenceSession> {
  if (session) return session;

  // Configura o backend WebGL para melhor performance
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;
  ort.env.wasm.proxy = true;
  ort.env.wasm.wasmPaths = '/'; // Assume que os arquivos .wasm estão na raiz do public

  try {
    session = await ort.InferenceSession.create(YOLO_MODEL_PATH, {
      executionProviders: ['webgl', 'wasm'],
    });
    console.log('YOLOv8 model loaded successfully.');
    return session;
  } catch (e) {
    console.error('Failed to load YOLOv8 model:', e);
    throw new Error('Failed to load YOLOv8 model.');
  }
}

/**
 * Pré-processa o frame do vídeo para o formato de entrada do YOLOv8 (640x640, normalizado).
 * @param videoElement O elemento de vídeo ou canvas para extrair o frame.
 * @returns Um tensor Float32Array no formato [1, 3, 640, 640].
 */
export function preprocess(videoElement: HTMLVideoElement | HTMLCanvasElement): ort.Tensor {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = YOLO_INPUT_SIZE;
  canvas.height = YOLO_INPUT_SIZE;

  // Desenha o frame do vídeo no canvas redimensionado
  ctx.drawImage(videoElement, 0, 0, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE);

  const imageData = ctx.getImageData(0, 0, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE).data;
  const input = new Float32Array(1 * 3 * YOLO_INPUT_SIZE * YOLO_INPUT_SIZE);

  // Converte de RGBA para RGB e normaliza (0-255 -> 0-1) e formata para [C, H, W]
  for (let i = 0; i < YOLO_INPUT_SIZE * YOLO_INPUT_SIZE; i++) {
    const dataIndex = i * 4;
    const r = imageData[dataIndex] / 255.0;
    const g = imageData[dataIndex + 1] / 255.0;
    const b = imageData[dataIndex + 2] / 255.0;

    // Coloca em [C, H, W]
    input[i] = r; // R
    input[i + YOLO_INPUT_SIZE * YOLO_INPUT_SIZE] = g; // G
    input[i + 2 * YOLO_INPUT_SIZE * YOLO_INPUT_SIZE] = b; // B
  }

  return new ort.Tensor('float32', input, [1, 3, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE]);
}

/**
 * Aplica Non-Maximum Suppression (NMS) e escala as caixas delimitadoras.
 * O formato de saída do YOLOv8n é [1, 84, 8400] (classes + 4 caixas + score)
 * @param output O tensor de saída do modelo.
 * @param originalWidth Largura original do vídeo.
 * @param originalHeight Altura original do vídeo.
 * @returns Um array de objetos Detection.
 */
export function postprocess(output: ort.Tensor, originalWidth: number, originalHeight: number): Detection[] {
  const outputData = output.data as Float32Array;
  // O formato de saída do YOLOv8n é [1, 84, 8400] (80 classes + 4 caixas)
  const numClasses = COCO_CLASSES.length;
  const numBoxes = output.dims[2]; // 8400
  const detections: Detection[] = [];

  // A saída é [cx, cy, w, h, class_scores...]
  // O tensor está achatado em [84 * 8400]
  for (let i = 0; i < numBoxes; i++) {
    let maxScore = -1;
    let maxClassId = -1;

    // Encontra a classe com a maior pontuação
    for (let j = 0; j < numClasses; j++) {
      // O índice é: (4 + j) * numBoxes + i
      const score = outputData[(4 + j) * numBoxes + i];
      if (score > maxScore) {
        maxScore = score;
        maxClassId = j;
      }
    }

    // Verifica o limiar de confiança
    if (maxScore >= YOLO_CONF_THRESHOLD) {
      // Coordenadas da caixa (cx, cy, w, h)
      const cx = outputData[0 * numBoxes + i];
      const cy = outputData[1 * numBoxes + i];
      const w = outputData[2 * numBoxes + i];
      const h = outputData[3 * numBoxes + i];

      // Converte (cx, cy, w, h) para (x1, y1, x2, y2)
      let x1 = cx - w / 2;
      let y1 = cy - h / 2;
      let x2 = cx + w / 2;
      let y2 = cy + h / 2;

      // Escala as coordenadas para o tamanho original do vídeo
      const xRatio = originalWidth / YOLO_INPUT_SIZE;
      const yRatio = originalHeight / YOLO_INPUT_SIZE;

      x1 *= xRatio;
      y1 *= yRatio;
      x2 *= xRatio;
      y2 *= yRatio;

      detections.push({
        box: [x1, y1, x2, y2],
        score: maxScore,
        classId: maxClassId,
        label: COCO_CLASSES[maxClassId],
      });
    }
  }

  // Aplica NMS (Non-Maximum Suppression)
  return nonMaxSuppression(detections, YOLO_IOU_THRESHOLD);
}

/**
 * Função de Non-Maximum Suppression (NMS)
 * @param boxes Array de detecções.
 * @param iouThreshold Limiar de Intersection Over Union.
 * @returns Array de detecções filtradas.
 */
function nonMaxSuppression(boxes: Detection[], iouThreshold: number): Detection[] {
  if (boxes.length === 0) return [];

  // Ordena por pontuação (score) em ordem decrescente
  boxes.sort((a, b) => b.score - a.score);

  const selectedBoxes: Detection[] = [];
  const active = new Array(boxes.length).fill(true);

  for (let i = 0; i < boxes.length; i++) {
    if (active[i]) {
      selectedBoxes.push(boxes[i]);
      for (let j = i + 1; j < boxes.length; j++) {
        if (active[j] && boxes[i].classId === boxes[j].classId) {
          const iou = calculateIOU(boxes[i].box, boxes[j].box);
          if (iou > iouThreshold) {
            active[j] = false; // Suprime a caixa com alto IOU
          }
        }
      }
    }
  }

  return selectedBoxes;
}

/**
 * Calcula a Interseção sobre União (IOU) de duas caixas delimitadoras.
 */
function calculateIOU(boxA: [number, number, number, number], boxB: [number, number, number, number]): number {
  const [xA1, yA1, xA2, yA2] = boxA;
  const [xB1, yB1, xB2, yB2] = boxB;

  // Coordenadas da área de interseção
  const x_inter_1 = Math.max(xA1, xB1);
  const y_inter_1 = Math.max(yA1, yB1);
  const x_inter_2 = Math.min(xA2, xB2);
  const y_inter_2 = Math.min(yA2, yB2);

  // Área de interseção
  const inter_width = Math.max(0, x_inter_2 - x_inter_1);
  const inter_height = Math.max(0, y_inter_2 - y_inter_1);
  const inter_area = inter_width * inter_height;

  // Área das caixas A e B
  const areaA = (xA2 - xA1) * (yA2 - yA1);
  const areaB = (xB2 - xB1) * (yB2 - yB1);

  // Área de união
  const union_area = areaA + areaB - inter_area;

  // IOU
  return union_area > 0 ? inter_area / union_area : 0;
}

/**
 * Desenha as caixas delimitadoras e os rótulos no canvas.
 * @param ctx Contexto 2D do canvas.
 * @param detections Array de detecções.
 */
export function drawBoxes(ctx: CanvasRenderingContext2D, detections: Detection[]): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineWidth = 2;
  ctx.font = '14px Arial';

  detections.forEach(det => {
    const [x1, y1, x2, y2] = det.box;
    const width = x2 - x1;
    const height = y2 - y1;

    // Cor aleatória baseada na classe para consistência
    const color = `hsl(${(det.classId * 41) % 360}, 70%, 50%)`;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    // Desenha a caixa
    ctx.strokeRect(x1, y1, width, height);

    // Desenha o fundo do rótulo
    const label = `${det.label} (${(det.score * 100).toFixed(1)}%)`;
    const textMetrics = ctx.measureText(label);
    const textHeight = 14; // Aproximação da altura da fonte
    const textPadding = 4;

    ctx.fillRect(
      x1,
      y1 - textHeight - textPadding * 2,
      textMetrics.width + textPadding * 2,
      textHeight + textPadding * 2
    );

    // Desenha o texto do rótulo
    ctx.fillStyle = 'white';
    ctx.fillText(label, x1 + textPadding, y1 - textPadding);
  });
}
