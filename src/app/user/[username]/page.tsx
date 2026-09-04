import type { Metadata } from "next";
import UserProfileContent from "./UserProfileContent";

type PageProps = {
  params: Promise<{ username: string }>;
};

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const decoded = safeDecode(username);
  return {
    title: `${decoded}'s Profile — vnrscans`,
  };
}

export default async function Page({ params }: PageProps) {
  const { username } = await params;
  const decoded = safeDecode(username);
  return <UserProfileContent username={decoded} />;
}
