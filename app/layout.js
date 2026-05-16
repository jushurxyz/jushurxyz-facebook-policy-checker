export const metadata = {
  title: "Facebook Policy Checker",
  description: "Analisi preliminare di possibili violazioni delle Regole della Community Meta"
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}