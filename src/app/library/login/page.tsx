import { redirect } from "next/navigation";

export const metadata = {
  title: "Recording library",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LibraryLoginPage() {
  redirect("/library");
}
