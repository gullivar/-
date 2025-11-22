
import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { Plus, Search, Trash2, Edit2, UserPlus, Wand2, Download, Upload } from 'lucide-react';
import { generateMockStudents } from '../services/geminiService';

interface StudentManagerProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onImportStudents: (students: Student[]) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({ students, onAddStudent, onImportStudents, onUpdateStudent, onDeleteStudent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAdd = () => {
    setCurrentStudent({ id: crypto.randomUUID() });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setCurrentStudent({ ...student });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStudent.name && currentStudent.id) {
      if (students.some(s => s.id === currentStudent.id)) {
        onUpdateStudent(currentStudent as Student);
      } else {
        onAddStudent(currentStudent as Student);
      }
      setIsModalOpen(false);
    }
  };

  const handleGenerateMock = async () => {
      setIsGenerating(true);
      const jsonStr = await generateMockStudents();
      try {
          const mockData: any[] = JSON.parse(jsonStr);
          const newStudents = mockData.map(s => ({
              ...s,
              id: crypto.randomUUID()
          }));
          onImportStudents(newStudents);
      } catch (e) {
          alert("AI 데이터 생성 실패. 다시 시도해주세요.");
      }
      setIsGenerating(false);
  };

  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['이름', '학년', '셀', '담임 선생님', '연락처'];
    const rows = students.map(s => [
      s.name,
      s.grade,
      s.cellName,
      s.teacherName,
      s.phoneNumber || ''
    ]);

    const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `학생명부_${new Date().toISOString().slice(0,10)}.csv`);
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
      // Expect Header: 이름, 학년, 셀(구역) or 셀, 담임 선생님, 연락처
      // Skip header if it looks like a header
      const startIndex = rows[0][0].includes('이름') ? 1 : 0;
      
      const newStudents: Student[] = [];
      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3 || !row[0]) continue; // Need at least name, grade, cell

        newStudents.push({
            id: crypto.randomUUID(),
            name: row[0] || '이름없음',
            grade: row[1] || '3학년',
            cellName: row[2] || '미배정',
            teacherName: row[3] || '',
            phoneNumber: row[4] || ''
        });
      }

      if (newStudents.length > 0) {
          onImportStudents(newStudents);
          alert(`${newStudents.length}명의 학생이 추가되었습니다.`);
      } else {
          alert('추가할 학생 데이터를 찾지 못했습니다.');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || 
    s.cellName.includes(searchTerm) ||
    s.teacherName.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-6">
        <div className="flex flex-col items-start">
          <h2 className="text-3xl font-bold text-gray-800">학생 관리</h2>
          <p className="text-gray-500 text-sm mt-1">총 {students.length}명의 학생이 등록되어 있습니다.</p>
        </div>
        
        {/* Action Buttons Stack */}
        <div className="grid grid-cols-1 gap-2 w-full md:w-64 shrink-0">
            <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />
            <button
                onClick={handleImportClick}
                className="w-full flex items-center justify-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium whitespace-nowrap"
            >
                <Upload size={18} className="mr-2" />
                명단 가져오기
            </button>
            <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium whitespace-nowrap"
            >
                <Download size={18} className="mr-2" />
                명단 내보내기
            </button>
            <button
                onClick={handleGenerateMock}
                disabled={isGenerating}
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition disabled:opacity-50 font-medium whitespace-nowrap"
            >
                <Wand2 size={18} className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? '생성 중...' : 'AI 샘플 데이터'}
            </button>
            <button
                onClick={handleOpenAdd}
                className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium whitespace-nowrap"
            >
                <Plus size={18} className="mr-2" />
                학생 추가
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="이름, 셀, 선생님 이름으로 검색..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-3 py-3 whitespace-nowrap">이름</th>
                <th className="px-3 py-3 whitespace-nowrap">학년</th>
                <th className="px-3 py-3 whitespace-nowrap">셀</th>
                <th className="px-3 py-3 whitespace-nowrap">담임 선생님</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50 transition">
                  <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{student.name}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600">
                        {student.grade}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{student.cellName}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{student.teacherName}</td>
                  <td className="px-3 py-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => handleOpenEdit(student)} className="text-gray-400 hover:text-indigo-600 transition inline-block">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => onDeleteStudent(student.id)} className="text-gray-400 hover:text-red-500 transition inline-block">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                        <UserPlus size={48} className="mb-4 text-gray-300" />
                        <p>등록된 학생이 없습니다.</p>
                        <p className="text-xs mt-1">우측 상단의 버튼을 눌러 학생을 추가해보세요.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">
                {students.some(s => s.id === currentStudent.id) ? '학생 정보 수정' : '새 학생 등록'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={currentStudent.name || ''}
                  onChange={e => setCurrentStudent({...currentStudent, name: e.target.value})}
                  placeholder="예: 김철수"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
                <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={currentStudent.grade || '3학년'}
                    onChange={e => setCurrentStudent({...currentStudent, grade: e.target.value})}
                >
                    {['3학년', '4학년'].map(g => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">셀</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={currentStudent.cellName || ''}
                  onChange={e => setCurrentStudent({...currentStudent, cellName: e.target.value})}
                  placeholder="예: 다윗셀"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담임 선생님</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={currentStudent.teacherName || ''}
                  onChange={e => setCurrentStudent({...currentStudent, teacherName: e.target.value})}
                  placeholder="예: 이영희"
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-md">
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
