export default function Head() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://connect.facebook.net" />
      <link rel="preconnect" href="https://www.facebook.com" />
      {/* Preload local display font and LCP image to improve LCP */}
      <link rel="preload" href="/Arthaus-Bold.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      <link rel="preload" href="/1111.png" as="image" />
    </>
  );
}
