export function downloadBlob(
  blob: Blob,
  fileName: string,
  fileType: string = "application/octet-stream",
): void {
  if (!(blob instanceof Blob)) {
    console.error("Переданный объект не является Blob.")
    return
  }

  if (!fileName) {
    console.error("Необходимо указать корректное имя файла.")
    return
  }

  const url = URL.createObjectURL(new Blob([blob], { type: fileType }))
  const link = document.createElement("a")
  link.style.display = "none"
  link.href = url
  link.download = fileName

  try {
    document.body.appendChild(link)
    link.click()
  }
  catch (error) {
    console.error("Ошибка при скачивании файла:", error)
  }
  finally {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
