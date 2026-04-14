import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, BookOpen, MapPin, GraduationCap, BarChart } from "lucide-react";

export interface LessonPlanParams {
  subject: string;
  topic: string;
  region: string;
  grade: string;
  difficulty: string;
}

interface Props {
  onSubmit: (data: LessonPlanParams) => void;
  isLoading: boolean;
}

const subjects = ["数学", "语文", "英语", "物理", "化学", "生物", "历史", "地理", "政治"];
const regions = ["江苏省", "浙江省", "北京市", "上海市", "广东省", "山东省", "湖北省", "四川省", "其他"];
const grades = ["小学", "初一", "初二", "初三", "高一", "高二", "高三"];
const difficulties = ["简单", "中等", "较难", "竞赛级"];

export function LessonPlanForm({ onSubmit, isLoading }: Props) {
  const [formData, setFormData] = React.useState<LessonPlanParams>({
    subject: "数学",
    topic: "",
    region: "江苏省",
    grade: "初三",
    difficulty: "中等",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic) return;
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          教案生成参数
        </CardTitle>
        <CardDescription>输入相关信息，AI 将为您生成标准化的教案内容。</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> 科目
            </Label>
            <Select
              value={formData.subject}
              onValueChange={(v) => setFormData({ ...formData, subject: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择科目" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> 知识点
            </Label>
            <Input
              placeholder="例如：一元二次方程、古诗词鉴赏"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> 地区
              </Label>
              <Select
                value={formData.region}
                onValueChange={(v) => setFormData({ ...formData, region: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择地区" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> 年级
              </Label>
              <Select
                value={formData.grade}
                onValueChange={(v) => setFormData({ ...formData, grade: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BarChart className="w-4 h-4" /> 难度
            </Label>
            <Select
              value={formData.difficulty}
              onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择难度" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full py-6 text-lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                正在生成中...
              </>
            ) : (
              "立即生成教案"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
