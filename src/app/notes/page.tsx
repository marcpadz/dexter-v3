import { getNotes } from "@/lib/server/actions/notes";
import NotesPage from "./notes-view";

export default async function NotesRoute() {
  const notes = await getNotes();
  return <NotesPage notes={notes} />;
}
