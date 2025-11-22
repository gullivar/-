
import React, { useRef } from 'react';
import { Student, DailyAttendance } from '../types';
import { storageService } from '../services/storage';
import { Database, Upload, Download, Settings as SettingsIcon } from 'lucide-react';

interface SettingsProps {
  students: Student[];
  attendanceHistory: DailyAttendance[];
  onRestoreDatabase: (file: File) => void;
}

const Settings: React.FC<SettingsProps> = ({ students, attendanceHistory, onRestoreDatabase }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportDB = () => {
    storageService.exportDatabase(students, attendanceHistory);
  };

  const handleImportDBClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onRestoreDatabase) {
      onRestoreDatabase(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <SettingsIcon className="text-gray-800" size={32}/>
                설정
            </h2>
            <p className="text-gray-500 mt-2">시스템 데이터 백업 및 복원 설정을 관리합니다.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">시스템 데이터 관리 (JSON 파일 DB)</h3>
                <p className="text-sm text-gray-500">전체 데이터를 안전하게 백업하고 복원합니다.</p>
              </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
                  <div className="space-y-2">
                      <p className="font-bold text-gray-800 text-lg">전체 백업 및 복원</p>
                      <div className="text-gray-600 leading-relaxed space-y-1">
                          <p>• 학생 명단과 출석 기록 전체를 하나의 <strong>JSON 파일</strong>로 저장합니다.</p>
                          <p>• PC를 옮기거나 브라우저 캐시를 삭제하기 전에 반드시 백업하세요.</p>
                          <p>• 복원 시 현재 데이터는 덮어씌워집니다.</p>
                      </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                      <input 
                          type="file" 
                          accept=".json" 
                          ref={fileInputRef} 
                          className="hidden" 
                          onChange={handleFileChange}
                      />
                      <button 
                          onClick={handleImportDBClick}
                          className="w-full sm:w-auto flex items-center justify-center px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition font-bold shadow-sm text-lg whitespace-nowrap"
                      >
                          <Upload size={22} className="mr-2 text-gray-500" />
                          데이터 복원 (Import)
                      </button>
                      <button 
                          onClick={handleExportDB}
                          className="w-full sm:w-auto flex items-center justify-center px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold shadow-md text-lg whitespace-nowrap"
                      >
                          <Download size={22} className="mr-2" />
                          전체 백업 (Export)
                      </button>
                  </div>
              </div>
          </div>
        </div>
    </div>
  );
};

export default Settings;
