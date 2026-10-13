"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"

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
      config: UnityConfig,
      onProgress: (progress: number) => void
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
  const [progress, setProgress] = useState(0)
  const [gameReady, setGameReady] = useState(false)
  const [loadingFailed, setLoadingFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!loaderReady || !canvas) return

    let disposed = false
    let instance: UnityInstance | undefined

    // Serialize startup and shutdown so React remounts cannot run two instances.
    lifecycleRef.current = lifecycleRef.current
      .then(async () => {
        if (disposed) return

        instance = await window.createUnityInstance(
          canvas,
          {
            dataUrl: "/penguise/Build/penguise.data.br",
            frameworkUrl: "/penguise/Build/penguise.framework.js.br",
            codeUrl: "/penguise/Build/penguise.wasm.br",
            streamingAssetsUrl: "/penguise/StreamingAssets",
            companyName: "DefaultCompany",
            productName: "Penguise",
            productVersion: "1.0",
            matchWebGLToCanvasSize: true,
            autoSyncPersistentDataPath: true,
          },
          (value) => {
            if (!disposed) setProgress(value)
          }
        )

        if (!disposed) {
          setGameReady(true)
          canvas.focus()
        }
      })
      .catch((error: unknown) => {
        if (!disposed) {
          setLoadingFailed(true)
          reportError(error)
        }
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
    <main
      aria-busy={!gameReady && !loadingFailed}
      className="fixed inset-0 overflow-hidden"
    >
      <canvas
        id="unity-canvas"
        ref={canvasRef}
        aria-label="Penguise"
        tabIndex={0}
        className="block size-full outline-none"
      />
      {!gameReady && (
        <div className="absolute inset-0 grid place-items-center bg-background p-6">
          {loadingFailed ? (
            <p role="alert" className="text-center text-sm text-destructive">
              Unable to start Penguise. Please reload the page and try again.
            </p>
          ) : progress >= 0.9 ? (
            <div role="status" className="flex items-center gap-3 text-sm">
              <Spinner aria-hidden="true" />
              <span>Preparing game…</span>
            </div>
          ) : (
            <Progress
              value={Math.round(progress * 100)}
              className="w-full max-w-xs"
            >
              <ProgressLabel aria-live="polite">
                Loading Penguise…
              </ProgressLabel>
              <ProgressValue />
            </Progress>
          )}
        </div>
      )}
      <Script
        src="/penguise/Build/penguise.loader.js"
        onReady={() => setLoaderReady(true)}
        onError={(error) => {
          setLoadingFailed(true)
          reportError(error)
        }}
      />
    </main>
  )
}
