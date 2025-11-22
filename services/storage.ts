import { Student, DailyAttendance } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'church_app_students',
  ATTENDANCE: 'church_app_attendance',
};

export const storageService = {
  // --- Students ---
  loadStudents: (): Student[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load students", e);
      return [];
    }
  },

  saveStudents: (students: Student[]) => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  // --- Attendance ---
  loadAttendance: (): DailyAttendance[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load attendance", e);
      return [];
    }
  },

  saveAttendance: (history: DailyAttendance[]) => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(history));
  },

  // --- Full DB (JSON File System Simulation) ---
  exportDatabase: (students: Student[], attendance: DailyAttendance[]) => {
    const db = {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        students,
        attendance
      }
    };
    
    const jsonString = JSON.stringify(db, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cho_deung_bu_db_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  importDatabase: async (file: File): Promise<{ students: Student[], attendance: DailyAttendance[] } | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const db = JSON.parse(text);
          
          // Basic validation
          if (!db.data || !Array.isArray(db.data.students) || !Array.isArray(db.data.attendance)) {
            throw new Error("Invalid Database Format");
          }

          resolve({
            students: db.data.students,
            attendance: db.data.attendance
          });
        } catch (err) {
          console.error("DB Import Failed", err);
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
};
