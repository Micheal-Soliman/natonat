export default function Head() {
  return (
    <>
      {/* Preload the local display font used in the first viewport. */}
      <link rel="preload" href="/Arthaus-Bold.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
    </>
  );
}
