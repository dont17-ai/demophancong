import React, { useState, useEffect, useMemo } from "react";
import { parseCSV, exportToCSV } from "./utils/csvParser";
import { DEFAULT_CSV_DATA } from "./data/defaultData";
import { TeachingRecord } from "./types";
import CSVUploader from "./components/CSVUploader";
import AssignmentTab from "./components/AssignmentTab";
import LecturerAnalysisTab from "./components/LecturerAnalysisTab";
import SubjectAnalysisTab from "./components/SubjectAnalysisTab";
import ClassAnalysisTab from "./components/ClassAnalysisTab";
import { Calendar, UserCheck, BarChart3, BookOpen, Layers, Download, RefreshCw, Sparkles, Menu } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"assignment" | "lecturer" | "subject" | "class">("assignment");
  const [records, setRecords] = useState<TeachingRecord[]>([]);
  const [allLecturers, setAllLecturers] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load initial data from localStorage or default
  useEffect(() => {
    const savedRecords = localStorage.getItem("teaching_records");
    const savedLecturers = localStorage.getItem("teaching_lecturers");

    let loadedRecords: TeachingRecord[] = [];
    if (savedRecords) {
      try {
        loadedRecords = JSON.parse(savedRecords);
      } catch (e) {
        console.error("Failed to parse saved records from localStorage, falling back to default.");
      }
    }

    if (loadedRecords.length === 0) {
      // Load default CSV
      loadedRecords = parseCSV(DEFAULT_CSV_DATA);
    }

    setRecords(loadedRecords);

    // Load or extract unique lecturers
    if (savedLecturers) {
      try {
        setAllLecturers(JSON.parse(savedLecturers));
      } catch (e) {
        // Fallback extract
        const list = loadedRecords.map(r => r.lecturer ? r.lecturer.trim() : "").filter(Boolean);
        setAllLecturers(Array.from(new Set(list)).sort());
      }
    } else {
      const list = loadedRecords.map(r => r.lecturer ? r.lecturer.trim() : "").filter(Boolean);
      setAllLecturers(Array.from(new Set(list)).sort());
    }
  }, []);

  // Save state to localStorage whenever records change
  const saveRecords = (newRecords: TeachingRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem("teaching_records", JSON.stringify(newRecords));
  };

  // Update lecturer list and persist
  const saveLecturers = (newList: string[]) => {
    setAllLecturers(newList);
    localStorage.setItem("teaching_lecturers", JSON.stringify(newList));
  };

  // Handler for loaded records from CSV Uploader
  const handleRecordsLoaded = (loadedRecords: TeachingRecord[], source: "upload" | "default") => {
    saveRecords(loadedRecords);

    // Extract lecturers from loaded records
    const list = loadedRecords.map(r => r.lecturer ? r.lecturer.trim() : "").filter(Boolean);
    const uniqueList = Array.from(new Set(list)).sort();
    saveLecturers(uniqueList);

    // Alert toast or logs
    console.log(`Successfully loaded ${loadedRecords.length} records via ${source}`);
  };

  // Handler for inline updates inside AssignmentTab
  const handleUpdateRecord = (id: string, updatedFields: Partial<TeachingRecord>) => {
    const updated = records.map(r => r.id === id ? { ...r, ...updatedFields } : r);
    saveRecords(updated);
  };

  // Handler for adding a new lecturer manually
  const handleAddLecturer = (name: string) => {
    const updatedList = [...allLecturers, name].sort();
    saveLecturers(updatedList);
  };

  // Reset everything back to the initial sample state
  const handleResetToDefault = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục lại toàn bộ dữ liệu phân công ban đầu không? Các chỉnh sửa hiện tại sẽ bị ghi đè.")) {
      const parsed = parseCSV(DEFAULT_CSV_DATA);
      saveRecords(parsed);
      const list = parsed.map(r => r.lecturer ? r.lecturer.trim() : "").filter(Boolean);
      saveLecturers(Array.from(new Set(list)).sort());
    }
  };

  // Export current records as Semicolon-Separated CSV
  const handleExportCSV = () => {
    try {
      const csvContent = exportToCSV(records);
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `phan_cong_lich_day_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert(`Đã xảy ra lỗi khi xuất file: ${e.message || e}`);
    }
  };

  // Count unassigned lectures
  const unassignedCount = useMemo(() => {
    return records.filter(r => !r.lecturer || r.lecturer.trim() === "").length;
  }, [records]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-850 antialiased overflow-hidden">
      
      {/* 1. Left Sidebar (Geometric Balance styling, hidden on small screens) */}
      <aside className="hidden lg:flex lg:w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-sm shadow-indigo-100 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
              EduSched Pro
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Đại học FPT</p>
          </div>
        </div>

        {/* Sidebar Vertical Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-2">
            Phân hệ chính
          </div>
          <button
            id="tab-btn-assignment"
            onClick={() => setActiveTab("assignment")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "assignment"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            Phân công lịch dạy
          </button>

          <button
            id="tab-btn-lecturer"
            onClick={() => setActiveTab("lecturer")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "lecturer"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            Phân tích Giảng viên
          </button>

          <button
            id="tab-btn-subject"
            onClick={() => setActiveTab("subject")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "subject"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            Phân tích Môn học
          </button>

          <button
            id="tab-btn-class"
            onClick={() => setActiveTab("class")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "class"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            Phân tích Lớp học
          </button>
        </nav>

        {/* User Block at bottom */}
        <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              BM
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Trưởng Bộ Môn</p>
              <p className="text-[10px] text-slate-500">Khoa CNTT - Đại học FPT</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100/70 flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Cơ sở dữ liệu đồng bộ
          </div>
        </div>
      </aside>

      {/* 2. Mobile Header navigation (Only visible on small screens) */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex flex-col gap-2 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h1 className="text-sm font-bold text-slate-900">EduSched Pro</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-1 text-slate-600 hover:bg-slate-100 rounded"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Dropdown list */}
        {mobileMenuOpen && (
          <nav className="flex flex-col gap-1 py-2 border-t border-slate-100 animate-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => { setActiveTab("assignment"); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold ${
                activeTab === "assignment" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <UserCheck className="w-4 h-4" /> Bảng Phân Công
            </button>
            <button
              onClick={() => { setActiveTab("lecturer"); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold ${
                activeTab === "lecturer" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Phân tích Giảng viên
            </button>
            <button
              onClick={() => { setActiveTab("subject"); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold ${
                activeTab === "subject" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Phân tích Môn học
            </button>
            <button
              onClick={() => { setActiveTab("class"); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold ${
                activeTab === "class" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-4 h-4" /> Phân tích Lớp học
            </button>
          </nav>
        )}
      </header>

      {/* 3. Main Content Wrapper */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        
        {/* Top bar with active tab and action items */}
        <header className="bg-white border-b border-slate-200 min-h-[64px] px-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 shadow-sm z-10 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {activeTab === "assignment" && "Bảng Phân Công & Thống Kê Giờ Giảng"}
              {activeTab === "lecturer" && "Phân Tích Chi Tiết Toàn Bộ Giảng Viên"}
              {activeTab === "subject" && "Phân Tích Quy Mô Sinh Viên & Môn Học"}
              {activeTab === "class" && "Phân Tích Trùng Lặp Giảng Viên Theo Lớp"}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Bộ phận khảo thí khoa Công nghệ thông tin • Đại học FPT
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-flex px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
              CẬP NHẬT TRỰC TIẾP
            </span>
            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
              title="Xuất file .CSV phân công hiện tại"
            >
              <Download className="w-3.5 h-3.5" />
              XUẤT BÁO CÁO
            </button>
            <button
              id="btn-reset-top"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 py-2 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100 cursor-pointer"
              title="Khôi phục lại dữ liệu mẫu gốc"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Dynamic page contents */}
        <div className="flex-1 p-6 space-y-6">
          {/* CSV Uploader */}
          <CSVUploader
            onRecordsLoaded={handleRecordsLoaded}
            currentCount={records.length}
          />

          {/* Warning banner */}
          {unassignedCount > 0 && (
            <div id="unassigned-warning-banner" className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-xs">
              <div className="flex gap-3">
                <div className="text-amber-600 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Phát hiện {unassignedCount} lớp học chưa được phân công giảng viên
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Hãy lựa chọn giảng viên phù hợp từ danh sách dropdown ở tab <strong>"Phân công lịch dạy"</strong>. Biểu đồ giờ dạy và các báo cáo phân tích sẽ tự động cập nhật ngay lập tức.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Render Active Tab */}
          <div id="tab-container" className="animate-in fade-in duration-200">
            {activeTab === "assignment" && (
              <AssignmentTab
                records={records}
                onUpdateRecord={handleUpdateRecord}
                onAddLecturer={handleAddLecturer}
                allLecturers={allLecturers}
              />
            )}

            {activeTab === "lecturer" && (
              <LecturerAnalysisTab
                records={records}
              />
            )}

            {activeTab === "subject" && (
              <SubjectAnalysisTab
                records={records}
              />
            )}

            {activeTab === "class" && (
              <ClassAnalysisTab
                records={records}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-[11px] text-slate-400 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-auto">
          <p className="font-semibold text-slate-500">Phân Công & Trực Quan Hóa Lịch Giảng Dạy © 2026</p>
          <p>Khoa Công nghệ thông tin • Đại học FPT</p>
        </footer>
      </main>
    </div>
  );
}

