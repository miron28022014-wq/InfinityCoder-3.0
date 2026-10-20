/**
 * Agent roles for the swarm picker in Settings.
 * `tint` is an "R G B" triplet consumed as `rgb(<tint> / α)` in CSS.
 */
export interface AgentDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  tint: string;
  allow: string[];
  maxTurns: number;
  directive: string;
}

export const AGENTS: AgentDef[] = [
  {
    id: "coder",
    name: "Кодер",
    description: "Пишет и правит код, запускает тесты",
    icon: "edit",
    tint: "108 133 255",
    allow: ["read_file", "write_file", "search_files", "run_command"],
    maxTurns: 32,
    directive: "Пиши рабочий код, проверяй результат запусками и правь до зелёных тестов."
  },
  {
    id: "architect",
    name: "Архитектор",
    description: "Планирует структуру и разбивает задачу",
    icon: "layers",
    tint: "178 122 255",
    allow: ["read_file", "list_dir", "search_files"],
    maxTurns: 12,
    directive: "Декомпозируй задачу, фиксируй границы модулей и порядок изменений."
  },
  {
    id: "researcher",
    name: "Исследователь",
    description: "Читает проект, ищет ответы в коде и памяти",
    icon: "search",
    tint: "64 199 148",
    allow: [],
    maxTurns: 16,
    directive: "Ищи ответы в коде и проектной памяти, ничего не меняй."
  },
  {
    id: "reviewer",
    name: "Ревьюер",
    description: "Проверяет диффы, ищет дефекты и риски",
    icon: "shieldCheck",
    tint: "255 158 88",
    allow: ["read_file", "search_files", "run_command"],
    maxTurns: 10,
    directive: "Ревьюнь диффы: ищи дефекты, риски регрессий и нарушения контрактов."
  }
];
