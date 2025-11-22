
import React, { useState, useEffect } from 'react';
import { DashboardStats } from '../types';
import { generateDashboardInsight } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, CalendarCheck, TrendingUp, Sparkles } from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl text-sm z-50">
        <p className="font-bold text-gray-700 mb-2 border-b border-gray-100 pb-1">{label}</p>
        <div className="space-y-1">
          <p className="text-indigo-600 font-semibold flex justify-between gap-4">
            <span>출석률:</span>
            <span>{Math.round(data.rate)}%</span>
          </p>
          <p className="text-gray-500 text-xs flex justify-between gap-4">
            <span>출석 인원:</span>
            <span>{data.count}명</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);

  const handleGetInsight = async () => {
    setLoadingInsight(true);
    const insight = await generateDashboardInsight(stats);
    setAiInsight(insight);
    setLoadingInsight(false);
  };

  useEffect(() => {
      if (!aiInsight && stats.totalStudents > 0) {
          handleGetInsight();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.totalStudents]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">대시보드</h2>
        <p className="text-gray-500 mt-2">교회 학교 출석 현황을 한눈에 확인하세요.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition hover:shadow-md">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">총 등록 학생</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalStudents}명</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition hover:shadow-md">
          <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">최근 출석률</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.attendanceRate.toFixed(1)}%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition hover:shadow-md">
          <div className="p-3 bg-amber-100 rounded-full text-amber-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">지난주 대비</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {stats.recentTrend.length >= 2 
                ? (stats.recentTrend[stats.recentTrend.length - 1].rate - stats.recentTrend[stats.recentTrend.length - 2].rate).toFixed(1) 
                : 0}%
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">주간 출석 추이</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.recentTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} domain={[0, 100]} unit="%" />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{fill: '#f3f4f6'}}
                />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {stats.recentTrend.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === stats.recentTrend.length - 1 ? '#4f46e5' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center">
              <Sparkles className="mr-2" size={20} /> AI 목회 리포트
            </h3>
            <button 
              onClick={handleGetInsight} 
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition"
              disabled={loadingInsight}
            >
              {loadingInsight ? '분석 중...' : '새로고침'}
            </button>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 overflow-y-auto text-sm leading-relaxed shadow-inner">
            {loadingInsight ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2">
                 <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 <p>데이터를 분석하고 있습니다...</p>
              </div>
            ) : (
              aiInsight || "데이터가 충분하지 않아 분석할 수 없습니다. 학생 및 출석 데이터를 입력해주세요."
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
