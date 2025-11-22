
import React from 'react';
import { Loader2, Database } from 'lucide-react';

interface GlobalLoadingProps {
  isLoading: boolean;
}

const GlobalLoading: React.FC<GlobalLoadingProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center flex-col transition-opacity duration-300">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-slight max-w-sm text-center">
        <div className="relative mb-4">
            <Database size={48} className="text-indigo-200" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={24} className="text-indigo-600 animate-spin" />
            </div>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">데이터 처리 중...</h3>
        <p className="text-sm text-gray-500">
          데이터베이스에 안전하게 저장하고 있습니다.<br/>
          잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
};

export default GlobalLoading;
