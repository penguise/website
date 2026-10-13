"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"

type UnityInstance = {
  Quit: () => Promise<void>
}

type UnityConfig = {
  dataUrl: string
  frameworkUrl: string
  codeUrl: string
  streamingAssetsUrl: string
  companyName: string
  productName: string
  productVersion: string
  matchWebGLToCanvasSize: boolean
  autoSyncPersistentDataPath: boolean
}

declare global {
  interface Window {
    createUnityInstance: (
      canvas: HTMLCanvasElement,
      config: UnityConfig
    ) => Promise<UnityInstance>
  }
}

function reportError(error: unknown) {
  console.error("Unable to start Penguise.", error)
  window.alert(
    "Unable to start Penguise. Please reload the page and try again."
  )
}

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lifecycleRef = useRef<Promise<void>>(Promise.resolve())
  const [loaderReady, setLoaderReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!loaderReady || !canvas) return

    let disposed = false
    let instance: UnityInstance | undefined

    // Serialize startup and shutdown so React remounts cannot run two instances.
    lifecycleRef.current = lifecycleRef.current
      .then(async () => {
        if (disposed) return

        instance = await window.createUnityInstance(canvas, {
          dataUrl: "/penguise/Build/penguise.data.br",
          frameworkUrl: "/penguise/Build/penguise.framework.js.br",
          codeUrl: "/penguise/Build/penguise.wasm.br",
          streamingAssetsUrl: "/penguise/StreamingAssets",
          companyName: "DefaultCompany",
          productName: "Penguise",
          productVersion: "1.0",
          matchWebGLToCanvasSize: true,
          autoSyncPersistentDataPath: true,
        })

        if (!disposed) canvas.focus()
      })
      .catch((error: unknown) => {
        if (!disposed) reportError(error)
      })

    return () => {
      disposed = true
      lifecycleRef.current = lifecycleRef.current
        .then(async () => {
          await instance?.Quit()
        })
        .catch((error: unknown) => {
          console.error("Unable to stop Penguise.", error)
        })
    }
  }, [loaderReady])

  return (
    <main className="fixed inset-0 overflow-hidden">
      <canvas
        id="unity-canvas"
        ref={canvasRef}
        aria-label="Penguise"
        tabIndex={0}
        className="block size-full outline-none"
      />
      <Script
        src="/penguise/Build/penguise.loader.js"
        onReady={() => setLoaderReady(true)}
        onError={reportError}
      />
    </main>
  )
}
