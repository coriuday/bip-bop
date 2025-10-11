import { api } from "~/trpc/server";
import UserProfile from "~/app/_components/user-profile";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

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
