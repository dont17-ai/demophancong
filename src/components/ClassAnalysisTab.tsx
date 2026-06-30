import React, { useMemo, useState } from "react";
import { TeachingRecord, ClassAnalysis } from "../types";
import { AlertTriangle, BookOpen, User, CheckCircle, Search, Filter, ShieldAlert } from "lucide-react";

interface ClassAnalysisTabProps {
  records: TeachingRecord[];
}

export default function ClassAnalysisTab({ records }: ClassAnalysisTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);

  // Parse all records and group them by class
  const classAnalyses = useMemo(() => {
    const classMap: { [className: string]: { subjectCode: string; subjectName: string; lecturer: string; hours: number }[] } = {};

    records.forEach(r => {
      const cls = r.className.trim();
      if (!cls) return;

      if (!classMap[cls]) {
        classMap[cls] = [];
      }
      classMap[cls].push({
        subjectCode: r.subjectCode,
        subjectName: r.subjectName,
        lecturer: r.lecturer ? r.lecturer.trim() : "",
        hours: r.hours
      });
    });

    const list: ClassAnalysis[] = Object.entries(classMap).map(([clsName, courses]) => {
      // Find duplicate lecturers
      // Count subjects taught by each lecturer in this class
      const lecCount: { [lec: string]: string[] } = {};
      courses.forEach(c => {
        if (c.lecturer) {
          if (!lecCount[c.lecturer]) {
            lecCount[c.lecturer] = [];
          }
          lecCount[c.lecturer].push(c.subjectCode);
        }
      });

      const duplicateLecturers = Object.entries(lecCount)
        .filter(([_, subjects]) => subjects.length >= 2)
        .map(([lecturer, subjects]) => ({
          lecturer,
          subjects
        }));

      return {
        className: clsName,
        courses,
        duplicateLecturers
      };
    });

    return list.sort((a, b) => a.className.localeCompare(b.className));
  }, [records]);

  // Total classes with duplicate lecturers
  const duplicateClasses = useMemo(() => {
    return classAnalyses.filter(c => c.duplicateLecturers.length > 0);
  }, [classAnalyses]);

  // Filter classes according to search input and duplicate filter
  const filteredClasses = useMemo(() => {
    return classAnalyses.filter(c => {
      const matchSearch = c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courses.some(course => 
          course.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.lecturer.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchDuplicate = !showOnlyDuplicates || c.duplicateLecturers.length > 0;

      return matchSearch && matchDuplicate;
    });
  }, [classAnalyses, searchTerm, showOnlyDuplicates]);

  // Detail for the currently selected class
  const selectedClassDetails = useMemo(() => {
    if (selectedClassName) {
      return classAnalyses.find(c => c.className === selectedClassName) || null;
    }
    // Default to the first filtered class if none is selected
    return filteredClasses[0] || null;
  }, [classAnalyses, selectedClassName, filteredClasses]);

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Cards & Quick Resolution panel */}
      <div id="duplicate-warning-box" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Class Count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tổng số lớp học</div>
            <div className="text-2xl font-bold text-slate-800">{classAnalyses.length}</div>
          </div>
        </div>

        {/* Total Duplicates Alarm Card */}
        <div className={`p-5 rounded-xl border shadow-sm flex items-center gap-4 transition-all duration-300 ${
          duplicateClasses.length > 0
            ? "bg-amber-50/70 border-amber-200 text-amber-900"
            : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
        }`}>
          <div className={`p-3 rounded-xl ${
            duplicateClasses.length > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Lớp trùng lặp giảng viên</div>
            <div className="text-2xl font-bold">
              {duplicateClasses.length} 
              {duplicateClasses.length > 0 ? (
                <span className="text-xs font-semibold ml-2 text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Cần xử lý!</span>
              ) : (
                <span className="text-xs font-semibold ml-2 text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">An toàn</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Help Guide */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm text-xs text-slate-500 flex flex-col justify-center">
          <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
            💡 Gợi ý xử lý trùng lặp:
          </p>
          <p>
            Trùng lặp xảy ra khi cùng 1 thầy/cô giảng dạy từ <strong>2 môn trở lên</strong> cho cùng 1 lớp sinh viên. Hãy chuyển sang Tab "Phân Công" để đổi bớt môn của họ cho giảng viên khác.
          </p>
        </div>
      </div>

      {/* Main Split Layout: Left side class list, Right side class detail */}
      <div id="class-split-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Class Navigator with Filters */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 flex flex-col h-[580px]">
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-bold text-slate-800">Danh Sách Lớp Học</h4>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="search-class-sidebar"
                type="text"
                placeholder="Tìm lớp hoặc môn học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <button
              id="btn-filter-duplicates"
              onClick={() => setShowOnlyDuplicates(prev => !prev)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                showOnlyDuplicates
                  ? "bg-amber-50 border-amber-200 text-amber-850 font-bold"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className={`w-3.5 h-3.5 ${showOnlyDuplicates ? "text-amber-600" : "text-slate-400"}`} />
                Chỉ hiển thị lớp trùng lặp GV
              </span>
              <span className="px-1.5 py-0.5 bg-slate-200/80 rounded text-[10px] font-bold text-slate-750">
                {duplicateClasses.length}
              </span>
            </button>
          </div>

          {/* List of classes scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
            {filteredClasses.length > 0 ? (
              filteredClasses.map(c => {
                const isSelected = selectedClassDetails?.className === c.className;
                const hasDuplicate = c.duplicateLecturers.length > 0;

                return (
                  <button
                    key={c.className}
                    id={`btn-select-class-${c.className}`}
                    onClick={() => setSelectedClassName(c.className)}
                    className={`w-full text-left px-3.5 py-3 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/70 border-l-4 border-l-indigo-600"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800">{c.className}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {c.courses.length} môn học kỳ này
                      </div>
                    </div>

                    {hasDuplicate && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold border border-amber-200 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                        Trùng ({c.duplicateLecturers.length})
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                Không tìm thấy lớp học nào khớp.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Class Detailed Analysis Panel */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex flex-col h-[580px]">
          {selectedClassDetails ? (
            <div className="flex flex-col h-full">
              {/* Header with warnings */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Thông tin lớp học
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">
                    Lớp: {selectedClassDetails.className}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {selectedClassDetails.duplicateLecturers.length > 0 ? (
                    <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
                      Phát hiện giảng viên dạy {selectedClassDetails.duplicateLecturers.length} môn trùng lặp!
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Mọi giảng viên đều phân bố đồng đều
                    </div>
                  )}
                </div>
              </div>

              {/* Duplicate alert list details */}
              {selectedClassDetails.duplicateLecturers.length > 0 && (
                <div id="duplicate-warning-banner" className="mb-4 bg-amber-50 border border-amber-100 rounded-lg p-3.5">
                  <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    CẢNH BÁO TRÙNG LẶP CHO LỚP {selectedClassDetails.className}:
                  </h5>
                  <div className="space-y-1.5">
                    {selectedClassDetails.duplicateLecturers.map((dup, idx) => (
                      <p key={idx} className="text-xs text-amber-800 leading-relaxed pl-5 relative">
                        <span className="absolute left-1 top-1.5 w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        Giảng viên <strong className="text-slate-800">🧑‍🏫 {dup.lecturer}</strong> đang giảng dạy đồng thời <strong>{dup.subjects.length} môn khác nhau</strong> cho lớp này:{" "}
                        <code className="bg-amber-100 px-1 py-0.5 rounded font-bold text-amber-950">
                          {dup.subjects.join(", ")}
                        </code>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Table of courses & instructors in this class */}
              <div className="flex-1 overflow-y-auto">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Môn Học Của Học Kỳ & Giảng Viên Đứng Lớp
                </h5>
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100">
                        <th className="px-4 py-3">Mã Môn</th>
                        <th className="px-4 py-3">Tên Môn Học</th>
                        <th className="px-4 py-3 text-center">Số Giờ AP</th>
                        <th className="px-4 py-3">Giảng Viên Đảm Nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedClassDetails.courses.map((course, idx) => {
                        const isLecturerDuplicated = selectedClassDetails.duplicateLecturers.some(
                          d => d.lecturer === course.lecturer
                        );

                        return (
                          <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${
                            isLecturerDuplicated ? "bg-amber-50/20" : ""
                          }`}>
                            <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                              {course.subjectCode}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {course.subjectName}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-700">
                              {course.hours}
                            </td>
                            <td className="px-4 py-3">
                              {course.lecturer ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                                  isLecturerDuplicated
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                }`}>
                                  <User className="w-3 h-3" />
                                  {course.lecturer}
                                  {isLecturerDuplicated && " (Trùng)"}
                                </span>
                              ) : (
                                <span className="text-xs text-rose-500 font-semibold italic">
                                  ⚠️ Chưa phân công
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
              <BookOpen className="w-12 h-12 text-slate-200 mb-2" />
              Chọn một lớp học bất kỳ ở danh mục bên trái để bắt đầu phân tích môn học và kiểm duyệt lịch dạy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
