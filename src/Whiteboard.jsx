import React, { useEffect, useRef, useState } from "react";
import fabric from "./fabricLoader";

export default function Whiteboard({ onBack }) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [brushColor, setBrushColor] = useState("#4f46e5");
  const [brushWidth, setBrushWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (!fabric || !canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#f8f8f8", 
      isDrawingMode: true,
    });

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushWidth;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.setWidth(rect.width);
      canvas.setHeight(rect.height);
      canvas.renderAll();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    fabricCanvasRef.current = canvas;

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = isEraser ? "#f8f8f8" : brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }
  }, [brushColor, brushWidth, isEraser]);

  const handleClear = () => {
    const canvas = fabricCanvasRef.current;
    if (canvas) canvas.clear();
  };

  const handleUndo = () => {
    const canvas = fabricCanvasRef.current;
    if (canvas && canvas._objects.length > 0) {
      canvas._objects.pop();
      canvas.renderAll();
    }
  };

  const handleDownload = () => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL({ format: "png" });
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "whiteboard.png";
      link.click();
    }
  };

  const toggleEraser = () => setIsEraser((prev) => !prev);

  return (
    <div className="relative flex-1 w-full h-full bg-gray-900 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full border-none cursor-crosshair"
      />

      <div className="absolute top-4 left-4 z-50 flex flex-wrap items-center gap-3 bg-gray-800/90 p-3 rounded-lg shadow-lg">
        <button
          onClick={onBack}
          className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
        >
          ← Back
        </button>

        <button
          onClick={handleClear}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Clear
        </button>

        <label className="text-gray-200 font-medium">Brush:</label>
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          disabled={isEraser}
          className="w-8 h-8 border rounded cursor-pointer"
        />

        <label className="text-gray-200 font-medium">Size:</label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushWidth}
          onChange={(e) => setBrushWidth(parseInt(e.target.value))}
        />

        <button
          onClick={toggleEraser}
          className={`px-3 py-1 rounded shadow ${
            isEraser
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-gray-300 text-black hover:bg-gray-400"
          }`}
        >
          {isEraser ? "Eraser ON" : "Eraser OFF"}
        </button>

        <button
          onClick={handleUndo}
          className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600"
        >
          Undo
        </button>

        <button
          onClick={handleDownload}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          Download
        </button>
      </div>
    </div>
  );
}
