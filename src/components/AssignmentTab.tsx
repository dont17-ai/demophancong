import React, { useState, useMemo } from "react";
import { Search, Filter, AlertCircle, HelpCircle, Check, Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TeachingRecord } from "../types";

interface AssignmentTabProps {
  records: TeachingRecord[];
  onUpdateRecord: (id: string, updatedFields: Partial<TeachingRecord>) => void;
  onAddLecturer: (name: string) => void;
  allLecturers: string[];
}

export default function AssignmentTab({
  records,
  onUpdateRecord,
  onAddLecturer,
  allLecturers,
}: AssignmentTabProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedMajor, setSelectedMajor] = useState<string>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // New Lecturer State
  const [newLecturerName, setNewLecturerName] = useState("");
  const [showAddLecturerModal, setShowAddLecturerModal] = useState(false);
  const [addLecturerError, setAddLecturerError] = useState("");

  // Get unique classes & majors for filters
  const uniqueClasses = useMemo(() => {
    const classes = records.map(r => r.className).filter(Boolean);
    return Array.from(new Set(classes)).sort();
  }, [records]);

  const uniqueMajors = useMemo(() => {
    const majors = records.map(r => r.major).filter(Boolean);
    return Array.from(new Set(majors)).sort();
  }, [records]);

  // Handle lecturer addition
  const handleAddNewLecturer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newLecturerName.trim();
    if (!cleanName) {
      setAddLecturerError("Tên giảng viên không được để trống.");
      return;
    }
    if (allLecturers.includes(cleanName)) {
      setAddLecturerError("Giảng viên này đã có trong danh sách.");
      return;
    }
    onAddLecturer(cleanName);
    setNewLecturerName("");
    setAddLecturerError("");
    setShowAddLecturerModal(false);
  };

  // Filter records based on search and selected options
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.lecturer && r.lecturer.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchClass = selectedClass === "all" || r.className === selectedClass;
      const matchMajor = selectedMajor === "all" || r.major === selectedMajor;

      const matchAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" && r.lecturer && r.lecturer.trim() !== "") ||
        (assignmentFilter === "unassigned" && (!r.lecturer || r.lecturer.trim() === ""));

      return matchSearch && matchClass && matchMajor && matchAssignment;
    });
  }, [records, searchTerm, selectedClass, selectedMajor, assignmentFilter]);

  // Calculate dynamic lecturer hours chart data
  const lecturerHoursData = useMemo(() => {
    const hourMap: { [lecturer: string]: number } = {};

    // Initialize all lecturers with 0 hours to ensure they show up if needed,
    // or we only show lecturers who have at least one assignment.
    // Let's show all lecturers who have at least some hours, sorted by total hours desc.
    records.forEach((r) => {
      const lec = r.lecturer ? r.lecturer.trim() : "Chưa phân công";
      hourMap[lec] = (hourMap[lec] || 0) + r.hours;
    });

    return Object.entries(hourMap)
      .map(([lecturer, hours]) => ({
        lecturer,
        hours: parseFloat(hours.toFixed(1)),
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [records]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedMajor, assignmentFilter, itemsPerPage]);

  // Theme colors for Chart Bars
  const colors = [
    "#4f46e5", // Indigo
    "#06b6d4", // Cyan
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#8b5cf6", // Violet
    "#3b82f6", // Blue
    "#f97316", // Orange
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Lecturer Hours Chart */}
      <div id="chart-section" className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Biểu Đồ Tổng Số Giờ Giảng Dạy Của Giảng Viên (Cập Nhật Động)
            </h3>
            <p className="text-xs text-slate-500">
              Tổng số giờ AP được cộng dồn theo thời gian thực mỗi khi bạn thay đổi phân công bên dưới.
            </p>
          </div>
          <button
            id="btn-open-add-lecturer"
            onClick={() => {
              setAddLecturerError("");
              setShowAddLecturerModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm giảng viên mới
          </button>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={lecturerHoursData}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="lecturer"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                label={{
                  value: "Số giờ AP",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#64748b", fontSize: 11, fontWeight: 500 },
                  offset: 5,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: any) => [`${value} giờ`, "Tổng giờ dạy"]}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={28}>
                {lecturerHoursData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.lecturer === "Chưa phân công"
                        ? "#cbd5e1" // gray for unassigned
                        : colors[index % colors.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Control Panel: Search & Filter */}
      <div id="filter-controls" className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                placeholder="Môn, tên môn, lớp, giảng viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all"
              />
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lọc theo Lớp</label>
            <select
              id="filter-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all"
            >
              <option value="all">Tất cả lớp ({uniqueClasses.length})</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Major Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lọc Chuyên ngành</label>
            <select
              id="filter-major-select"
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all"
            >
              <option value="all">Tất cả chuyên ngành ({uniqueMajors.length})</option>
              {uniqueMajors.map((m) => (
                <option key={m} value={m}>
                  {m || "Chưa xác định"}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Trạng thái phân công</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                id="filter-assign-all"
                onClick={() => setAssignmentFilter("all")}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  assignmentFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tất cả
              </button>
              <button
                id="filter-assign-yes"
                onClick={() => setAssignmentFilter("assigned")}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  assignmentFilter === "assigned" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Đã phân
              </button>
              <button
                id="filter-assign-no"
                onClick={() => setAssignmentFilter("unassigned")}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  assignmentFilter === "unassigned" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Chưa phân
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Table */}
      <div id="assignment-table-container" className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-150 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Môn</th>
                <th className="px-5 py-3.5">Tên Môn Học</th>
                <th className="px-5 py-3.5">Lớp</th>
                <th className="px-5 py-3.5">Chuyên Ngành</th>
                <th className="px-5 py-3.5">Giảng Viên</th>
                <th className="px-5 py-3.5 text-center">Giờ AP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {record.subjectCode}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-sm">
                      <div className="font-medium text-slate-750 line-clamp-2" title={record.subjectName}>
                        {record.subjectName}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded">
                        {record.className}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-[150px] truncate" title={record.major}>
                      {record.major || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        id={`select-lecturer-${record.id}`}
                        value={record.lecturer || ""}
                        onChange={(e) => onUpdateRecord(record.id, { lecturer: e.target.value })}
                        className={`w-full max-w-[200px] px-2.5 py-1.5 text-xs font-medium rounded-lg border outline-none transition-all cursor-pointer ${
                          record.lecturer
                            ? "bg-indigo-50 border-indigo-200 text-indigo-800 font-semibold"
                            : "bg-amber-50 border-amber-200 text-amber-800 font-semibold animate-pulse"
                        }`}
                      >
                        <option value="" className="text-slate-500 bg-white font-normal">
                          ⚠️ Chọn giảng viên...
                        </option>
                        {allLecturers.map((lec) => (
                          <option key={lec} value={lec} className="text-slate-800 bg-white font-medium">
                            🧑‍🏫 {lec}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-slate-750 whitespace-nowrap">
                      {record.hours}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-500">Không tìm thấy phân công phù hợp</p>
                      <p className="text-xs">Thử điều chỉnh từ khóa tìm kiếm hoặc các tiêu chí bộ lọc</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {filteredRecords.length > 0 && (
          <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <select
                id="items-per-page-select"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-slate-200 px-2 py-1 rounded"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>kết quả trên trang (Tổng {filteredRecords.length} dòng)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-prev-page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 border border-slate-200 bg-white rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <span className="font-medium px-2 text-slate-700">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                id="btn-next-page"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 border border-slate-200 bg-white rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Custom Lecturer Modal */}
      {showAddLecturerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Thêm Giảng Viên Mới</h3>
            <p className="text-xs text-slate-500 mb-4">
              Nhập tên định danh của giảng viên (ví dụ: <code>thanhnt12</code>, <code>giangvt</code>) để đưa vào danh sách phân công.
            </p>

            <form onSubmit={handleAddNewLecturer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên giảng viên / Viết tắt</label>
                <input
                  id="new-lecturer-input"
                  type="text"
                  placeholder="Ví dụ: omar, longndt, cuonghd7"
                  value={newLecturerName}
                  onChange={(e) => {
                    setNewLecturerName(e.target.value);
                    setAddLecturerError("");
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                  autoFocus
                />
                {addLecturerError && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {addLecturerError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
                <button
                  type="button"
                  id="btn-cancel-add-lecturer"
                  onClick={() => setShowAddLecturerModal(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  id="btn-submit-add-lecturer"
                  className="px-3.5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors cursor-pointer"
                >
                  Thêm vào danh sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
