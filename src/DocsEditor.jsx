import { useEffect, useState } from "react";
import * as Y from "yjs";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function DocsEditor() {
  const [content, setContent] = useState("");
  const [yDoc] = useState(() => new Y.Doc());

  useEffect(() => {
    const yText = yDoc.getText("quill");
    const observer = () => setContent(yText.toString());
    yText.observe(observer);
    setContent(yText.toString());

    return () => {
      yText.unobserve(observer);
      yDoc.destroy();
    };
  }, [yDoc]);

  const handleChange = (value) => {
    setContent(value);
    const yText = yDoc.getText("quill");
    yText.delete(0, yText.length);
    yText.insert(0, value);
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-gray-800 rounded-lg shadow-md p-4 text-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-indigo-400">
        Collaborative Docs Editor
      </h1>
      <div className="flex-1 flex flex-col overflow-auto">
        <ReactQuill
          value={content}
          onChange={handleChange}
          theme="snow"
          className="flex-1 h-full w-full"
        />
      </div>
    </div>
  );
}
