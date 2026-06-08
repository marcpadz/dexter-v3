import { getTasks } from "@/lib/server/actions/tasks";
import TasksPage from "./tasks-view";

export default async function TasksRoute() {
  const tasks = await getTasks();
  return <TasksPage tasks={tasks} />;
}
