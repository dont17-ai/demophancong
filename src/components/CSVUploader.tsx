import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, RefreshCw, AlertCircle } from "lucide-react";
import { parseCSV } from "../utils/csvParser";
import { TeachingRecord } from "../types";
import { DEFAULT_CSV_DATA } from "../data/defaultData";

interface CSVUploaderProps {
  onRecordsLoaded: (records: TeachingRecord[], source: "upload" | "default") => void;
  currentCount: number;
}

export default function CSVUploader({ onRecordsLoaded, currentCount }: CSVUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith(".csv")) {
      setError("Chỉ chấp nhận tệp có định dạng .csv");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setError("Tệp rỗng hoặc không thể đọc được.");
          return;
        }
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setError("Không tìm thấy dữ liệu hợp lệ trong tệp CSV. Vui lòng kiểm tra định dạng phân cách bằng dấu chấm phẩy (;) và tiêu đề.");
          return;
        }
        onRecordsLoaded(parsed, "upload");
      } catch (err: any) {
        setError(`Lỗi xử lý tệp: ${err.message || err}`);
      }
    };
    reader.onerror = () => {
      setError("Đã xảy ra lỗi khi đọc tệp.");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleLoadDefault = () => {
    setError(null);
    const parsed = parseCSV(DEFAULT_CSV_DATA);
    onRecordsLoaded(parsed, "default");
  };

  return (
    <div id="csv-uploader-container" className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 id="csv-uploader-title" className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Nguồn Dữ Liệu Phân Công
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tải tệp .csv (phân cách bằng dấu chấm phẩy <code>;</code>) hoặc sử dụng dữ liệu mẫu có sẵn để bắt đầu phân tích.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-load-default"
            onClick={handleLoadDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors"
            title="Tải lại dữ liệu gốc từ danh sách mẫu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Khôi phục dữ liệu mẫu
          </button>
          <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg border border-indigo-100">
            Hiện tại: <strong>{currentCount}</strong> dòng phân công
          </span>
        </div>
      </div>

      <div
        id="drag-drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
            : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-1">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Kéo thả tệp .csv vào đây hoặc <span className="text-indigo-600 hover:underline">nhấp để duyệt</span>
          </p>
          <p className="text-xs text-slate-400 max-w-lg">
            Định dạng yêu cầu: <strong>Môn;Tên môn;Lớp;Chuyên ngành;Số sinh viên cần học;Part;Giảng viên;Số giờ AP</strong>
          </p>
        </div>
      </div>

      {error && (
        <div id="upload-error-alert" className="mt-4 flex items-start gap-2 p-3 bg-rose-50 text-rose-800 rounded-lg border border-rose-100 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
    </div>
  );
}
