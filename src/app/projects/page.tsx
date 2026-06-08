import { getProjects } from "@/lib/server/actions/projects";
import ProjectsPage from "./projects-view";

export default async function ProjectsRoute() {
  const projects = await getProjects();
  return <ProjectsPage projects={projects} />;
}
