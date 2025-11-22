export enum AttendanceStatus {
  PRESENT = '출석',
  ABSENT = '결석',
  LATE = '지각',
  EXCUSED = '공결',
}

export interface Student {
  id: string;
  name: string;
  cellName: string; // 구역/목장 이름
  grade: string;    // 학년
  teacherName: string; // 담임 선생님
  phoneNumber?: string;
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface DailyAttendance {
  date: string; // YYYY-MM-DD
  records: AttendanceRecord[];
}

export interface DashboardStats {
  totalStudents: number;
  attendanceRate: number; // Percentage
  recentTrend: { date: string; rate: number; count: number }[];
}