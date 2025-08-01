// app/mindful-daily/page.tsx
import { redirect } from "next/navigation"

export default function JivanaAppRoot() {
  // Redirect to the home dashboard of the Jivana app
  redirect("/mindful-daily/home")
}
