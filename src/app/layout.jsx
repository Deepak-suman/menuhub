import "./globals.css";

export const viewport = {
  themeColor: "#ffffff",
};

export const metadata = {
  title: "Jambo",
  description: "Restaurant order management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jambo",
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