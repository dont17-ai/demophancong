import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TeachingRecord } from "../types";
import { User, BookOpen, Clock, Layers } from "lucide-react";

interface LecturerAnalysisTabProps {
  records: TeachingRecord[];
}

export default function LecturerAnalysisTab({ records }: LecturerAnalysisTabProps) {
  // Only analyze assigned classes
  const assignedRecords = useMemo(() => {
    return records.filter(r => r.lecturer && r.lecturer.trim() !== "");
  }, [records]);

  // Extract unique lecturers
  const uniqueLecturers = useMemo(() => {
    const list = assignedRecords.map(r => r.lecturer.trim()).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [assignedRecords]);

  // Determine top 2 classes to partition into 3 class groups for "Total Hours Stacked Chart"
  const topClasses = useMemo(() => {
    const hoursByClass: { [className: string]: number } = {};
    assignedRecords.forEach(r => {
      hoursByClass[r.className] = (hoursByClass[r.className] || 0) + r.hours;
    });
    return Object.entries(hoursByClass)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => entry[0]);
  }, [assignedRecords]);

  // General Lecturer statistics
  const stats = useMemo(() => {
    const lecturerData: {
      [name: string]: {
        totalHours: number;
        classes: Set<string>;
        subjects: Set<string>;
        hoursByClassGroup: { [groupName: string]: number };
        classesBySubject: { [subj: string]: number };
        subjectsByClass: { [cls: string]: number };
      };
    } = {};

    // Initialize map
    uniqueLecturers.forEach(lec => {
      lecturerData[lec] = {
        totalHours: 0,
        classes: new Set(),
        subjects: new Set(),
        hoursByClassGroup: {
          [topClasses[0] || "Lớp A"]: 0,
          [topClasses[1] || "Lớp B"]: 0,
          "Lớp khác": 0
        },
        classesBySubject: {},
        subjectsByClass: {}
      };
    });

    // Populate data
    assignedRecords.forEach(r => {
      const lec = r.lecturer.trim();
      if (!lecturerData[lec]) return;

      lecturerData[lec].totalHours += r.hours;
      lecturerData[lec].classes.add(r.className);
      lecturerData[lec].subjects.add(r.subjectCode);

      // 1. Stack total hours by 3 class groups (Top 1, Top 2, Others)
      const group1 = topClasses[0] || "Lớp A";
      const group2 = topClasses[1] || "Lớp B";
      if (r.className === group1) {
        lecturerData[lec].hoursByClassGroup[group1] += r.hours;
      } else if (r.className === group2) {
        lecturerData[lec].hoursByClassGroup[group2] += r.hours;
      } else {
        lecturerData[lec].hoursByClassGroup["Lớp khác"] += r.hours;
      }

      // 2. Total classes: color stacked by different subjects (môn khác nhau)
      lecturerData[lec].classesBySubject[r.subjectCode] = 
        (lecturerData[lec].classesBySubject[r.subjectCode] || 0) + 1;

      // 3. Total subjects: color stacked by different classes (lớp khác nhau)
      lecturerData[lec].subjectsByClass[r.className] = 
        (lecturerData[lec].subjectsByClass[r.className] || 0) + 1;
    });

    return lecturerData;
  }, [assignedRecords, uniqueLecturers, topClasses]);

  // 1. Total Hours Stacked Chart Data (3 colors for 3 classes)
  const hoursChartData = useMemo(() => {
    const group1 = topClasses[0] || "Lớp A";
    const group2 = topClasses[1] || "Lớp B";
    
    return uniqueLecturers.map(lec => {
      const s = stats[lec];
      return {
        lecturer: lec,
        [group1]: parseFloat((s.hoursByClassGroup[group1] || 0).toFixed(1)),
        [group2]: parseFloat((s.hoursByClassGroup[group2] || 0).toFixed(1)),
        "Lớp khác": parseFloat((s.hoursByClassGroup["Lớp khác"] || 0).toFixed(1)),
        total: parseFloat(s.totalHours.toFixed(1))
      };
    });
  }, [uniqueLecturers, stats, topClasses]);

  // 2. Total Classes Stacked Chart Data (different colors for different subjects)
  // We need to identify all unique subjects to create individual stacked bars
  const allSubjects = useMemo(() => {
    const subjs = assignedRecords.map(r => r.subjectCode);
    return Array.from(new Set(subjs)).sort();
  }, [assignedRecords]);

  const classesChartData = useMemo(() => {
    return uniqueLecturers.map(lec => {
      const s = stats[lec];
      const row: any = { lecturer: lec, total: s.classes.size };
      allSubjects.forEach(subj => {
        row[subj] = s.classesBySubject[subj] || 0;
      });
      return row;
    });
  }, [uniqueLecturers, stats, allSubjects]);

  // 3. Total Subjects Stacked Chart Data (different colors for different classes)
  const allClasses = useMemo(() => {
    const clss = assignedRecords.map(r => r.className);
    return Array.from(new Set(clss)).sort();
  }, [assignedRecords]);

  const subjectsChartData = useMemo(() => {
    return uniqueLecturers.map(lec => {
      const s = stats[lec];
      const row: any = { lecturer: lec, total: s.subjects.size };
      allClasses.forEach(cls => {
        row[cls] = s.subjectsByClass[cls] || 0;
      });
      return row;
    });
  }, [uniqueLecturers, stats, allClasses]);

  // High-level summary stats
  const totalHoursSum = useMemo(() => assignedRecords.reduce((sum, r) => sum + r.hours, 0), [assignedRecords]);
  const averageHours = useMemo(() => uniqueLecturers.length ? parseFloat((totalHoursSum / uniqueLecturers.length).toFixed(1)) : 0, [totalHoursSum, uniqueLecturers]);

  const maxHoursLecturer = useMemo(() => {
    if (uniqueLecturers.length === 0) return null;
    let maxLec = uniqueLecturers[0];
    let maxVal = stats[maxLec].totalHours;
    uniqueLecturers.forEach(lec => {
      if (stats[lec].totalHours > maxVal) {
        maxVal = stats[lec].totalHours;
        maxLec = lec;
      }
    });
    return { name: maxLec, hours: maxVal };
  }, [uniqueLecturers, stats]);

  const minHoursLecturer = useMemo(() => {
    if (uniqueLecturers.length === 0) return null;
    let minLec = uniqueLecturers[0];
    let minVal = stats[minLec].totalHours;
    uniqueLecturers.forEach(lec => {
      if (stats[lec].totalHours < minVal) {
        minVal = stats[lec].totalHours;
        minLec = lec;
      }
    });
    return { name: minLec, hours: minVal };
  }, [uniqueLecturers, stats]);

  // Color generator palette
  const subjectColors = [
    "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", 
    "#8b5cf6", "#3b82f6", "#f97316", "#14b8a6", "#6366f1",
    "#a855f7", "#d946ef", "#059669", "#d97706", "#b91c1c"
  ];

  const classColors = [
    "#059669", "#3b82f6", "#f59e0b", "#d946ef", "#06b6d4",
    "#4f46e5", "#b91c1c", "#8b5cf6", "#f97316", "#14b8a6",
    "#475569", "#0284c7", "#7c3aed", "#be185d", "#4d7c0f"
  ];

  if (uniqueLecturers.length === 0) {
    return (
      <div id="no-lecturer-data" className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-12 text-center text-slate-500">
        <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
          <User className="w-12 h-12 text-slate-300 animate-bounce" />
          <p className="font-semibold text-slate-700 text-base mt-2">Chưa có giảng viên được phân công</p>
          <p className="text-sm text-slate-400">
            Vui lòng phân công giảng viên cho các môn học ở Tab "Phân Công" hoặc tải lên tệp dữ liệu đầy đủ hơn để xem phân tích xếp chồng chi tiết.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual KPI Cards */}
      <div id="lecturer-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Số giảng viên dạy</div>
            <div className="text-2xl font-bold text-slate-800">{uniqueLecturers.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Giờ dạy trung bình</div>
            <div className="text-2xl font-bold text-slate-800">{averageHours}h <span className="text-xs font-normal text-slate-400">/ GV</span></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider font-semibold">Tải trọng cao nhất</div>
            <div className="text-sm font-bold text-slate-850 truncate max-w-[140px]">{maxHoursLecturer?.name}</div>
            <div className="text-xs text-slate-400 font-semibold">{maxHoursLecturer?.hours}h AP</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider font-semibold">Tải trọng thấp nhất</div>
            <div className="text-sm font-bold text-slate-850 truncate max-w-[140px]">{minHoursLecturer?.name}</div>
            <div className="text-xs text-slate-400 font-semibold">{minHoursLecturer?.hours}h AP</div>
          </div>
        </div>
      </div>

      {/* 1. Biểu đồ Stacked Hours: Tổng số giờ với 3 màu cho 3 lớp (Top 1, Top 2, Others) */}
      <div id="lecturer-hours-chart-container" className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            1. Phân Tích Tổng Số Giờ Giảng Dạy (Xếp chồng theo lớp - 3 Nhóm Màu)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Mỗi thanh hiển thị tổng số giờ AP của giảng viên, xếp chồng theo 3 nhóm lớp: <strong>{topClasses[0] || "Lớp A"}</strong>, <strong>{topClasses[1] || "Lớp B"}</strong>, và <strong>Lớp khác</strong>.
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hoursChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="lecturer" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey={topClasses[0] || "Lớp A"} stackId="a" fill="#4f46e5" name={topClasses[0] || "Lớp A"} />
              <Bar dataKey={topClasses[1] || "Lớp B"} stackId="a" fill="#06b6d4" name={topClasses[1] || "Lớp B"} />
              <Bar dataKey="Lớp khác" stackId="a" fill="#e2e8f0" name="Lớp khác" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Biểu đồ Stacked Classes: Tổng số lớp dạy xếp chồng theo môn học */}
      <div id="lecturer-classes-chart-container" className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
            2. Phân Tích Tổng Số Lớp Giảng Dạy (Xếp chồng theo môn học)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tổng số lớp mà từng giảng viên chịu trách nhiệm giảng dạy. Phân biệt màu sắc khác nhau đại diện cho từng <strong>môn học (mã môn)</strong> riêng biệt.
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={classesChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="lecturer" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: 9 }} />
              {allSubjects.map((subj, idx) => (
                <Bar
                  key={subj}
                  dataKey={subj}
                  stackId="b"
                  fill={subjectColors[idx % subjectColors.length]}
                  name={subj}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Biểu đồ Stacked Subjects: Tổng số môn dạy xếp chồng theo lớp */}
      <div id="lecturer-subjects-chart-container" className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            3. Phân Tích Số Lượng Môn Học Phụ Trách (Xếp chồng theo lớp)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Số lượng môn học khác nhau mà giảng viên phụ trách đứng lớp. Các màu sắc chồng lên nhau thể hiện sự phân bổ trên các <strong>lớp học</strong> khác nhau.
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={subjectsChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="lecturer" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
              {/* Note: since there can be lots of classes, we render custom legend or omit full classes listing to prevent clutter */}
              <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: 9 }} />
              {allClasses.map((cls, idx) => (
                <Bar
                  key={cls}
                  dataKey={cls}
                  stackId="c"
                  fill={classColors[idx % classColors.length]}
                  name={cls}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
