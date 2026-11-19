import Image from "next/image";

const THUMBNAIL = "aspect-[750/1024] h-12 w-auto shrink-0 rounded-lg";

interface AnecdoteThumbnailProps {
  imageUrl: string | null;
}

export const AnecdoteThumbnail = ({ imageUrl }: AnecdoteThumbnailProps) => {
  if (imageUrl === null) {
    return (
      <span
        role="img"
        title="No image"
        aria-label="No image"
        className={`${THUMBNAIL} border border-zinc-300 border-dashed`}
      />
    );
  }
  // The file is fetched as stored and only once its row nears the viewport.
  return (
    <Image
      src={imageUrl}
      alt="Anecdote Image"
      width={750}
      height={1024}
      loading="lazy"
      unoptimized
      className={`${THUMBNAIL} bg-zinc-100 object-cover`}
    />
  );
};
