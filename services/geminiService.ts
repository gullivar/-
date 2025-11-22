
import { GoogleGenAI } from "@google/genai";
import { DashboardStats } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDashboardInsight = async (stats: DashboardStats): Promise<string> => {
  try {
    const prompt = `
      당신은 초등부 교회 학교의 베테랑 부장 선생님입니다.
      다음 출석 통계를 바탕으로 선생님들에게 도움이 될만한 짧고 따뜻한 격려의 말과 
      데이터에 기반한 간단한 분석 코멘트를 한국어로 작성해주세요.
      대상은 3학년, 4학년 학생들입니다.
      
      데이터:
      - 전체 학생 수: ${stats.totalStudents}명
      - 오늘/최근 평균 출석률: ${stats.attendanceRate.toFixed(1)}%
      - 최근 5주 추세: ${JSON.stringify(stats.recentTrend)}
      
      말투는 정중하고 부드럽게, 300자 이내로 요약해주세요. 어린이들을 사랑하는 마음을 담아주세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "분석 정보를 불러오지 못했습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 분석 서비스를 일시적으로 사용할 수 없습니다.";
  }
};

export const generateMockStudents = async (): Promise<string> => {
    try {
        const prompt = `
          한국 교회 초등부(3학년, 4학년) 학생 5명의 가상 데이터를 JSON 배열 형식으로 생성해주세요.
          각 객체는 다음 필드를 가져야 합니다:
          - name (한국 이름)
          - cellName (예: 3학년 1반, 3학년 2반, 4학년 1반, 4학년 2반 등. 3학년은 1~4반, 4학년은 1~4반까지 있음)
          - grade (3학년, 4학년 중 하나)
          - teacherName (한국 선생님 이름)
          
          JSON만 출력하고 마크다운이나 다른 텍스트는 포함하지 마세요.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        return response.text || "[]";
    } catch (error) {
        console.error("Gemini Mock Data Error", error);
        return "[]";
    }
}
