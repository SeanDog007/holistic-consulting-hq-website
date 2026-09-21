import { redirect } from "next/navigation";

// This host serves the recording library. The marketing site lives at
// holisticconsultinghq.com.
export default function HomePage() {
  redirect("/library");
}
