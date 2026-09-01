import type { Metadata } from "next";
import UserProfileContent from "./UserProfileContent";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username}'s Profile — vnrscans`,
  };
}

export default async function Page({ params }: PageProps) {
  const { username } = await params;
  return <UserProfileContent username={username} />;
}
