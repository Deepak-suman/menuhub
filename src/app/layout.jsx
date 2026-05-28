import "./globals.css";

export const viewport = {
  themeColor: "#ffffff",
};

export const metadata = {
  title: "MenuHub",
  description: "Restaurant order management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MenuHub",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}