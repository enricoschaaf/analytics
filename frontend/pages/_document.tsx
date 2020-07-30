import Document, { Head, Html, Main, NextScript } from "next/document"

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="description" content="Meta description" />
          <meta name="theme-color" content="#f4f5f7" />
          <link
            rel="apple-touch-icon"
            sizes="192x192"
            href="/192x192.png"
          ></link>
          <link rel="manifest" href="/manifest.webmanifest" />
          <link rel="icon" type="image/svg+xml" href="favicon.svg" />
          <link
            rel="preload"
            as="font"
            href="/Inter.var.latin.woff2"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          <script async defer src="/analytics.js" />
        </Head>
        <body className="bg-gray-100 text-gray-900">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
