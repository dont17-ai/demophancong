import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TeachingRecord, SubjectStats } from "../types";
import { BookOpen, Users, TrendingUp, AlertTriangle, Search } from "lucide-react";

interface SubjectAnalysisTabProps {
  records: TeachingRecord[];
}

export default function SubjectAnalysisTab({ records }: SubjectAnalysisTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Aggregate statistics for each course (subjectCode)
  const subjectStats = useMemo(() => {
    const map: { [code: string]: { name: string; students: number; lecturers: Set<string>; classCount: number } } = {};

    records.forEach(r => {
      const code = r.subjectCode.trim();
      if (!map[code]) {
        map[code] = {
          name: r.subjectName.trim(),
          students: 0,
          lecturers: new Set(),
          classCount: 0
        };
      }
      map[code].students += r.studentCount;
      map[code].classCount += 1;
      if (r.lecturer && r.lecturer.trim() !== "") {
        map[code].lecturers.add(r.lecturer.trim());
      }
    });

    return Object.entries(map).map(([code, data]) => ({
      subjectCode: code,
      subjectName: data.name,
      totalStudents: data.students,
      lecturerCount: data.lecturers.size,
      lecturerNames: Array.from(data.lecturers),
      classCount: data.classCount
    }));
  }, [records]);

  // Sort and extract extremes
  // 1. Course with the most lecturers teaching
  const mostLecturerSubject = useMemo(() => {
    if (subjectStats.length === 0) return null;
    return [...subjectStats].sort((a, b) => b.lecturerCount - a.lecturerCount)[0];
  }, [subjectStats]);

  // 2. Course with the fewest lecturers teaching (among courses that actually have assigned lecturers, or overall)
  const leastLecturerSubject = useMemo(() => {
    if (subjectStats.length === 0) return null;
    // Sort ascending, but if some have 0, we can prioritize showing courses with at least 1, or show 0 as unassigned.
    // Let's sort strictly ascending.
    return [...subjectStats].sort((a, b) => a.lecturerCount - b.lecturerCount)[0];
  }, [subjectStats]);

  // 3. Course with the most students
  const largestSubject = useMemo(() => {
    if (subjectStats.length === 0) return null;
    return [...subjectStats].sort((a, b) => b.totalStudents - a.totalStudents)[0];
  }, [subjectStats]);

  // 4. Course with the fewest students
  const smallestSubject = useMemo(() => {
    if (subjectStats.length === 0) return null;
    return [...subjectStats].sort((a, b) => a.totalStudents - b.totalStudents)[0];
  }, [subjectStats]);

  // Filtered list for the detail table
  const filteredSubjects = useMemo(() => {
    return subjectStats.filter(s => 
      s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lecturerNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [subjectStats, searchTerm]);

  // Chart data: Sort by lecturer count to make the visual comparisons obvious
  const sortedByLecturerChartData = useMemo(() => {
    return [...subjectStats].sort((a, b) => b.lecturerCount - a.lecturerCount);
  }, [subjectStats]);

  // Chart data: Sort by students count
  const sortedByStudentsChartData = useMemo(() => {
    return [...subjectStats].sort((a, b) => b.totalStudents - a.totalStudents);
  }, [subjectStats]);

  if (subjectStats.length === 0) {
    return (
      <div id="no-subject-data" className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-12 text-center text-slate-500">
        <div className="flex flex-col items-center justify-center gap-2">
          <BookOpen className="w-12 h-12 text-slate-300" />
          <p className="font-semibold text-slate-700">Chưa có dữ liệu môn học</p>
          <p className="text-sm">Hãy kiểm tra và đảm bảo tệp phân công CSV đã được tải thành công.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* High-Level Summaries & Insights */}
      <div id="subject-insights-container" className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Thông Tin Phân Tích & Đối Sách Giữa Các Môn Học
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Most Lecturers */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Môn nhiều GV dạy nhất</div>
            {mostLecturerSubject ? (
              <div>
                <div className="text-lg font-bold text-slate-800">{mostLecturerSubject.subjectCode}</div>
                <div className="text-xs text-slate-500 font-medium truncate" title={mostLecturerSubject.subjectName}>
                  {mostLecturerSubject.subjectName}
                </div>
                <div className="text-xs font-semibold text-emerald-700 mt-2">
                  🧑‍🏫 {mostLecturerSubject.lecturerCount} giảng viên tham gia
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Không có dữ liệu</span>
            )}
          </div>

          {/* Fewest Lecturers */}
          <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-xl">
            <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-1">Môn ít GV dạy nhất</div>
            {leastLecturerSubject ? (
              <div>
                <div className="text-lg font-bold text-slate-800">{leastLecturerSubject.subjectCode}</div>
                <div className="text-xs text-slate-500 font-medium truncate" title={leastLecturerSubject.subjectName}>
                  {leastLecturerSubject.subjectName}
                </div>
                <div className="text-xs font-semibold text-rose-700 mt-2">
                  🧑‍🏫 {leastLecturerSubject.lecturerCount} giảng viên tham gia
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Không có dữ liệu</span>
            )}
          </div>

          {/* Largest Student Base */}
          <div className="p-4 bg-indigo-50/75 border border-indigo-100 rounded-xl">
            <div className="text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">Số sinh viên học đông nhất</div>
            {largestSubject ? (
              <div>
                <div className="text-lg font-bold text-slate-800">{largestSubject.subjectCode}</div>
                <div className="text-xs text-slate-500 font-medium truncate" title={largestSubject.subjectName}>
                  {largestSubject.subjectName}
                </div>
                <div className="text-xs font-semibold text-indigo-700 mt-2">
                  👥 {largestSubject.totalStudents} sinh viên đăng ký
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Không có dữ liệu</span>
            )}
          </div>

          {/* Smallest Student Base */}
          <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl">
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Số sinh viên học ít nhất</div>
            {smallestSubject ? (
              <div>
                <div className="text-lg font-bold text-slate-800">{smallestSubject.subjectCode}</div>
                <div className="text-xs text-slate-500 font-medium truncate" title={smallestSubject.subjectName}>
                  {smallestSubject.subjectName}
                </div>
                <div className="text-xs font-semibold text-amber-700 mt-2">
                  👥 {smallestSubject.totalStudents} sinh viên đăng ký
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Không có dữ liệu</span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Charts: Side-by-Side on desktop */}
      <div id="subject-charts-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lecturers per Course Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-800">Số Lượng Giảng Viên Tham Gia Giảng Dạy</h4>
            <p className="text-xs text-slate-500">Môn có cột cao hơn thể hiện có nhiều thầy cô cùng tham gia gánh vác.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedByLecturerChartData}
                margin={{ top: 5, right: 5, left: -25, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="subjectCode"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  formatter={(value: any) => [`${value} giảng viên`, "Số GV đứng lớp"]}
                />
                <Bar dataKey="lecturerCount" fill="#4f46e5" radius={[3, 3, 0, 0]} barSize={20}>
                  {sortedByLecturerChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.lecturerCount === 0 ? "#cbd5e1" : (entry.lecturerCount >= 3 ? "#10b981" : "#4f46e5")}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Students per Course Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-800">Tổng Số Lượng Sinh Viên Đăng Ký Học</h4>
            <p className="text-xs text-slate-500">Biểu thị quy mô sinh viên học tập của môn học trong học kỳ này.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedByStudentsChartData}
                margin={{ top: 5, right: 5, left: -25, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="subjectCode"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  formatter={(value: any) => [`${value} sinh viên`, "Tổng số sinh viên"]}
                />
                <Bar dataKey="totalStudents" fill="#06b6d4" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subject Stats Detailed Table */}
      <div id="subject-details-table" className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Bảng Tổng Hợp Chi Tiết Theo Môn Học</h4>
            <p className="text-xs text-slate-500 mt-0.5">Tìm kiếm và tra cứu chi tiết danh sách giảng viên tham gia từng môn.</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="search-subject-input"
              type="text"
              placeholder="Tìm môn học, tên môn, giảng viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-3 border-b">Mã Môn</th>
                <th className="px-4 py-3 border-b">Tên Môn Học</th>
                <th className="px-4 py-3 border-b text-center">Số Lớp</th>
                <th className="px-4 py-3 border-b text-center">Tổng SV</th>
                <th className="px-4 py-3 border-b text-center">Số GV</th>
                <th className="px-4 py-3 border-b">Danh Sách Giảng Viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map(s => (
                  <tr key={s.subjectCode} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{s.subjectCode}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={s.subjectName}>
                      {s.subjectName}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700">{s.classCount}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700">{s.totalStudents}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                        s.lecturerCount === 0 
                          ? "bg-rose-50 text-rose-700" 
                          : s.lecturerCount === 1 
                          ? "bg-amber-50 text-amber-700" 
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {s.lecturerCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.lecturerNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.lecturerNames.map(name => (
                            <span key={name} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-100">
                              🧑‍🏫 {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Chưa phân công giảng viên
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                    Không tìm thấy môn học nào khớp với từ khóa tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
