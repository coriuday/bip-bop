import { api } from "~/trpc/server";
import UserProfile from "~/app/_components/user-profile";

type Props = {
  params: Promise<{
    username: string;
  }>;
};
import type { Metadata } from "next";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await api.user.getByUsername({ username }).catch(() => null);

  if (!user) {
    return { title: "User Not Found | BipBop" };
  }

  const title = `${user.name} (@${user.username}) | BipBop`;
  const description = user.bio ?? `Check out ${user.name}'s videos on BipBop!`;
  const image = user.image ?? "https://bipbop.com/default-avatar.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://bipbop.com/${user.username}`,
      images: [{ url: image }],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const user = await api.user.getByUsername({ username });

  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-2xl">User not found.</p>
      </div>
    );
  }

  return <UserProfile user={user} />;
}
