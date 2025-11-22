
import React, { useState, useEffect, useRef } from 'react';
import { Student, DailyAttendance, AttendanceStatus } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Save, CheckCircle2, XCircle, Clock, AlertCircle, Download, Upload } from 'lucide-react';

interface AttendanceTrackerProps {
  students: Student[];
  attendanceHistory: DailyAttendance[];
  onSaveAttendance: (date: string, records: any[]) => void;
  onImportAttendance: (history: DailyAttendance[]) => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ students, attendanceHistory, onSaveAttendance, onImportAttendance }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentRecords, setCurrentRecords] = useState<Record<string, AttendanceStatus>>({});
  const [filterCell, setFilterCell] = useState<string>("All");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize records when date changes
  useEffect(() => {
    const history = attendanceHistory.find(d => d.date === selectedDate);
    const initialRecords: Record<string, AttendanceStatus> = {};
    
    students.forEach(s => {
      const existing = history?.records.find(r => r.studentId === s.id);
      // Default to ABSENT if no record found for new day, or keep existing status
      initialRecords[s.id] = existing ? existing.status : AttendanceStatus.ABSENT;
    });
    
    setCurrentRecords(initialRecords);
  }, [selectedDate, students, attendanceHistory]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setCurrentRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = () => {
    const records = Object.entries(currentRecords).map(([studentId, status]) => ({
      studentId,
      status
    }));
    onSaveAttendance(selectedDate, records);
    alert('출석이 저장되었습니다.');
  };

  const toggleStatus = (studentId: string) => {
    const current = currentRecords[studentId];
    const statuses = Object.values(AttendanceStatus);
    const currentIndex = statuses.indexOf(current);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    handleStatusChange(studentId, nextStatus);
  };

  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    // Get all unique dates from history, sort them
    const sortedDates = attendanceHistory
        .map(h => h.date)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Ensure selectedDate is included if it's not in history yet
    if (!sortedDates.includes(selectedDate) && attendanceHistory.length > 0) {
        // Optional: decide if we want to export current unsaved state. 
    }

    const headers = ['이름', '학년', '셀(구역)', ...sortedDates];
    
    const rows = students.map(s => {
        const attendanceCells = sortedDates.map(date => {
            const record = attendanceHistory.find(h => h.date === date)?.records.find(r => r.studentId === s.id);
            return record ? record.status : '-'; 
        });
        return [s.name, s.grade, s.cellName, ...attendanceCells];
    });

    const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `출석부_전체_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      // Simple CSV parser
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      
      if (rows.length < 1) return;

      const header = rows[0];
      // Assume first 3 columns are Name, Grade, Cell
      // subsequent columns are dates (YYYY-MM-DD)
      
      const dateColumns: {index: number, date: string}[] = [];
      
      // Find columns that look like dates
      header.forEach((col, idx) => {
          if (idx >= 3 && col.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dateColumns.push({ index: idx, date: col });
          }
      });

      if (dateColumns.length === 0) {
          alert("날짜 형식이 포함된 열을 찾을 수 없습니다. (형식: YYYY-MM-DD)");
          return;
      }

      const newDailyData: DailyAttendance[] = [];
      // Prepare structure
      dateColumns.forEach(dc => {
          newDailyData.push({ date: dc.date, records: [] });
      });

      // Process rows
      let successCount = 0;
      for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 3) continue;
          
          const name = row[0];
          const cellName = row[2];
          
          // Match student
          // Try match by Name AND Cell first, then just Name
          let student = students.find(s => s.name === name && s.cellName === cellName);
          if (!student) {
              student = students.find(s => s.name === name);
          }
          
          if (student) {
              successCount++;
              dateColumns.forEach((dc, dIndex) => {
                  const statusStr = row[dc.index];
                  // Validate status
                  let status = AttendanceStatus.ABSENT;
                  if (Object.values(AttendanceStatus).includes(statusStr as AttendanceStatus)) {
                      status = statusStr as AttendanceStatus;
                  } else if (statusStr === '-' || statusStr === '') {
                      return; // Skip empty records
                  }
                  
                  newDailyData[dIndex].records.push({
                      studentId: student!.id,
                      status: status
                  });
              });
          }
      }

      onImportAttendance(newDailyData);
      alert(`${dateColumns.length}일치 출석 기록을 불러왔습니다. (매칭된 학생: ${successCount}명)`);

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case AttendanceStatus.ABSENT: return 'text-red-600 bg-red-50 border-red-200';
      case AttendanceStatus.LATE: return 'text-amber-600 bg-amber-50 border-amber-200';
      case AttendanceStatus.EXCUSED: return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return <CheckCircle2 size={18} />;
      case AttendanceStatus.ABSENT: return <XCircle size={18} />;
      case AttendanceStatus.LATE: return <Clock size={18} />;
      case AttendanceStatus.EXCUSED: return <AlertCircle size={18} />;
    }
  };

  const uniqueCells = Array.from(new Set(students.map(s => s.cellName)));
  const filteredStudents = filterCell === "All" ? students : students.filter(s => s.cellName === filterCell);

  const presentCount = Object.values(currentRecords).filter(s => s === AttendanceStatus.PRESENT).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">출석부</h2>
          <p className="text-gray-500 mt-1">날짜를 선택하고 학생들의 출석 상태를 관리하세요.</p>
        </div>
        <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1">
            <button 
                onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
            >
                <ChevronLeft size={20} />
            </button>
            <div className="flex items-center px-4 font-medium text-gray-700">
                <Calendar size={18} className="mr-2 text-indigo-600" />
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent focus:outline-none cursor-pointer"
                />
            </div>
            <button 
                 onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      </div>

      {/* Quick Stats & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
         <div className="bg-indigo-600 text-white rounded-xl p-6 shadow-md flex flex-col justify-between">
             <div className="flex items-center justify-between mb-4">
                 <p className="text-indigo-100 text-sm font-medium">오늘 출석 현황</p>
                 <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                     <CheckCircle2 size={16} />
                 </div>
             </div>
             <div>
                 <p className="text-4xl font-bold mb-1">{presentCount} <span className="text-xl font-normal text-indigo-200">/ {students.length}</span></p>
                 <p className="text-xs text-indigo-200">현재 출석률 {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%</p>
             </div>
         </div>
         
         <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 col-span-2 flex flex-col gap-3">
             {/* Filter */}
             <div className="w-full">
                 <select 
                    value={filterCell} 
                    onChange={(e) => setFilterCell(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 text-base font-medium"
                 >
                     <option value="All">모든 셀(구역) 보기</option>
                     {uniqueCells.map(cell => <option key={cell} value={cell}>{cell}</option>)}
                 </select>
             </div>
             
             {/* Actions Stack - Full width rows */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                />
                
                <button
                    onClick={handleImportClick}
                    className="w-full flex items-center justify-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm font-bold"
                    title="출석부 파일 불러오기"
                >
                    <Upload size={18} className="mr-2" />
                    가져오기
                </button>
                
                <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center justify-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm font-bold"
                    title="전체 출석 기록 다운로드"
                >
                    <Download size={18} className="mr-2" />
                    내보내기
                </button>
                
                <button 
                    onClick={handleSave}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition shadow-md"
                >
                    <Save size={18} className="mr-2" />
                    출석상태 내용 저장
                </button>
             </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-gray-500 font-medium text-sm py-3 px-4">
              <div className="col-span-3 md:col-span-2">이름</div>
              <div className="col-span-3 md:col-span-2">셀</div>
              <div className="col-span-6 md:col-span-8 text-center">출석 상태</div>
          </div>
          
          <div className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? filteredStudents.map(student => (
                  <div key={student.id} className="grid grid-cols-12 items-center py-4 px-4 hover:bg-gray-50 transition">
                      <div className="col-span-3 md:col-span-2 font-medium text-gray-900">
                          {student.name}
                          <div className="text-xs text-gray-400 font-normal md:hidden">{student.cellName}</div>
                      </div>
                      <div className="col-span-3 md:col-span-2 text-gray-600 hidden md:block">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">{student.cellName}</span>
                      </div>
                      
                      <div className="col-span-9 md:col-span-8 flex justify-end md:justify-center gap-2">
                          {/* Mobile Toggle */}
                          <button 
                            onClick={() => toggleStatus(student.id)}
                            className={`md:hidden w-full flex items-center justify-center px-4 py-2 rounded-lg border transition ${getStatusColor(currentRecords[student.id])}`}
                          >
                              {getStatusIcon(currentRecords[student.id])}
                              <span className="ml-2 font-medium">{currentRecords[student.id]}</span>
                          </button>

                          {/* Desktop Buttons */}
                          <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
                              {Object.values(AttendanceStatus).map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusChange(student.id, status)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ${
                                        currentRecords[student.id] === status 
                                        ? 'bg-white text-gray-800 shadow-sm ring-1 ring-black/5' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                  >
                                      {currentRecords[student.id] === status && getStatusIcon(status)}
                                      {status}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              )) : (
                  <div className="p-8 text-center text-gray-400">
                      학생 데이터가 없습니다. 학생 관리 메뉴에서 학생을 추가해주세요.
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
