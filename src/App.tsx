/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { LessonPlanForm, LessonPlanParams } from "./components/LessonPlanForm";
import { LessonPlanPreview } from "./components/LessonPlanPreview";
import { generateLessonPlan } from "./lib/gemini";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, BookOpenCheck } from "lucide-react";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (params: LessonPlanParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const content = await generateLessonPlan(params);
      if (content) {
        setLessonPlan(content);
      } else {
        setError("生成教案失败，请稍后重试。");
      }
    } catch (err) {
      console.error(err);
      setError("发生错误，请检查网络连接或 API 配置。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setLessonPlan(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <BookOpenCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">自动教案生成系统</h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
            <span>AI 驱动</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>PDF 导出</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>高效备课</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {!lessonPlan ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <div className="text-center mb-12 space-y-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  智能备课助手
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                  几秒钟内生成<span className="text-primary">专业教案</span>
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  输入科目与知识点，AI 将为您构建结构化的教学方案，包含详尽的知识点讲解与针对性例题。
                </p>
              </div>

              <LessonPlanForm onSubmit={handleGenerate} isLoading={isLoading} />
              
              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-red-500 font-medium"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <LessonPlanPreview content={lessonPlan} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 自动教案生成系统 - 助力教师高效备课</p>
        </div>
      </footer>
    </div>
  );
}

