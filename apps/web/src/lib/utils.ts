import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化字节数为人类可读的格式
 * @param bytes - 字节数
 * @param decimals - 小数位数，默认 2
 * @returns 格式化后的字符串，如 "1.5 GB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B"
  if (!bytes || isNaN(bytes)) return "0 B"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const index = Math.min(i, sizes.length - 1)

  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(dm))} ${sizes[index]}`
}

/**
 * 格式化速度为人类可读的格式
 * @param bytesPerSecond - 每秒字节数
 * @returns 格式化后的字符串，如 "1.5 MB/s"
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (!bytesPerSecond || isNaN(bytesPerSecond)) return "0 B/s"
  return `${formatBytes(bytesPerSecond)}/s`
}

/**
 * 格式化时长为 HH:MM:SS 或 MM:SS 格式
 * @param seconds - 秒数
 * @returns 格式化后的字符串
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00"

  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
