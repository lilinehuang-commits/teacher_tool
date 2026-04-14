import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface LessonPlanParams {
  subject: string;
  topic: string;
  region: string;
  grade?: string;
  difficulty?: string;
}

export async function generateLessonPlan(params: LessonPlanParams) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    你是一位资深的教育专家。请根据以下参数生成一份标准化的教案。
    
    参数：
    - 科目：${params.subject}
    - 知识点：${params.topic}
    - 地区：${params.region}
    - 年级：${params.grade || "未指定"}
    - 难度：${params.difficulty || "中等"}
    
    教案结构要求（使用 Markdown 格式）：
    1. 标题：格式为 "[${params.region}] ${params.subject} - ${params.topic} 教案"
    2. 教学目标：简要列出 3 点。
    3. 知识点讲解：结构化说明定义、公式、核心逻辑和注意事项。
       - **数学/科学公式**：请务必使用 LaTeX 格式（行内公式使用 $...$，块级公式使用 $$...$$）。
       - **重点内容**：使用加粗或引用块突出。
    4. 例题部分：提供 3-5 道例题，难度从简单到中等再到稍难。
       - **重要要求**：每道例题后必须预留足够的作答空白。在 Markdown 中可以使用多个换行符或提示语如 "（请在此处作答）" 并留出 5-8 行的空白感。
    5. 知识点小结：简要总结核心内容。
    
    语言：中文。
    排版要求：清晰、规范，适合打印。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    throw error;
  }
}
