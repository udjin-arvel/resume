import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import type Konva from 'konva';

const BRUSH_COLOR = '#5329FF';
const BRUSH_OPACITY = 0.75;
const BRUSH_WIDTH = 20;

interface IPhotoEditorKonvaCanvasProps {
    mainImageUrl: string;
    canvasWrapperRef: React.RefObject<HTMLDivElement | null>;
    isDrawModeOn: boolean;
    canvasHandleRef?: React.MutableRefObject<PhotoEditorKonvaCanvasHandle | null>;
    onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
}

type CanvasPointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>;
type SourceImageParams = { image: HTMLImageElement; x: number; y: number; width: number; height: number };
type CaptureOptions = { mimeType?: string; quality?: number; pixelRatio?: number };

export interface PhotoEditorKonvaCanvasHandle {
    captureDataUrl: (options?: CaptureOptions) => string | null;
    captureBlob: (options?: CaptureOptions) => Promise<Blob | null>;
    captureOriginalBlob: () => Promise<Blob | null>;
    undo: () => Promise<boolean>;
    redo: () => Promise<boolean>;
    clearDrawing: () => Promise<void>;
}

const initializeBrush = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = BRUSH_COLOR;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = BRUSH_WIDTH;
}

export const PhotoEditorKonvaCanvas: React.FC<IPhotoEditorKonvaCanvasProps> = ({
    mainImageUrl,
    canvasWrapperRef,
    isDrawModeOn,
    canvasHandleRef,
    onHistoryChange,
}) => {
    const [tool] = useState<'brush' | 'eraser'>('brush');
    const isDrawing = useRef(false);
    const stageRef = useRef<Konva.Stage | null>(null);
    const imageRef = useRef<Konva.Image | null>(null);
    const tempImageRef = useRef<Konva.Image | null>(null);
    const lastPos = useRef<Konva.Vector2d | null>(null);
    const currentStrokePointsRef = useRef<Array<{ x: number; y: number }>>([]);
    const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
    const [stageSize, setStageSize] = useState({ width: 500, height: 500 });
    const stageWidth = stageSize.width;
    const stageHeight = stageSize.height;
    const historyStackRef = useRef<string[]>(['']);
    const historyIndexRef = useRef(0);
    // --- vars and utils
    const { canvas, context, tempCanvas, tempContext } = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('2d canvas context is not available');
        initializeBrush(context);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1;
        tempCanvas.height = 1;
        const tempContext = tempCanvas.getContext('2d');
        if (!tempContext) throw new Error('2d canvas context is not available');
        initializeBrush(tempContext);

        return { canvas, context, tempCanvas, tempContext };
    }, []);
    const sourceImageParams = useMemo<SourceImageParams | null>(() => {
        if (!sourceImage) return null;
        const naturalWidth = sourceImage.naturalWidth;
        const naturalHeight = sourceImage.naturalHeight;
        if (!naturalWidth || !naturalHeight) return null;

        const scale = Math.min(stageWidth / naturalWidth, stageHeight / naturalHeight);
        const width = naturalWidth * scale;
        const height = naturalHeight * scale;
        const x = (stageWidth - width) / 2;
        const y = (stageHeight - height) / 2;

        return { image: sourceImage, x, y, width, height };
    }, [sourceImage, stageWidth, stageHeight]);

    const emitHistoryState = () => {
        onHistoryChange?.({
            canUndo: historyIndexRef.current > 0,
            canRedo: historyIndexRef.current < historyStackRef.current.length - 1,
        });
    };

    const restoreDrawingSnapshot = async (snapshot: string) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (!snapshot) {
            imageRef.current?.getLayer()?.batchDraw();
            return;
        }
        const snapshotImage = new window.Image();
        snapshotImage.src = snapshot;
        await new Promise<void>((resolve) => {
            snapshotImage.onload = () => {
                context.drawImage(snapshotImage, 0, 0, canvas.width, canvas.height);
                resolve();
            };
            snapshotImage.onerror = () => resolve();
        });
        imageRef.current?.getLayer()?.batchDraw();
    };

    const pushHistorySnapshot = () => {
        const nextSnapshot = canvas.toDataURL('image/png');
        const currentSnapshot = historyStackRef.current[historyIndexRef.current];
        if (nextSnapshot === currentSnapshot) return;
        const nextStack = historyStackRef.current.slice(0, historyIndexRef.current + 1);
        nextStack.push(nextSnapshot);
        historyStackRef.current = nextStack;
        historyIndexRef.current = nextStack.length - 1;
        emitHistoryState();
    };

    // --- handlers
    const handleMouseDown = (e: CanvasPointerEvent) => {
        if (!isDrawModeOn) return;
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;
        isDrawing.current = true;
        lastPos.current = pos;

        const image = imageRef.current;
        if (!image) return;
        currentStrokePointsRef.current = [{ x: pos.x - image.x(), y: pos.y - image.y() }];
    };
    const handleMouseUp = () => {
        if (isDrawModeOn && isDrawing.current) {
            if (tool !== 'eraser' && currentStrokePointsRef.current.length > 0) {
                // Commit current stroke from tempCanvas onto permanent canvas with brush opacity
                context.globalAlpha = BRUSH_OPACITY;
                context.drawImage(tempCanvas, 0, 0);
                context.globalAlpha = 1;
                tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                currentStrokePointsRef.current = [];
                imageRef.current?.getLayer()?.batchDraw();
            }
            pushHistorySnapshot();
        }
        isDrawing.current = false;
    };
    const handleMouseMove = (e: CanvasPointerEvent) => {
        if (!isDrawModeOn || !isDrawing.current || !lastPos.current) return;

        const image = imageRef.current;
        const stage = e.target.getStage();
        if (!image || !stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        const newLocalPos = {
            x: pos.x - image.x(),
            y: pos.y - image.y(),
        };

        if (tool === 'eraser') {
            const localPos = { x: lastPos.current.x - image.x(), y: lastPos.current.y - image.y() };
            context.globalCompositeOperation = 'destination-out';
            context.beginPath();
            context.moveTo(localPos.x, localPos.y);
            context.lineTo(newLocalPos.x, newLocalPos.y);
            context.stroke();
            context.globalCompositeOperation = 'source-over';
        } else {
            // Redraw entire stroke from scratch on tempCanvas to avoid opacity accumulation
            currentStrokePointsRef.current.push(newLocalPos);
            const points = currentStrokePointsRef.current;
            tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempContext.beginPath();
            tempContext.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                tempContext.lineTo(points[i].x, points[i].y);
            }
            tempContext.stroke();
        }

        lastPos.current = pos;
        image.getLayer()?.batchDraw();
    };
    // --- effects
    useEffect(() => {
        if (!canvasHandleRef) return;
        canvasHandleRef.current = {
            captureDataUrl: (options) => {
                const stage = stageRef.current;
                if (!stage) return null;
                return stage.toDataURL({
                    pixelRatio: options?.pixelRatio ?? 1,
                    mimeType: options?.mimeType,
                    quality: options?.quality,
                });
            },
            captureBlob: async (options) => {
                const stage = stageRef.current;
                if (!stage) return null;
                const dataUrl = stage.toDataURL({
                    pixelRatio: options?.pixelRatio ?? 1,
                    mimeType: options?.mimeType,
                    quality: options?.quality,
                });
                const response = await fetch(dataUrl);
                return response.blob();
            },
            captureOriginalBlob: async () => {
                if (!sourceImage || !sourceImageParams) return null;
                const outputCanvas = document.createElement('canvas');
                outputCanvas.width = sourceImage.naturalWidth;
                outputCanvas.height = sourceImage.naturalHeight;
                const outputContext = outputCanvas.getContext('2d');
                if (!outputContext) return null;

                outputContext.drawImage(
                    sourceImage,
                    0,
                    0,
                    sourceImage.naturalWidth,
                    sourceImage.naturalHeight,
                );

                outputContext.drawImage(
                    canvas,
                    0,
                    0,
                    sourceImageParams.width,
                    sourceImageParams.height,
                    0,
                    0,
                    outputCanvas.width,
                    outputCanvas.height,
                );

                outputContext.globalAlpha = BRUSH_OPACITY;
                outputContext.drawImage(
                    tempCanvas,
                    0,
                    0,
                    sourceImageParams.width,
                    sourceImageParams.height,
                    0,
                    0,
                    outputCanvas.width,
                    outputCanvas.height,
                );
                outputContext.globalAlpha = 1;

                return await new Promise<Blob | null>((resolve) => {
                    outputCanvas.toBlob((blob) => resolve(blob), 'image/png');
                });
            },
            undo: async () => {
                if (historyIndexRef.current <= 0) return false;
                historyIndexRef.current -= 1;
                await restoreDrawingSnapshot(historyStackRef.current[historyIndexRef.current]);
                emitHistoryState();
                return true;
            },
            redo: async () => {
                if (historyIndexRef.current >= historyStackRef.current.length - 1) return false;
                historyIndexRef.current += 1;
                await restoreDrawingSnapshot(historyStackRef.current[historyIndexRef.current]);
                emitHistoryState();
                return true;
            },
            clearDrawing: async () => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                historyStackRef.current = [''];
                historyIndexRef.current = 0;
                imageRef.current?.getLayer()?.batchDraw();
                emitHistoryState();
            },
        };
        return () => {
            canvasHandleRef.current = null;
        };
    }, [canvasHandleRef, canvas, context, tempCanvas, sourceImage, sourceImageParams]);
    useEffect(function loadSourceImage() {
        setSourceImage(null);
        const image = new window.Image();
        image.src = mainImageUrl;

        image.onload = () => {
            setSourceImage(image);
        };

        image.onerror = () => {
            setSourceImage(null);
        };

        return () => {
            image.onload = null;
            image.onerror = null;
        };
    }, [mainImageUrl]);
    useEffect(function setInitCanvasSize() {
        const snapshotBeforeResize = historyStackRef.current[historyIndexRef.current] ?? '';
        canvas.width = stageWidth;
        canvas.height = stageHeight;
        tempCanvas.width = stageWidth;
        tempCanvas.height = stageHeight;
        initializeBrush(context);
        initializeBrush(tempContext);
        tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        void restoreDrawingSnapshot(snapshotBeforeResize);
    }, [canvas, context, tempCanvas, tempContext, stageWidth, stageHeight]);
    useEffect(function resetDrawingHistoryOnMainImageChange() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        historyStackRef.current = [''];
        historyIndexRef.current = 0;
        emitHistoryState();
    }, [mainImageUrl, canvas, context, tempCanvas, tempContext]);
    useEffect(function stopDrawingWhenDrawModeOff() {
        if (!isDrawModeOn) {
            isDrawing.current = false;
            lastPos.current = null;
            currentStrokePointsRef.current = [];
            tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
    }, [isDrawModeOn, tempCanvas, tempContext]);
    useEffect(function setInitStageSize() {
        const wrapper = canvasWrapperRef.current;
        if (!wrapper) return;

        const updateSize = () => {
            const maxWidth = Math.max(wrapper.clientWidth, 1);
            const maxHeight = Math.max(wrapper.clientHeight, 1);
            let nextWidth = maxWidth;
            let nextHeight = maxHeight;

            if (sourceImage?.naturalWidth && sourceImage?.naturalHeight) {
                const imageAspectRatio = sourceImage.naturalWidth / sourceImage.naturalHeight;
                nextWidth = maxWidth;
                nextHeight = nextWidth / imageAspectRatio;
                if (nextHeight > maxHeight) {
                    nextHeight = maxHeight;
                    nextWidth = nextHeight * imageAspectRatio;
                }
            }
            setStageSize((prev) => (
                prev.width === nextWidth && prev.height === nextHeight
                    ? prev
                    : { width: nextWidth, height: nextHeight }
            ));
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(wrapper);

        return () => {
            resizeObserver.disconnect();
        };
    }, [canvasWrapperRef, sourceImage]);
    useEffect(() => {
        emitHistoryState();
    }, [onHistoryChange]);

    return (
        <Stage
            ref={stageRef}
            style={{ backgroundColor: 'var(--color-bg-alt)' }}
            width={stageWidth}
            height={stageHeight}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            <Layer>
                {sourceImageParams && <Image
                    image={sourceImageParams.image}
                    x={sourceImageParams.x}
                    y={sourceImageParams.y}
                    width={sourceImageParams.width}
                    height={sourceImageParams.height}
                />}
                <>
                    <Image
                        ref={imageRef}
                        image={canvas}
                        x={0}
                        y={0}
                        width={stageWidth}
                        height={stageHeight}
                        listening={isDrawModeOn}
                        visible={isDrawModeOn}
                    />
                    <Image
                        ref={tempImageRef}
                        image={tempCanvas}
                        x={0}
                        y={0}
                        width={stageWidth}
                        height={stageHeight}
                        opacity={BRUSH_OPACITY}
                        listening={false}
                        visible={isDrawModeOn}
                    />
                </>
            </Layer>
        </Stage>
    )
}