import { profileInitials } from "@/lib/auth/profile";

type AccountAvatarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md";
  className?: string;
};

const sizeClass = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-14 w-14 text-sm",
} as const;

export function AccountAvatar({
  name,
  email,
  image,
  size = "md",
  className = "",
}: AccountAvatarProps) {
  const dim = sizeClass[size];

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className={`rounded-full border border-slate-200 object-cover ${dim} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-sky-100 font-semibold text-sky-800 ${dim} ${className}`}
      aria-hidden
    >
      {profileInitials(name, email)}
    </div>
  );
}
