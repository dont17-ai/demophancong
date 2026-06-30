export interface TeachingRecord {
  id: string;
  subjectCode: string;   // Môn
  subjectName: string;   // Tên môn
  className: string;     // Lớp
  major: string;         // Chuyên ngành
  studentCount: number;  // Số sinh viên cần học
  part: string;          // Part
  lecturer: string;      // Giảng viên
  hours: number;         // Số giờ AP
}

export interface LecturerStats {
  lecturer: string;
  totalHours: number;
  totalClasses: number;
  totalSubjects: number;
  // Detail structures for stacked bar charts
  hoursByClassGroup: {
    [className: string]: number;
  };
  classesBySubject: {
    [subjectCode: string]: number;
  };
  subjectsByClass: {
    [className: string]: number;
  };
}

export interface SubjectStats {
  subjectCode: string;
  subjectName: string;
  totalStudents: number;
  lecturerCount: number;
  lecturerNames: string[];
}

export interface ClassAnalysis {
  className: string;
  courses: {
    subjectCode: string;
    subjectName: string;
    lecturer: string;
    hours: number;
  }[];
  duplicateLecturers: {
    lecturer: string;
    subjects: string[];
  }[];
}
